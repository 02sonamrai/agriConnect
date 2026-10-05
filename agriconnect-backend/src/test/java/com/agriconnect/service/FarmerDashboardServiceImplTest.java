package com.agriconnect.service;

import com.agriconnect.dto.FarmerSalesResponse;
import com.agriconnect.entity.Crop;
import com.agriconnect.entity.Order;
import com.agriconnect.entity.OrderItem;
import com.agriconnect.entity.User;
import com.agriconnect.exception.CustomException;
import com.agriconnect.repository.CropRepository;
import com.agriconnect.repository.OrderItemRepository;
import com.agriconnect.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FarmerDashboardServiceImplTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private CropRepository cropRepository;
    @Mock
    private OrderItemRepository orderItemRepository;

    @InjectMocks
    private FarmerDashboardServiceImpl service;

    private static final Long FARMER_ID = 3L;

    private User farmer() {
        return User.builder().id(FARMER_ID).email("farmer@example.test")
                .firstName("Suresh").lastName("Kumar").build();
    }

    private User buyer() {
        return User.builder().id(7L).firstName("Asha").lastName("Buyer").build();
    }

    private Order order(long id, String status, String orderTotal) {
        return Order.builder().id(id).buyer(buyer()).status(status)
                .orderNumber(String.format("ORD-%06d", id))
                .totalAmount(new BigDecimal(orderTotal)).build();
    }

    private OrderItem line(long id, Order order, String quantity, String unit, String lineTotal) {
        return OrderItem.builder().id(id).order(order).cropName("Wheat")
                .quantity(new BigDecimal(quantity)).unit(unit)
                .unitPrice(new BigDecimal("20")).totalPrice(new BigDecimal(lineTotal))
                .sellerName("Suresh Kumar").sellerType(OrderItem.SELLER_TYPE_FARMER)
                .location("Pune").build();
    }

    private void stubFarmer() {
        when(userRepository.findByEmail("farmer@example.test")).thenReturn(Optional.of(farmer()));
    }

    /**
     * The sales figures must come only from the ownership-scoped queries. If the service ever
     * started reading order items without a farmer filter it would pull in collected-farmer
     * sales, so this asserts the scoped method is the only one consulted.
     */
    @Test
    void onlyOwnershipScopedQueriesAreUsed() {
        stubFarmer();
        when(cropRepository.findByFarmerId(FARMER_ID)).thenReturn(List.of());
        when(orderItemRepository.findSalesLinesForFarmer(FARMER_ID)).thenReturn(List.of());

        service.getSales("farmer@example.test");

        verify(orderItemRepository).findSalesLinesForFarmer(FARMER_ID);
        verify(orderItemRepository, never()).findAll();
        verify(orderItemRepository, never()).findByOrderId(anyLong());
        verify(cropRepository).findByFarmerId(FARMER_ID);
        verify(cropRepository, never()).findAll();
    }

    @Test
    void anUnknownFarmerIsRejected() {
        when(userRepository.findByEmail("nobody@example.test")).thenReturn(Optional.empty());

        CustomException ex = assertThrows(CustomException.class,
                () -> service.getSales("nobody@example.test"));
        assertEquals(HttpStatus.NOT_FOUND, ex.getStatus());
    }

    /**
     * The headline earnings figure must add up this farmer's own lines, never the order total,
     * which also covers whatever the other sellers in the same order earned.
     */
    @Test
    void earningsCountOnlyThisFarmersLinesNotTheWholeOrder() {
        stubFarmer();
        when(cropRepository.findByFarmerId(FARMER_ID)).thenReturn(List.of());
        Order delivered = order(1L, Order.STATUS_DELIVERED, "1000.00");
        when(orderItemRepository.findSalesLinesForFarmer(FARMER_ID))
                .thenReturn(List.of(line(1L, delivered, "15", "Kg", "300.00")));

        FarmerSalesResponse result = service.getSales("farmer@example.test");

        assertEquals(new BigDecimal("300.00"), result.getDeliveredEarnings());
        assertEquals(new BigDecimal("300.00"), result.getTotalEarnings());
    }

    @Test
    void pendingAndDeliveredOrdersAreBucketedSeparately() {
        stubFarmer();
        when(cropRepository.findByFarmerId(FARMER_ID)).thenReturn(List.of());
        Order placed = order(1L, Order.STATUS_PLACED, "100.00");
        Order confirmed = order(2L, Order.STATUS_CONFIRMED, "200.00");
        Order shipped = order(3L, Order.STATUS_SHIPPED, "300.00");
        Order delivered = order(4L, Order.STATUS_DELIVERED, "400.00");

        when(orderItemRepository.findSalesLinesForFarmer(FARMER_ID)).thenReturn(List.of(
                line(1L, placed, "1", "Kg", "100.00"),
                line(2L, confirmed, "2", "Kg", "200.00"),
                line(3L, shipped, "3", "Kg", "300.00"),
                line(4L, delivered, "4", "Kg", "400.00")));

        FarmerSalesResponse result = service.getSales("farmer@example.test");

        assertEquals(4L, result.getTotalOrdersReceived());
        assertEquals(3L, result.getPendingOrders());
        assertEquals(1L, result.getCompletedOrders());
        assertEquals(0L, result.getCancelledOrders());
        // Headline is delivered only; total includes the three still in flight.
        assertEquals(new BigDecimal("400.00"), result.getDeliveredEarnings());
        assertEquals(new BigDecimal("1000.00"), result.getTotalEarnings());
    }

    @Test
    void cancelledAndRejectedOrdersAreCountedButNeverEarned() {
        stubFarmer();
        when(cropRepository.findByFarmerId(FARMER_ID)).thenReturn(List.of());
        Order cancelled = order(1L, Order.STATUS_CANCELLED, "500.00");
        Order rejected = order(2L, Order.STATUS_REJECTED, "700.00");
        Order delivered = order(3L, Order.STATUS_DELIVERED, "900.00");

        when(orderItemRepository.findSalesLinesForFarmer(FARMER_ID)).thenReturn(List.of(
                line(1L, cancelled, "5", "Kg", "500.00"),
                line(2L, rejected, "7", "Kg", "700.00"),
                line(3L, delivered, "9", "Kg", "900.00")));

        FarmerSalesResponse result = service.getSales("farmer@example.test");

        assertEquals(2L, result.getCancelledOrders());
        assertEquals(3L, result.getTotalOrdersReceived());
        assertEquals(new BigDecimal("900.00"), result.getTotalEarnings());
        // The voided quantities must not inflate the sold total.
        assertEquals(new BigDecimal("9.00"), result.getTotalQuantitySold());
        assertEquals(new BigDecimal("900.00"), result.getDeliveredEarnings());
    }

    @Test
    void anOrderWithTwoLinesFromTheSameFarmerIsStillOneOrder() {
        stubFarmer();
        when(cropRepository.findByFarmerId(FARMER_ID)).thenReturn(List.of());
        Order delivered = order(1L, Order.STATUS_DELIVERED, "300.00");

        when(orderItemRepository.findSalesLinesForFarmer(FARMER_ID)).thenReturn(List.of(
                line(1L, delivered, "5", "Kg", "100.00"),
                line(2L, delivered, "5", "Kg", "200.00")));

        FarmerSalesResponse result = service.getSales("farmer@example.test");

        assertEquals(1L, result.getTotalOrdersReceived());
        assertEquals(1L, result.getCompletedOrders());
        // Both lines still earn, they are just one order.
        assertEquals(new BigDecimal("300.00"), result.getDeliveredEarnings());
        assertEquals(2, result.getRecentSales().size());
    }

    /** Kg and Quintal are not the same thing, so a single combined quantity would be a lie. */
    @Test
    void quantityIsSplitByUnit() {
        stubFarmer();
        when(cropRepository.findByFarmerId(FARMER_ID)).thenReturn(List.of());
        Order delivered = order(1L, Order.STATUS_DELIVERED, "800.00");

        when(orderItemRepository.findSalesLinesForFarmer(FARMER_ID)).thenReturn(List.of(
                line(1L, delivered, "100", "Kg", "200.00"),
                line(2L, delivered, "3", "Quintal", "600.00")));

        FarmerSalesResponse result = service.getSales("farmer@example.test");

        assertEquals(2, result.getQuantitySoldByUnit().size());
        assertEquals(new BigDecimal("100.00"), result.getQuantitySoldByUnit().get("Kg"));
        assertEquals(new BigDecimal("3.00"), result.getQuantitySoldByUnit().get("Quintal"));
    }

    @Test
    void cropCountsSplitIntoListedAndAvailable() {
        stubFarmer();
        when(cropRepository.findByFarmerId(FARMER_ID)).thenReturn(List.of(
                Crop.builder().id(1L).cropName("Wheat").available(true).build(),
                Crop.builder().id(2L).cropName("Rice").available(true).build(),
                Crop.builder().id(3L).cropName("Onion").available(false).build()));
        when(orderItemRepository.findSalesLinesForFarmer(FARMER_ID)).thenReturn(List.of());

        FarmerSalesResponse result = service.getSales("farmer@example.test");

        assertEquals(3L, result.getTotalCropsListed());
        assertEquals(2L, result.getAvailableCrops());
    }

    @Test
    void recentSalesAreCappedAtTenAndCarryNoBuyerContactDetails() {
        stubFarmer();
        when(cropRepository.findByFarmerId(FARMER_ID)).thenReturn(List.of());
        Order order = order(1L, Order.STATUS_PLACED, "20.00");

        List<OrderItem> many = new java.util.ArrayList<>();
        for (int i = 1; i <= 14; i++) {
            many.add(line(i, order, "1", "Kg", "20.00"));
        }
        when(orderItemRepository.findSalesLinesForFarmer(FARMER_ID)).thenReturn(many);

        FarmerSalesResponse result = service.getSales("farmer@example.test");

        assertEquals(10, result.getRecentSales().size());
        assertEquals("ORD-000001", result.getRecentSales().get(0).getOrderNumber());
        assertEquals("Asha Buyer", result.getRecentSales().get(0).getBuyerName());
    }

    @Test
    void aFarmerWithNoActivityGetsZeroesRatherThanAnError() {
        stubFarmer();
        when(cropRepository.findByFarmerId(FARMER_ID)).thenReturn(List.of());
        when(orderItemRepository.findSalesLinesForFarmer(FARMER_ID)).thenReturn(List.of());

        FarmerSalesResponse result = service.getSales("farmer@example.test");

        assertEquals(0L, result.getTotalCropsListed());
        assertEquals(0L, result.getTotalOrdersReceived());
        assertEquals(BigDecimal.ZERO.setScale(2), result.getDeliveredEarnings());
        assertEquals(BigDecimal.ZERO.setScale(2), result.getTotalEarnings());
        assertTrue(result.getRecentSales().isEmpty());
        assertTrue(result.getQuantitySoldByUnit().isEmpty());
    }
}