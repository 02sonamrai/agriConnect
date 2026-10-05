package com.agriconnect.controller;

import com.agriconnect.dto.NotificationResponse;
import com.agriconnect.service.NotificationService;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

/**
 * Notifications for the signed-in account only.
 *
 * <p>Every path takes the account from the JWT and filters by it server-side, so one account can
 * never read or dismiss another's notifications by guessing an id.
 */
@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    /** The account's notifications, newest first. */
    @GetMapping
    public List<NotificationResponse> getNotifications(Principal principal) {
        return notificationService.getNotifications(principal.getName());
    }

    /** Drives the bell badge. */
    @GetMapping("/unread-count")
    public Map<String, Long> getUnreadCount(Principal principal) {
        return Map.of("unreadCount", notificationService.getUnreadCount(principal.getName()));
    }

    @PutMapping("/{notificationId}/read")
    public NotificationResponse markRead(@PathVariable Long notificationId, Principal principal) {
        return notificationService.markRead(notificationId, principal.getName());
    }

    /** Returns how many were unread, so the bell badge can clear without a second request. */
    @PutMapping("/read-all")
    public Map<String, Long> markAllRead(Principal principal) {
        return Map.of("markedRead", notificationService.markAllRead(principal.getName()));
    }
}
