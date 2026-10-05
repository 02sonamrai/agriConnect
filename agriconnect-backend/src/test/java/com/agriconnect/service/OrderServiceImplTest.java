package com.agriconnect.service;

import com.agriconnect.dto.OrderItemResponse;
import com.agriconnect.dto.OrderResponse;
import com.agriconnect.dto.ReceivedOrderResponse;
import com.agriconnect.entity.CartItem;
import com.agriconnect.entity.CollectedFarmer;
import com.agriconnect.entity.Crop;
import com.agriconnect.entity.Order;
import com.agriconnect.entity.OrderItem;
import com.agriconnect.entity.Role;
import com.agriconnect.entity.User;
import com.agriconnect.exception.CustomException;
import com.agriconnect.repository.CartItemRepository;
import com.agriconnect.repository.OrderItemRepository;
import com.agriconnect.repository.OrderRepository;
import com.agriconnect.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderServiceImplTest {

    @Mock
    private OrderRepository orderRepository;
    @Mock
    private OrderItemRepository orderItemRepository;
    @Mock
    private CartItemRepository cartItemRepository;
    @Mock
    private UserRepository userRepository;
    // Required: OrderServiceImpl's constructor now takes a NotificationService, and placeOrder
    // calls it. Without this mock it would be injected as null and fail at the notification.
    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private OrderServiceImpl orderService;

    private User buyer() {
        return User.builder().id(7L).email("buyer@example.test").firstName("Test").lastName("Buyer").build();
    }

    private Crop wheat() {
        return Crop.builder()
                .id(9L).cropName("Wheat").category("Grains")
                .quantity(new BigDecimal("50")).unit("Kg")
                .pricePerUnit(new BigDecimal("20")).available(true)
                .farmer(User.builder().id(3L).firstName("Suresh").lastName("Kumar")
                        .phoneNumber("9000000000").build())
                .build();
    }

    private CartItem cartLine(User buyer, Crop crop, String qty) {
        return CartItem.builder()
                .id(1L).buyer(buyer).crop(crop)
                .quantity(new BigDecimal(qty))
                .unitPrice(crop.getPricePerUnit())
                .build();
    }

    @Test
    void emptyCartCannotBecomeAnOrder() {
        when(userRepository.findByEmail("buyer@example.test")).thenReturn(Optional.of(buyer()));
        when(cartItemRepository.findByBuyerIdOrderByIdAsc(7L)).thenReturn(List.of());

        CustomException ex = assertThrows(CustomException.class,
                () -> orderService.placeOrder(null, "buyer@example.test"));

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        verify(orderRepository, never()).save(any());
    }

    @Test
    void placingAnOrderSnapshotsTheListingAndEmptiesTheCart() {
        User buyer = buyer();
        Crop crop = wheat();
        CartItem line = cartLine(buyer, crop, "5");

        when(userRepository.findByEmail("buyer@example.test")).thenReturn(Optional.of(buyer));
        when(cartItemRepository.findByBuyerIdOrderByIdAsc(7L)).thenReturn(List.of(line));
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> {
            Order o = inv.getArgument(0);
            if (o.getId() == null) {
                o.setId(31L);
            }
            return o;
        });

        OrderResponse response = orderService.placeOrder("Deliver ASAP", "buyer@example.test");

        assertEquals("ORD-000031", response.getOrderNumber());
        assertEquals(0, new BigDecimal("100.00").compareTo(response.getTotalAmount()));
        assertEquals("Deliver ASAP", response.getNote());
        assertEquals(1, response.getItemCount());

        OrderItemResponse item = response.getItems().get(0);
        assertEquals("Wheat", item.getCropName());
        assertEquals("Suresh Kumar", item.getSellerName());
        assertEquals(OrderItem.SELLER_TYPE_FARMER, item.getSellerType());
        assertFalse(item.getCollectedFarmerListing());

        verify(orderRepository, times(2)).save(any(Order.class));
        verify(cartItemRepository).deleteAll(List.of(line));
    }

    /**
     * Regression guard. order_number is NOT NULL, and a mocked repository will happily
     * persist a null value, so the unit tests above cannot see the constraint. This asserts
     * that the very first insert already carries a unique non-null reference, and that the
     * readable ORD-nnnnnn value replaces it only once the id is known.
     */
    @Test
    void firstInsertAlreadyCarriesANonNullUniqueOrderNumber() {
        User buyer = buyer();
        CartItem line = cartLine(buyer, wheat(), "1");

        when(userRepository.findByEmail("buyer@example.test")).thenReturn(Optional.of(buyer));
        when(cartItemRepository.findByBuyerIdOrderByIdAsc(7L)).thenReturn(List.of(line));

        // The repository hands back the same mutable instance, so the number seen on entry to
        // each save call is recorded rather than read back from the entity afterwards.
        List<String> savedNumbers = new ArrayList<>();
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> {
            Order o = inv.getArgument(0);
            if (o.getId() == null) {
                o.setId(52L);
            }
            savedNumbers.add(o.getOrderNumber());
            return o;
        });

        orderService.placeOrder(null, "buyer@example.test");

        assertEquals(2, savedNumbers.size(), "expected a placeholder insert then a numbered update");
        assertNotNull(savedNumbers.get(0), "order_number is NOT NULL - the first insert must not be null");
        assertTrue(savedNumbers.get(0).length() <= 40, "order_number column is varchar(40)");
        assertEquals("ORD-000052", savedNumbers.get(1));
        assertNotEquals(savedNumbers.get(0), savedNumbers.get(1), "the placeholder must differ from the final number");
    }

    /**
     * The placeholder has to be unique across concurrent orders, otherwise the unique index
     * on order_number rejects a perfectly valid second order.
     */
    @Test
    void placeholderOrderNumbersAreUniqueAndFitTheColumn() {
        Set<String> generated = new HashSet<>();
        for (int i = 0; i < 1000; i++) {
            String value = Order.placeholderOrderNumber();
            assertTrue(value.length() <= 40, "placeholder '" + value + "' exceeds varchar(40)");
            assertTrue(generated.add(value), "placeholder '" + value + "' was generated twice");
        }
    }
    @Test
    void coordinatorListedCropKeepsCollectedFarmerAttribution() {
        User buyer = buyer();
        CollectedFarmer collected = CollectedFarmer.builder().id(5L).farmerName("Gurdev Test Farmer").build();
        Crop crop = Crop.builder()
                .id(11L).cropName("Turmeric").category("Other")
                .quantity(new BigDecimal("120")).unit("Kg")
                .pricePerUnit(new BigDecimal("310")).available(true)
                .collectedFarmer(collected)
                .build();

        when(userRepository.findByEmail("buyer@example.test")).thenReturn(Optional.of(buyer));
        when(cartItemRepository.findByBuyerIdOrderByIdAsc(7L)).thenReturn(List.of(cartLine(buyer, crop, "2")));
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> {
            Order o = inv.getArgument(0);
            if (o.getId() == null) {
                o.setId(44L);
            }
            return o;
        });

        OrderResponse response = orderService.placeOrder(null, "buyer@example.test");

        OrderItemResponse item = response.getItems().get(0);
        assertEquals("Gurdev Test Farmer", item.getSellerName());
        assertEquals(OrderItem.SELLER_TYPE_COLLECTED_FARMER, item.getSellerType());
        assertTrue(item.getCollectedFarmerListing());
        assertEquals(0, new BigDecimal("620.00").compareTo(response.getTotalAmount()));
    }

    @Test
    void orderIsRejectedWholeWhenACartCropWasDeleted() {
        User buyer = buyer();
        Crop ok = wheat();
        CartItem deletedLine = CartItem.builder()
                .id(2L).buyer(buyer).crop(null)
                .quantity(new BigDecimal("1")).unitPrice(new BigDecimal("20")).build();

        when(userRepository.findByEmail("buyer@example.test")).thenReturn(Optional.of(buyer));
        when(cartItemRepository.findByBuyerIdOrderByIdAsc(7L)).thenReturn(List.of(cartLine(buyer, ok, "1"), deletedLine));

        CustomException ex = assertThrows(CustomException.class,
                () -> orderService.placeOrder(null, "buyer@example.test"));

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertTrue(ex.getMessage().contains("has been removed"));
        verify(orderRepository, never()).save(any());
        verify(cartItemRepository, never()).deleteAll(any());
    }

    @Test
    void orderIsRejectedWhenACartCropBecameUnavailable() {
        User buyer = buyer();
        Crop crop = wheat();
        crop.setAvailable(false);

        when(userRepository.findByEmail("buyer@example.test")).thenReturn(Optional.of(buyer));
        when(cartItemRepository.findByBuyerIdOrderByIdAsc(7L)).thenReturn(List.of(cartLine(buyer, crop, "1")));

        CustomException ex = assertThrows(CustomException.class,
                () -> orderService.placeOrder(null, "buyer@example.test"));

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertTrue(ex.getMessage().contains("no longer available"));
        verify(orderRepository, never()).save(any());
    }

    @Test
    void orderIsRejectedWhenStockDroppedBelowCartQuantity() {
        User buyer = buyer();
        Crop crop = wheat();
        crop.setQuantity(new BigDecimal("2"));

        when(userRepository.findByEmail("buyer@example.test")).thenReturn(Optional.of(buyer));
        when(cartItemRepository.findByBuyerIdOrderByIdAsc(7L)).thenReturn(List.of(cartLine(buyer, crop, "5")));

        CustomException ex = assertThrows(CustomException.class,
                () -> orderService.placeOrder(null, "buyer@example.test"));

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertTrue(ex.getMessage().contains("Only 2 Kg of Wheat is left"), ex.getMessage());
        verify(orderRepository, never()).save(any());
    }

    @Test
    void buyerCannotReadAnotherBuyersOrderById() {
        when(userRepository.findByEmail("buyer@example.test")).thenReturn(Optional.of(buyer()));
        when(orderRepository.findByIdAndBuyerId(31L, 7L)).thenReturn(Optional.empty());

        CustomException ex = assertThrows(CustomException.class,
                () -> orderService.getOrderById(31L, "buyer@example.test"));

        assertEquals(HttpStatus.NOT_FOUND, ex.getStatus());
    }

    @Test
    void buyerSeesTheirOwnOrder() {
        Order order = Order.builder()
                .id(31L).orderNumber("ORD-000031").status(Order.STATUS_PLACED)
                .buyer(buyer()).totalAmount(new BigDecimal("100.00")).build();

        when(userRepository.findByEmail("buyer@example.test")).thenReturn(Optional.of(buyer()));
        when(orderRepository.findByIdAndBuyerId(31L, 7L)).thenReturn(Optional.of(order));

        OrderResponse response = orderService.getOrderById(31L, "buyer@example.test");

        assertEquals("ORD-000031", response.getOrderNumber());
        assertEquals("Test Buyer", response.getBuyerName());
    }

    @Test
    void farmerSeesOnlyTheirOwnLinesOfASharedOrder() {
        User farmer = User.builder().id(3L).email("farmer@example.test").firstName("Suresh").lastName("Kumar").build();
        User buyer = buyer();

        Order shared = Order.builder()
                .id(77L).orderNumber("ORD-000077").status(Order.STATUS_PLACED)
                .buyer(buyer).totalAmount(new BigDecimal("930.00")).build();

        OrderItem ownLine = OrderItem.builder()
                .id(1L).order(shared).farmer(farmer)
                .cropName("Wheat").quantity(new BigDecimal("5")).unit("Kg")
                .unitPrice(new BigDecimal("20")).totalPrice(new BigDecimal("100.00"))
                .sellerName("Suresh Kumar").sellerType(OrderItem.SELLER_TYPE_FARMER).build();

        OrderItem otherSellerLine = OrderItem.builder()
                .id(2L).order(shared).collectedFarmer(CollectedFarmer.builder().id(5L).build())
                .cropName("Turmeric").quantity(new BigDecimal("2")).unit("Kg")
                .unitPrice(new BigDecimal("310")).totalPrice(new BigDecimal("620.00"))
                .sellerName("Gurdev Test Farmer").sellerType(OrderItem.SELLER_TYPE_COLLECTED_FARMER).build();

        when(userRepository.findByEmail("farmer@example.test")).thenReturn(Optional.of(farmer));
        when(orderRepository.findOrdersForFarmer(3L)).thenReturn(List.of(shared));
        when(orderItemRepository.findByOrderIdAndFarmerId(77L, 3L)).thenReturn(List.of(ownLine));

        List<ReceivedOrderResponse> received = orderService.getReceivedOrders("farmer@example.test");

        assertEquals(1, received.size());
        ReceivedOrderResponse view = received.get(0);
        assertEquals("ORD-000077", view.getOrderNumber());
        assertEquals("Test Buyer", view.getBuyerName());
        assertEquals(1, view.getItemCount());
        assertEquals("Wheat", view.getItems().get(0).getCropName());
        // Totals must reflect only this farmer's lines, not the whole order.
        assertEquals(0, new BigDecimal("100.00").compareTo(view.getTotalAmount()));
        assertFalse(view.getItems().stream().anyMatch(i -> "Turmeric".equals(i.getCropName())));
        assertNotNull(otherSellerLine); // guard: the other line exists but must never be returned
    }

    // --- notification side effects ------------------------------------------------------

    /** A farmer account that passes the {@code isFarmer} ownership check. */
    private User farmerAccount() {
        return User.builder().id(3L).email("farmer@example.test")
                .role(Role.builder().id(1).name("ROLE_FARMER").build()).build();
    }

    @Test
    void placingAnOrderAlertsTheSeller() {
        when(userRepository.findByEmail("buyer@example.test")).thenReturn(Optional.of(buyer()));
        when(cartItemRepository.findByBuyerIdOrderByIdAsc(7L))
                .thenReturn(List.of(cartLine(buyer(), wheat(), "5")));
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> {
            Order o = inv.getArgument(0);
            if (o.getId() == null) {
                o.setId(31L);
            }
            return o;
        });

        orderService.placeOrder(null, "buyer@example.test");

        verify(notificationService).notifyOrderPlaced(any(Order.class));
    }

    @Test
    void aRejectedOrderAlertsNobody() {
        when(userRepository.findByEmail("buyer@example.test")).thenReturn(Optional.of(buyer()));
        when(cartItemRepository.findByBuyerIdOrderByIdAsc(7L)).thenReturn(List.of());

        assertThrows(CustomException.class, () -> orderService.placeOrder(null, "buyer@example.test"));

        verify(notificationService, never()).notifyOrderPlaced(any());
    }

    @Test
    void aRealStatusChangeAlertsTheBuyer() {
        Order order = Order.builder().id(77L).orderNumber("ORD-000077")
                .status(Order.STATUS_PLACED).buyer(buyer()).build();
        User farmer = farmerAccount();

        when(userRepository.findByEmail("farmer@example.test")).thenReturn(Optional.of(farmer));
        when(orderRepository.findById(77L)).thenReturn(Optional.of(order));
        when(orderItemRepository.findByOrderIdAndFarmerId(77L, 3L)).thenReturn(List.of(new OrderItem()));

        orderService.updateOrderStatus(77L, Order.STATUS_DELIVERED, "farmer@example.test");

        verify(notificationService).notifyOrderStatusChanged(order, Order.STATUS_DELIVERED);
    }

    @Test
    void reSavingTheSameStatusAlertsNobody() {
        Order order = Order.builder().id(77L).orderNumber("ORD-000077")
                .status(Order.STATUS_SHIPPED).buyer(buyer()).build();
        User farmer = farmerAccount();

        when(userRepository.findByEmail("farmer@example.test")).thenReturn(Optional.of(farmer));
        when(orderRepository.findById(77L)).thenReturn(Optional.of(order));
        when(orderItemRepository.findByOrderIdAndFarmerId(77L, 3L)).thenReturn(List.of(new OrderItem()));

        orderService.updateOrderStatus(77L, "shipped", "farmer@example.test");

        verify(notificationService, never()).notifyOrderStatusChanged(any(), any());
    }

    @Test
    void aStatusChangeSomebodyIsNotAllowedToMakeAlertsNobody() {
        Order order = Order.builder().id(77L).orderNumber("ORD-000077")
                .status(Order.STATUS_PLACED).buyer(buyer()).build();

        when(userRepository.findByEmail("farmer@example.test")).thenReturn(Optional.of(farmerAccount()));
        when(orderRepository.findById(77L)).thenReturn(Optional.of(order));
        // A farmer with no lines on this order has no say over it.
        when(orderItemRepository.findByOrderIdAndFarmerId(77L, 3L)).thenReturn(List.of());

        assertThrows(CustomException.class,
                () -> orderService.updateOrderStatus(77L, Order.STATUS_SHIPPED, "farmer@example.test"));

        verify(notificationService, never()).notifyOrderStatusChanged(any(), any());
    }
}
