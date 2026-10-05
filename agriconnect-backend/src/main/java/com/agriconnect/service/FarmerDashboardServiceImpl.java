package com.agriconnect.service;

import com.agriconnect.dto.FarmerSaleLineResponse;
import com.agriconnect.dto.FarmerSalesResponse;
import com.agriconnect.entity.Crop;
import com.agriconnect.entity.Order;
import com.agriconnect.entity.OrderItem;
import com.agriconnect.entity.User;
import com.agriconnect.exception.CustomException;
import com.agriconnect.repository.CropRepository;
import com.agriconnect.repository.OrderItemRepository;
import com.agriconnect.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

@Service
public class FarmerDashboardServiceImpl implements FarmerDashboardService {

    private static final int MONEY_SCALE = 2;
    private static final int QUANTITY_SCALE = 2;
    private static final int RECENT_SALES_LIMIT = 10;

    /** An order still to be fulfilled by the seller. */
    private static final Set<String> PENDING_STATUSES = Set.of(
            Order.STATUS_PLACED, Order.STATUS_PENDING,
            Order.STATUS_CONFIRMED, Order.STATUS_SHIPPED);

    /** Orders that will never turn into money, so they are counted but never earn. */
    private static final Set<String> VOID_STATUSES = Set.of(
            Order.STATUS_CANCELLED, Order.STATUS_REJECTED);

    private final UserRepository userRepository;
    private final CropRepository cropRepository;
    private final OrderItemRepository orderItemRepository;

    public FarmerDashboardServiceImpl(UserRepository userRepository,
                                      CropRepository cropRepository,
                                      OrderItemRepository orderItemRepository) {
        this.userRepository = userRepository;
        this.cropRepository = cropRepository;
        this.orderItemRepository = orderItemRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public FarmerSalesResponse getSales(String farmerEmail) {
        User farmer = userRepository.findByEmail(farmerEmail)
                .orElseThrow(() -> new CustomException("Farmer account not found", HttpStatus.NOT_FOUND));

        // findByFarmerId only ever returns crops this farmer account owns; a collected farmer's
        // listing has farmer null and collectedFarmer set, so it is excluded here by the same rule
        // that keeps it out of the sales numbers below.
        List<Crop> crops = cropRepository.findByFarmerId(farmer.getId());
        List<OrderItem> lines = orderItemRepository.findSalesLinesForFarmer(farmer.getId());

        List<Order> orders = distinctOrders(lines);

        long pending = countOrders(orders, PENDING_STATUSES);
        long completed = countOrders(orders, Set.of(Order.STATUS_DELIVERED));
        long voided = countOrders(orders, VOID_STATUSES);

        List<OrderItem> earning = lines.stream()
                .filter(item -> !VOID_STATUSES.contains(status(item)))
                .toList();
        List<OrderItem> delivered = earning.stream()
                .filter(item -> Order.STATUS_DELIVERED.equals(status(item)))
                .toList();

        return FarmerSalesResponse.builder()
                .totalCropsListed(crops.size())
                .availableCrops(crops.stream().filter(c -> Boolean.TRUE.equals(c.getAvailable())).count())
                .totalOrdersReceived(orders.size())
                .pendingOrders(pending)
                .completedOrders(completed)
                .cancelledOrders(voided)
                .totalQuantitySold(scale(sumQuantity(earning), QUANTITY_SCALE))
                .quantitySoldByUnit(quantityByUnit(earning))
                .deliveredEarnings(scale(sumPrice(delivered)))
                .totalEarnings(scale(sumPrice(earning)))
                .recentSales(lines.stream().limit(RECENT_SALES_LIMIT).map(this::toSaleLine).toList())
                .build();
    }

    /**
     * One entry per order, so an order this farmer appears in twice is still counted once. The
     * first occurrence wins; the query already returns newest first.
     */
    private List<Order> distinctOrders(List<OrderItem> lines) {
        Map<Long, Order> byId = new LinkedHashMap<>();
        for (OrderItem item : lines) {
            byId.putIfAbsent(item.getOrder().getId(), item.getOrder());
        }
        return List.copyOf(byId.values());
    }

    private long countOrders(List<Order> orders, Set<String> statuses) {
        return orders.stream().filter(order -> statuses.contains(order.getStatus())).count();
    }

    private String status(OrderItem item) {
        return item.getOrder() == null ? null : item.getOrder().getStatus();
    }

    private BigDecimal sumPrice(List<OrderItem> items) {
        return items.stream()
                .map(OrderItem::getTotalPrice)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal sumQuantity(List<OrderItem> items) {
        return items.stream()
                .map(OrderItem::getQuantity)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    /**
     * Quantity cannot be added across mixed units - 500 Kg and 3 Quintal are not 503 of anything.
     * Splitting by unit lets the caller present each figure honestly.
     */
    private Map<String, BigDecimal> quantityByUnit(List<OrderItem> items) {
        Map<String, BigDecimal> byUnit = new LinkedHashMap<>();
        for (OrderItem item : items) {
            if (item.getQuantity() == null) {
                continue;
            }
            String unit = (item.getUnit() == null || item.getUnit().isBlank()) ? "Unit" : item.getUnit();
            byUnit.merge(unit, item.getQuantity(), BigDecimal::add);
        }
        Map<String, BigDecimal> scaled = new LinkedHashMap<>();
        byUnit.forEach((unit, quantity) -> scaled.put(unit, scale(quantity, QUANTITY_SCALE)));
        return scaled;
    }

    private FarmerSaleLineResponse toSaleLine(OrderItem item) {
        Order order = item.getOrder();
        return FarmerSaleLineResponse.builder()
                .orderId(order.getId())
                .orderNumber(order.getOrderNumber())
                .orderDate(order.getCreatedAt())
                .orderStatus(order.getStatus())
                .buyerName(order.getBuyer() == null
                        ? "Unknown"
                        : order.getBuyer().getFirstName() + " " + order.getBuyer().getLastName())
                .cropName(item.getCropName())
                .quantity(item.getQuantity())
                .unit(item.getUnit())
                .totalPrice(item.getTotalPrice())
                .location(item.getLocation())
                .build();
    }

    private BigDecimal scale(BigDecimal value) {
        return value.setScale(MONEY_SCALE, RoundingMode.HALF_UP);
    }

    private BigDecimal scale(BigDecimal value, int scale) {
        return value.setScale(scale, RoundingMode.HALF_UP);
    }
}