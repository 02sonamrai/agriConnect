package com.agriconnect.service;

import com.agriconnect.dto.NotificationResponse;
import com.agriconnect.entity.Notification;
import com.agriconnect.entity.Order;
import com.agriconnect.entity.OrderItem;
import com.agriconnect.entity.User;
import com.agriconnect.exception.CustomException;
import com.agriconnect.repository.NotificationRepository;
import com.agriconnect.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class NotificationServiceImpl implements NotificationService {

    /** How many notifications the bell dropdown and the page will show at most. */
    private static final int RECENT_LIMIT = 50;

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public NotificationServiceImpl(NotificationRepository notificationRepository, UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    /**
     * {@inheritDoc}
     *
     * <p>An order can mix sellers, and one seller can appear on several lines, so sellers are
     * de-duplicated by account id before being alerted - otherwise a coordinator with three lines
     * would get three identical notifications.
     */
    @Override
    @Transactional
    public void notifyOrderPlaced(Order order) {
        if (order == null || order.getBuyer() == null) {
            return;
        }

        Map<Long, SellerTally> sellers = new LinkedHashMap<>();
        for (OrderItem item : order.getItems()) {
            tallySeller(item, sellers);
        }

        String buyerName = displayName(order.getBuyer());
        String orderNumber = order.getOrderNumber();

        for (SellerTally seller : sellers.values()) {
            if (seller.user.getId() != null && seller.user.getId().equals(order.getBuyer().getId())) {
                // A seller never gets told about their own order.
                continue;
            }
            notificationRepository.save(Notification.builder()
                    .user(seller.user)
                    .type(Notification.TYPE_ORDER_PLACED)
                    .title("New order " + orderNumber)
                    .message(buyerName + " placed order " + orderNumber
                            + " with " + pluralItems(seller.itemCount) + " from you.")
                    .orderId(order.getId())
                    .orderNumber(orderNumber)
                    .read(false)
                    .build());
        }
    }

    /**
     * {@inheritDoc}
     *
     * <p>Only the statuses a buyer actually wants to hear about raise an alert. PLACED and PENDING
     * are excluded because the buyer is the one who caused them.
     */
    @Override
    @Transactional
    public void notifyOrderStatusChanged(Order order, String newStatus) {
        if (order == null || order.getBuyer() == null || newStatus == null) {
            return;
        }

        String type = typeForStatus(newStatus);
        if (type == null) {
            return;
        }

        notificationRepository.save(Notification.builder()
                .user(order.getBuyer())
                .type(type)
                .title(titleForStatus(newStatus, order.getOrderNumber()))
                .message(messageForStatus(newStatus, order.getOrderNumber()))
                .orderId(order.getId())
                .orderNumber(order.getOrderNumber())
                .read(false)
                .build());
    }

    @Override
    @Transactional(readOnly = true)
    public List<NotificationResponse> getNotifications(String email) {
        User user = resolveUser(email);
        List<Notification> notifications = notificationRepository.findTop50ByUserIdOrderByCreatedAtDesc(user.getId());
        List<NotificationResponse> responses = new ArrayList<>(notifications.size());
        for (Notification notification : notifications) {
            responses.add(toResponse(notification));
        }
        return responses;
    }

    @Override
    @Transactional(readOnly = true)
    public long getUnreadCount(String email) {
        User user = resolveUser(email);
        return notificationRepository.countByUserIdAndReadFalse(user.getId());
    }

    @Override
    @Transactional
    public NotificationResponse markRead(Long notificationId, String email) {
        User user = resolveUser(email);
        Notification notification = notificationRepository.findByIdAndUserId(notificationId, user.getId())
                .orElseThrow(() -> new CustomException("Notification not found", HttpStatus.NOT_FOUND));

        if (Boolean.TRUE.equals(notification.getRead())) {
            return toResponse(notification);
        }

        notification.setRead(true);
        return toResponse(notificationRepository.save(notification));
    }

    @Override
    @Transactional
    public long markAllRead(String email) {
        User user = resolveUser(email);
        return notificationRepository.markAllReadForUser(user.getId());
    }

    /**
     * Resolves the account that owns an order line and counts the line against it, adding the
     * account to {@code into} the first time it is seen. Returns nothing: a line whose seller
     * record has been removed is simply skipped.
     */
    private void tallySeller(OrderItem item, Map<Long, SellerTally> into) {
        User sellerAccount = sellerAccountFor(item);

        if (sellerAccount == null || sellerAccount.getId() == null) {
            return;
        }

        SellerTally tally = into.computeIfAbsent(sellerAccount.getId(), id -> new SellerTally(sellerAccount));
        tally.itemCount++;
    }

    /** The account responsible for an order line, or null when the seller record is gone. */
    private User sellerAccountFor(OrderItem item) {
        if (item.getFarmer() != null) {
            return item.getFarmer();
        }
        if (item.getCollectedFarmer() != null && item.getCollectedFarmer().getCollectedBy() != null) {
            // A collected farmer has no login of their own - the coordinator who collected them
            // is the account that can actually act on the order.
            return item.getCollectedFarmer().getCollectedBy();
        }
        return null;
    }

    private String typeForStatus(String status) {
        switch (status) {
            case Order.STATUS_CONFIRMED:
                return Notification.TYPE_ORDER_CONFIRMED;
            case Order.STATUS_SHIPPED:
                return Notification.TYPE_ORDER_SHIPPED;
            case Order.STATUS_DELIVERED:
                return Notification.TYPE_ORDER_DELIVERED;
            case Order.STATUS_CANCELLED:
                return Notification.TYPE_ORDER_CANCELLED;
            case Order.STATUS_REJECTED:
                return Notification.TYPE_ORDER_REJECTED;
            default:
                return null;
        }
    }

    private String titleForStatus(String status, String orderNumber) {
        switch (status) {
            case Order.STATUS_CONFIRMED:
                return "Order " + orderNumber + " confirmed";
            case Order.STATUS_SHIPPED:
                return "Order " + orderNumber + " shipped";
            case Order.STATUS_DELIVERED:
                return "Order " + orderNumber + " delivered";
            case Order.STATUS_CANCELLED:
                return "Order " + orderNumber + " cancelled";
            case Order.STATUS_REJECTED:
                return "Order " + orderNumber + " rejected";
            default:
                return "Order " + orderNumber + " updated";
        }
    }

    private String messageForStatus(String status, String orderNumber) {
        switch (status) {
            case Order.STATUS_CONFIRMED:
                return "The seller confirmed your order " + orderNumber + " and will start preparing it.";
            case Order.STATUS_SHIPPED:
                return "Your order " + orderNumber + " has been shipped.";
            case Order.STATUS_DELIVERED:
                return "Your order " + orderNumber + " has been delivered. You can now rate the seller.";
            case Order.STATUS_CANCELLED:
                return "Your order " + orderNumber + " was cancelled.";
            case Order.STATUS_REJECTED:
                return "Your order " + orderNumber + " was rejected by the seller.";
            default:
                return "Your order " + orderNumber + " was updated to " + status + ".";
        }
    }

    private NotificationResponse toResponse(Notification notification) {
        return NotificationResponse.builder()
                .id(notification.getId())
                .type(notification.getType())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .orderId(notification.getOrderId())
                .orderNumber(notification.getOrderNumber())
                .read(Boolean.TRUE.equals(notification.getRead()))
                .createdAt(notification.getCreatedAt())
                .build();
    }

    private User resolveUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new CustomException("User account not found", HttpStatus.UNAUTHORIZED));
    }

    private String displayName(User user) {
        if (user == null) {
            return "A buyer";
        }
        String first = user.getFirstName() == null ? "" : user.getFirstName().trim();
        String last = user.getLastName() == null ? "" : user.getLastName().trim();
        String full = (first + " " + last).trim();
        return full.isEmpty() ? "A buyer" : full;
    }

    private static String pluralItems(int count) {
        return count == 1 ? "1 item" : count + " items";
    }

    /** Per-seller tally used to word the "new order" alert. */
    private static final class SellerTally {
        private final User user;
        private int itemCount;

        private SellerTally(User user) {
            this.user = user;
        }
    }
}
