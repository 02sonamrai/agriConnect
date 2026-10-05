package com.agriconnect.service;

import com.agriconnect.dto.OrderItemResponse;
import com.agriconnect.dto.OrderResponse;
import com.agriconnect.dto.ReceivedOrderResponse;
import com.agriconnect.entity.CartItem;
import com.agriconnect.entity.Crop;
import com.agriconnect.entity.Order;
import com.agriconnect.entity.OrderItem;
import com.agriconnect.entity.User;
import com.agriconnect.exception.CustomException;
import com.agriconnect.repository.CartItemRepository;
import com.agriconnect.repository.OrderItemRepository;
import com.agriconnect.repository.OrderRepository;
import com.agriconnect.repository.UserRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class OrderServiceImpl implements OrderService {

    private static final int MONEY_SCALE = 2;
    private static final int QUANTITY_SCALE = 2;

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final CartItemRepository cartItemRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public OrderServiceImpl(OrderRepository orderRepository,
                            OrderItemRepository orderItemRepository,
                            CartItemRepository cartItemRepository,
                            UserRepository userRepository,
                            NotificationService notificationService) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.cartItemRepository = cartItemRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    @Override
    @Transactional
    public OrderResponse placeOrder(String note, String buyerEmail) {
        User buyer = resolveUser(buyerEmail, "Buyer account not found");

        List<CartItem> cartItems = cartItemRepository.findByBuyerIdOrderByIdAsc(buyer.getId());
        if (cartItems.isEmpty()) {
            throw new CustomException("Your cart is empty", HttpStatus.BAD_REQUEST);
        }

        Order order = Order.builder()
                .buyer(buyer)
                .note(note)
                .status(Order.STATUS_PLACED)
                .totalAmount(BigDecimal.ZERO)
                .build();

        // Freeze where this order has to be delivered to, before anything else can fail.
        copyDeliveryAddress(order, buyer);

        BigDecimal total = BigDecimal.ZERO;
        for (CartItem cartItem : cartItems) {
            Crop crop = requireOrderableCrop(cartItem);
            BigDecimal quantity = cartItem.getQuantity();
            BigDecimal unitPrice = cartItem.getUnitPrice();

            OrderItem item = OrderItem.builder()
                    .crop(crop)
                    .quantity(quantity)
                    .unit(crop.getUnit())
                    .unitPrice(unitPrice)
                    .totalPrice(scale(quantity.multiply(unitPrice)))
                    .cropName(crop.getCropName())
                    .category(crop.getCategory())
                    .imageUrl(crop.getImageUrl())
                    .location(crop.getLocation())
                    .build();

            applySellerAttribution(item, crop);

            // Consume the purchased stock. crop is a managed entity inside this
            // transaction, so the change is flushed on commit. If a later line fails
            // validation the thrown CustomException rolls the whole order back and
            // every decrement made so far is reverted with it.
            consumeStock(crop, quantity);

            total = total.add(item.getTotalPrice());
            order.addItem(item);
        }

        order.setTotalAmount(scale(total));

        // order_number is NOT NULL, so the first insert carries a unique placeholder. The
        // readable ORD-nnnnnn reference needs the generated id and is set straight after.
        order.setOrderNumber(Order.placeholderOrderNumber());
        orderRepository.save(order);
        order.setOrderNumber(String.format("ORD-%06d", order.getId()));
        orderRepository.save(order);

        // The cart is only emptied once the order has actually been persisted.
        cartItemRepository.deleteAll(cartItems);

        // Tell the sellers there is work to do. Joins this transaction, so a rollback below
        // cannot leave an alert for an order that was never created.
        notificationService.notifyOrderPlaced(order);

        return toOrderResponse(order);
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderResponse> getMyOrders(String buyerEmail) {
        User buyer = resolveUser(buyerEmail, "Buyer account not found");
        return orderRepository.findByBuyerIdOrderByCreatedAtDesc(buyer.getId())
                .stream()
                .map(this::toOrderResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponse getOrderById(Long orderId, String buyerEmail) {
        User buyer = resolveUser(buyerEmail, "Buyer account not found");
        Order order = orderRepository.findByIdAndBuyerId(orderId, buyer.getId())
                .orElseThrow(() -> new CustomException("Order not found", HttpStatus.NOT_FOUND));
        return toOrderResponse(order);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReceivedOrderResponse> getReceivedOrders(String farmerEmail) {
        User farmer = resolveUser(farmerEmail, "Farmer account not found");
        List<ReceivedOrderResponse> received = new ArrayList<>();

        for (Order order : orderRepository.findOrdersForFarmer(farmer.getId())) {
            // Read back only this farmer's lines so co-sellers' items in the same order
            // are never loaded or returned.
            List<OrderItem> ownItems = orderItemRepository.findByOrderIdAndFarmerId(order.getId(), farmer.getId());
            if (ownItems.isEmpty()) {
                continue;
            }
            List<OrderItemResponse> items = ownItems.stream().map(this::toItemResponse).collect(Collectors.toList());
            BigDecimal total = ownItems.stream()
                    .map(OrderItem::getTotalPrice)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            received.add(ReceivedOrderResponse.builder()
                    .id(order.getId())
                    .orderNumber(order.getOrderNumber())
                    .status(order.getStatus())
                    .buyerName(buyerName(order.getBuyer()))
                    .deliveryAddress(order.getDeliveryAddress())
                    .deliveryCity(order.getDeliveryCity())
                    .deliveryState(order.getDeliveryState())
                    .deliveryPincode(order.getDeliveryPincode())
                    .createdAt(order.getCreatedAt())
                    .updatedAt(order.getUpdatedAt())
                    .totalAmount(scale(total))
                    .itemCount(items.size())
                    .items(items)
                    .build());
        }
        return received;
    }

    private Crop requireOrderableCrop(CartItem cartItem) {
        Crop crop = cartItem.getCrop();
        if (crop == null) {
            throw new CustomException("A listing in your cart has been removed. Please review your cart and try again.",
                    HttpStatus.BAD_REQUEST);
        }
        if (!Boolean.TRUE.equals(crop.getAvailable())) {
            throw new CustomException(crop.getCropName() + " is no longer available. Please review your cart and try again.",
                    HttpStatus.BAD_REQUEST);
        }
        BigDecimal quantity = cartItem.getQuantity();
        if (quantity == null || quantity.compareTo(BigDecimal.ZERO) <= 0) {
            throw new CustomException("A listing in your cart has an invalid quantity. Please review your cart.",
                    HttpStatus.BAD_REQUEST);
        }
        if (crop.getQuantity() == null || quantity.compareTo(crop.getQuantity()) > 0) {
            throw new CustomException("Only " + crop.getQuantity() + " " + crop.getUnit() + " of "
                    + crop.getCropName() + " is left. Please update your cart and try again.",
                    HttpStatus.BAD_REQUEST);
        }
        return crop;
    }

    /**
     * Reduces the listing stock by the ordered quantity. requireOrderableCrop has already
     * rejected an order that exceeds the available quantity; the guard below is repeated
     * so stock can never be driven negative even if that check is ever relaxed.
     */
    private void consumeStock(Crop crop, BigDecimal orderedQuantity) {
        BigDecimal remaining = crop.getQuantity().subtract(orderedQuantity);
        if (remaining.compareTo(BigDecimal.ZERO) < 0) {
            throw new CustomException("Only " + crop.getQuantity() + " " + crop.getUnit() + " of "
                    + crop.getCropName() + " is left. Please update your cart and try again.",
                    HttpStatus.BAD_REQUEST);
        }
        crop.setQuantity(remaining.setScale(QUANTITY_SCALE, RoundingMode.HALF_UP));
    }

    /**
     * Mirrors the marketplace ownership rule: a crop belongs either to a registered farmer
     * account or to a collected farmer, and the display name plus sellerType are snapshotted
     * so the attribution survives the seller record being removed later.
     */
    private void applySellerAttribution(OrderItem item, Crop crop) {
        if (crop.getFarmer() != null) {
            item.setFarmer(crop.getFarmer());
            item.setSellerName(crop.getFarmer().getFirstName() + " " + crop.getFarmer().getLastName());
            item.setSellerType(OrderItem.SELLER_TYPE_FARMER);
        } else if (crop.getCollectedFarmer() != null) {
            item.setCollectedFarmer(crop.getCollectedFarmer());
            item.setSellerName(crop.getCollectedFarmer().getFarmerName());
            item.setSellerType(OrderItem.SELLER_TYPE_COLLECTED_FARMER);
        } else {
            item.setSellerName("Unknown");
            item.setSellerType(null);
        }
    }

    private OrderResponse toOrderResponse(Order order) {
        List<OrderItemResponse> items = order.getItems().stream()
                .map(this::toItemResponse)
                .collect(Collectors.toList());

        return OrderResponse.builder()
                .id(order.getId())
                .orderNumber(order.getOrderNumber())
                .status(order.getStatus())
                .totalAmount(order.getTotalAmount())
                .note(order.getNote())
                .buyerName(buyerName(order.getBuyer()))
                .deliveryAddress(order.getDeliveryAddress())
                .deliveryCity(order.getDeliveryCity())
                .deliveryState(order.getDeliveryState())
                .deliveryPincode(order.getDeliveryPincode())
                .itemCount(items.size())
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .items(items)
                .build();
    }

    private OrderItemResponse toItemResponse(OrderItem item) {
        return OrderItemResponse.builder()
                .id(item.getId())
                .cropId(item.getCrop() == null ? null : item.getCrop().getId())
                .cropName(item.getCropName())
                .category(item.getCategory())
                .imageUrl(item.getImageUrl())
                .location(item.getLocation())
                .quantity(item.getQuantity())
                .unit(item.getUnit())
                .pricePerUnit(item.getUnitPrice())
                .totalPrice(item.getTotalPrice())
                .sellerName(item.getSellerName())
                .sellerType(item.getSellerType())
                .collectedFarmerListing(OrderItem.SELLER_TYPE_COLLECTED_FARMER.equals(item.getSellerType()))
                .build();
    }

    private String buyerName(User buyer) {
        if (buyer == null) {
            return "Unknown";
        }
        return buyer.getFirstName() + " " + buyer.getLastName();
    }

    /**
     * Copies the buyer's profile address onto the order as an immutable snapshot. Runs
     * inside placeOrder's transaction, so it is rolled back with the order if the order
     * itself fails. A buyer with no address on file leaves the snapshot null and the UI
     * simply omits the panel.
     */
    private void copyDeliveryAddress(Order order, User buyer) {
        if (buyer == null) {
            return;
        }
        order.setDeliveryAddress(buyer.getAddressLine());
        order.setDeliveryCity(buyer.getCity());
        order.setDeliveryState(buyer.getState());
        order.setDeliveryPincode(buyer.getPincode());
    }

    private User resolveUser(String email, String notFoundMessage) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new CustomException(notFoundMessage, HttpStatus.UNAUTHORIZED));
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReceivedOrderResponse> getCoordinatorReceivedOrders(String coordinatorEmail) {
        User coordinator = resolveUser(coordinatorEmail, "Coordinator account not found");
        List<ReceivedOrderResponse> received = new ArrayList<>();

        for (Order order : orderRepository.findOrdersForCoordinator(coordinator.getId())) {
            List<OrderItem> ownItems = orderItemRepository.findByOrderIdAndCollectedFarmer_CollectedBy_Id(order.getId(), coordinator.getId());
            if (ownItems.isEmpty()) {
                continue;
            }
            List<OrderItemResponse> items = ownItems.stream().map(this::toItemResponse).collect(Collectors.toList());
            BigDecimal total = ownItems.stream()
                    .map(OrderItem::getTotalPrice)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            received.add(ReceivedOrderResponse.builder()
                    .id(order.getId())
                    .orderNumber(order.getOrderNumber())
                    .status(order.getStatus())
                    .buyerName(buyerName(order.getBuyer()))
                    .deliveryAddress(order.getDeliveryAddress())
                    .deliveryCity(order.getDeliveryCity())
                    .deliveryState(order.getDeliveryState())
                    .deliveryPincode(order.getDeliveryPincode())
                    .createdAt(order.getCreatedAt())
                    .updatedAt(order.getUpdatedAt())
                    .totalAmount(scale(total))
                    .itemCount(items.size())
                    .items(items)
                    .build());
        }
        return received;
    }

    @Override
    @Transactional
    public OrderResponse updateOrderStatus(Long orderId, String newStatus, String userEmail) {
        User user = resolveUser(userEmail, "User account not found");
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new CustomException("Order not found", HttpStatus.NOT_FOUND));

        String status = newStatus == null ? null : newStatus.toUpperCase();
        if (!isValidStatus(status)) {
            throw new CustomException("Invalid order status", HttpStatus.BAD_REQUEST);
        }

        // Authorization: farmer can update if order has their items; coordinator if has their collected farmer items; admin can do all
        boolean allowed = isAdmin(user);
        if (!allowed && isFarmer(user)) {
            allowed = orderItemRepository.findByOrderIdAndFarmerId(orderId, user.getId()).size() > 0;
        }
        if (!allowed && isCoordinator(user)) {
            allowed = orderItemRepository.findByOrderIdAndCollectedFarmer_CollectedBy_Id(orderId, user.getId()).size() > 0;
        }
        if (!allowed) {
            throw new CustomException("You do not have permission to update this order", HttpStatus.FORBIDDEN);
        }

        String previousStatus = order.getStatus();

        order.setStatus(status);
        orderRepository.save(order);

        // Only alert on a real transition, so re-saving the same status stays quiet.
        if (!status.equals(previousStatus)) {
            notificationService.notifyOrderStatusChanged(order, status);
        }

        return toOrderResponse(order);
    }

    private boolean isValidStatus(String s) {
        if (s == null) return false;
        return s.equals(Order.STATUS_PENDING) || s.equals(Order.STATUS_PLACED) ||
               s.equals(Order.STATUS_CONFIRMED) || s.equals(Order.STATUS_SHIPPED) ||
               s.equals(Order.STATUS_DELIVERED) || s.equals(Order.STATUS_CANCELLED) ||
               s.equals(Order.STATUS_REJECTED);
    }

    private boolean isAdmin(User u) {
        return u.getRole() != null && "ROLE_ADMIN".equals(u.getRole().getName());
    }

    private boolean isFarmer(User u) {
        return u.getRole() != null && "ROLE_FARMER".equals(u.getRole().getName());
    }

    private boolean isCoordinator(User u) {
        return u.getRole() != null && ("ROLE_MIDDLEMAN".equals(u.getRole().getName()) || "ROLE_COORDINATOR".equals(u.getRole().getName()));
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderResponse> getAllOrders() {
        return orderRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::toOrderResponse)
                .collect(Collectors.toList());
    }

    private BigDecimal scale(BigDecimal value) {
        return value.setScale(MONEY_SCALE, RoundingMode.HALF_UP);
    }
}
