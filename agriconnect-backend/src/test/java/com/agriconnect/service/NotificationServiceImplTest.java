package com.agriconnect.service;

import com.agriconnect.dto.NotificationResponse;
import com.agriconnect.entity.CollectedFarmer;
import com.agriconnect.entity.Notification;
import com.agriconnect.entity.Order;
import com.agriconnect.entity.OrderItem;
import com.agriconnect.entity.User;
import com.agriconnect.exception.CustomException;
import com.agriconnect.repository.NotificationRepository;
import com.agriconnect.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceImplTest {

    @Mock
    private NotificationRepository notificationRepository;
    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private NotificationServiceImpl notificationService;

    private User user(Long id, String first, String last, String email) {
        return User.builder().id(id).firstName(first).lastName(last).email(email).build();
    }

    private User buyer() {
        return user(1L, "Bela", "Buyer", "buyer@example.test");
    }

    private Order order() {
        return Order.builder()
                .id(500L)
                .buyer(buyer())
                .orderNumber("ORD-000500")
                .status(Order.STATUS_PLACED)
                .build();
    }

    private OrderItem line(Order order, String cropName, User farmer, CollectedFarmer collectedFarmer) {
        OrderItem item = OrderItem.builder()
                .cropName(cropName)
                .quantity(new java.math.BigDecimal("10"))
                .unit("Kg")
                .farmer(farmer)
                .collectedFarmer(collectedFarmer)
                .build();
        order.addItem(item);
        return item;
    }

    private CollectedFarmer collectedFarmer(Long id, String name, User coordinator) {
        return CollectedFarmer.builder()
                .id(id)
                .farmerName(name)
                .collectedBy(coordinator)
                .build();
    }

    /** Every notification the service tried to store. */
    private List<Notification> saved() {
        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository, atLeast(0)).save(captor.capture());
        return new ArrayList<>(captor.getAllValues());
    }

    // --- order placed -------------------------------------------------------------------

    @Test
    void orderPlacementAlertsTheRegisteredFarmerAndTheCoordinator() {
        User farmer = user(2L, "Mithun", "F", "farmer@example.test");
        User coordinator = user(3L, "Chan", "C", "coord@example.test");
        Order order = order();

        line(order, "Wheat", farmer, null);
        line(order, "Rice", null, collectedFarmer(9L, "Collected Ram", coordinator));

        notificationService.notifyOrderPlaced(order);

        List<Notification> saved = saved();
        assertEquals(2, saved.size());
        assertTrue(saved.stream().allMatch(n -> Notification.TYPE_ORDER_PLACED.equals(n.getType())));
        assertEquals(List.of(2L, 3L), saved.stream().map(n -> n.getUser().getId()).toList());
        assertTrue(saved.stream().allMatch(n -> n.getOrderId().equals(500L)));
        assertTrue(saved.stream().allMatch(n -> "ORD-000500".equals(n.getOrderNumber())));
        assertTrue(saved.stream().allMatch(n -> Boolean.FALSE.equals(n.getRead())));
    }

    @Test
    void oneSellerAcrossSeveralLinesGetsASingleNotification() {
        User coordinator = user(3L, "Chan", "C", "coord@example.test");
        Order order = order();

        line(order, "Rice", null, collectedFarmer(9L, "Collected Ram", coordinator));
        line(order, "Wheat", null, collectedFarmer(9L, "Collected Ram", coordinator));
        line(order, "Maize", null, collectedFarmer(9L, "Collected Ram", coordinator));

        notificationService.notifyOrderPlaced(order);

        List<Notification> saved = saved();
        assertEquals(1, saved.size());
        assertTrue(saved.get(0).getMessage().contains("3 items"), saved.get(0).getMessage());
    }

    @Test
    void collectedFarmerListingsAlertTheCoordinatorNotTheFarmer() {
        User coordinator = user(3L, "Chan", "C", "coord@example.test");
        Order order = order();

        line(order, "Rice", null, collectedFarmer(9L, "Collected Ram", coordinator));
        notificationService.notifyOrderPlaced(order);

        Notification notification = saved().get(0);
        assertEquals(3L, notification.getUser().getId());
        assertTrue(notification.getMessage().contains("Bela Buyer"), notification.getMessage());
    }

    @Test
    void anOrderLineWhoseSellerWasDeletedAlertsNobody() {
        Order order = order();
        line(order, "Ghost Crop", null, null);

        notificationService.notifyOrderPlaced(order);

        verify(notificationRepository, never()).save(any());
    }

    @Test
    void aSellerIsNotToldAboutTheirOwnOrder() {
        User farmer = user(1L, "Bela", "Buyer", "buyer@example.test");
        Order order = Order.builder().id(500L).buyer(farmer)
                .orderNumber("ORD-000500").status(Order.STATUS_PLACED).build();
        line(order, "Wheat", farmer, null);

        notificationService.notifyOrderPlaced(order);

        verify(notificationRepository, never()).save(any());
    }

    // --- status changes -----------------------------------------------------------------

    @Test
    void buyerIsNotifiedWhenAnOrderIsDelivered() {
        notificationService.notifyOrderStatusChanged(order(), Order.STATUS_DELIVERED);

        Notification notification = saved().get(0);
        assertEquals(Notification.TYPE_ORDER_DELIVERED, notification.getType());
        assertEquals(1L, notification.getUser().getId());
        assertEquals(500L, notification.getOrderId());
        assertTrue(notification.getMessage().contains("ORD-000500"));
    }

    @Test
    void everyStatusTheBuyerNeedsToKnowAboutRaisesAnAlert() {
        Order order = order();

        notificationService.notifyOrderStatusChanged(order, Order.STATUS_CONFIRMED);
        notificationService.notifyOrderStatusChanged(order, Order.STATUS_SHIPPED);
        notificationService.notifyOrderStatusChanged(order, Order.STATUS_DELIVERED);
        notificationService.notifyOrderStatusChanged(order, Order.STATUS_CANCELLED);
        notificationService.notifyOrderStatusChanged(order, Order.STATUS_REJECTED);

        assertEquals(
                List.of(Notification.TYPE_ORDER_CONFIRMED, Notification.TYPE_ORDER_SHIPPED,
                        Notification.TYPE_ORDER_DELIVERED, Notification.TYPE_ORDER_CANCELLED,
                        Notification.TYPE_ORDER_REJECTED),
                saved().stream().map(Notification::getType).toList());
    }

    @Test
    void aStatusTheBuyerCausedThemselvesRaisesNoAlert() {
        notificationService.notifyOrderStatusChanged(order(), Order.STATUS_PLACED);
        notificationService.notifyOrderStatusChanged(order(), Order.STATUS_PENDING);
        notificationService.notifyOrderStatusChanged(order(), null);

        verify(notificationRepository, never()).save(any());
    }

    // --- reading and dismissing ---------------------------------------------------------

    @Test
    void unreadCountIsScopedToTheSignedInAccount() {
        when(userRepository.findByEmail("buyer@example.test")).thenReturn(Optional.of(buyer()));
        when(notificationRepository.countByUserIdAndReadFalse(1L)).thenReturn(4L);

        assertEquals(4L, notificationService.getUnreadCount("buyer@example.test"));
    }

    @Test
    void markReadCannotReachAnotherAccountsNotification() {
        when(userRepository.findByEmail("buyer@example.test")).thenReturn(Optional.of(buyer()));
        // The repository lookup is already scoped by user id, so a foreign id simply misses.
        when(notificationRepository.findByIdAndUserId(77L, 1L)).thenReturn(Optional.empty());

        CustomException ex = assertThrows(CustomException.class,
                () -> notificationService.markRead(77L, "buyer@example.test"));
        assertEquals(HttpStatus.NOT_FOUND, ex.getStatus());
    }

    @Test
    void markReadStoresTheChangeAndReturnsTheNotification() {
        User buyer = buyer();
        Notification notification = Notification.builder()
                .id(77L).user(buyer).type(Notification.TYPE_ORDER_DELIVERED)
                .title("Order ORD-000500 delivered").message("Delivered.")
                .orderId(500L).orderNumber("ORD-000500").read(false).build();

        when(userRepository.findByEmail("buyer@example.test")).thenReturn(Optional.of(buyer));
        when(notificationRepository.findByIdAndUserId(77L, 1L)).thenReturn(Optional.of(notification));
        when(notificationRepository.save(any(Notification.class))).thenAnswer(i -> i.getArgument(0));

        NotificationResponse response = notificationService.markRead(77L, "buyer@example.test");

        assertTrue(response.getRead());
        verify(notificationRepository).save(notification);
    }

    @Test
    void markAllReadReportsHowManyWereUnread() {
        when(userRepository.findByEmail("buyer@example.test")).thenReturn(Optional.of(buyer()));
        when(notificationRepository.markAllReadForUser(1L)).thenReturn(6);

        assertEquals(6L, notificationService.markAllRead("buyer@example.test"));
    }

    @Test
    void anUnknownAccountCannotReadNotifications() {
        when(userRepository.findByEmail("ghost@example.test")).thenReturn(Optional.empty());

        CustomException ex = assertThrows(CustomException.class,
                () -> notificationService.getNotifications("ghost@example.test"));
        assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatus());
    }
}
