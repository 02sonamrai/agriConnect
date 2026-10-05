package com.agriconnect.service;

import com.agriconnect.dto.NotificationResponse;
import com.agriconnect.entity.Order;

import java.util.List;

/**
 * Database-backed notifications. There is no realtime delivery: an event writes a row and the
 * account sees it the next time it loads.
 *
 * <p>The two {@code notify*} methods are called from the order flow and intentionally join the
 * caller's transaction, so an order change that rolls back never leaves an alert behind.
 */
public interface NotificationService {

    /** Alerts every distinct seller on a newly placed order. */
    void notifyOrderPlaced(Order order);

    /** Alerts the buyer when an order moves to a status worth reporting. */
    void notifyOrderStatusChanged(Order order, String newStatus);

    /** The account's own notifications, newest first. */
    List<NotificationResponse> getNotifications(String email);

    long getUnreadCount(String email);

    NotificationResponse markRead(Long notificationId, String email);

    /** Returns how many notifications were unread beforehand. */
    long markAllRead(String email);
}
