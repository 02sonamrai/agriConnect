package com.agriconnect.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * A stored notification for one account. Read from the database on demand - there is no
 * realtime delivery, so a notification is just a row that exists by the time the user next
 * loads the page.
 *
 * <p>The order is referenced by a plain id plus the snapshotted order number rather than a
 * foreign key, so a notification stays readable even if the order it refers to is removed.
 */
@Entity
@Table(name = "notifications")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {

    /** A seller (farmer or coordinator) has a new order to fulfil. */
    public static final String TYPE_ORDER_PLACED = "ORDER_PLACED";
    public static final String TYPE_ORDER_CONFIRMED = "ORDER_CONFIRMED";
    public static final String TYPE_ORDER_SHIPPED = "ORDER_SHIPPED";
    public static final String TYPE_ORDER_DELIVERED = "ORDER_DELIVERED";
    public static final String TYPE_ORDER_CANCELLED = "ORDER_CANCELLED";
    public static final String TYPE_ORDER_REJECTED = "ORDER_REJECTED";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 40)
    private String type;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(nullable = false, length = 500)
    private String message;

    @Column(name = "order_id")
    private Long orderId;

    @Column(name = "order_number", length = 20)
    private String orderNumber;

    /**
     * Unread until the account holder opens or dismisses it. The column is named {@code is_read}
     * because READ is a reserved word in MySQL.
     */
    @Column(name = "is_read", nullable = false)
    @Builder.Default
    private Boolean read = false;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (read == null) {
            read = false;
        }
    }
}