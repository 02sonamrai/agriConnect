package com.agriconnect.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * A placed purchase. The buyer is the only owner; sellers read their own slice of the
 * items through OrderItemRepository rather than through this entity.
 */
@Entity
@Table(name = "orders")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Order {

    /** Status used when an order is first created. */
    public static final String STATUS_PLACED = "PLACED";
    public static final String STATUS_PENDING = "PENDING";
    public static final String STATUS_CONFIRMED = "CONFIRMED";
    public static final String STATUS_SHIPPED = "SHIPPED";
    public static final String STATUS_DELIVERED = "DELIVERED";
    public static final String STATUS_CANCELLED = "CANCELLED";
    public static final String STATUS_REJECTED = "REJECTED";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Human readable reference assigned after insert (ORD-000123). Unique.
     */
    @Column(name = "order_number", nullable = false, unique = true, length = 40)
    private String orderNumber;

    /**
     * The real reference is derived from the generated id, so the first insert needs a value
     * that is guaranteed unique. 40 characters exactly, matching the column width.
     */
    public static String placeholderOrderNumber() {
        return "TMP-" + UUID.randomUUID();
    }

    @Column(name = "total_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalAmount;

    @Column(nullable = false, length = 30)
    private String status;

    @Column(length = 500)
    private String note;

    /**
     * Snapshot of the buyer's delivery address, copied from User when the order is placed.
     * Deliberately denormalised: a later profile change must not rewrite the address an
     * order was actually shipped to, so sellers keep the historical destination.
     */
    @Column(name = "delivery_address", length = 200)
    private String deliveryAddress;

    @Column(name = "delivery_city", length = 60)
    private String deliveryCity;

    @Column(name = "delivery_state", length = 60)
    private String deliveryState;

    @Column(name = "delivery_pincode", length = 10)
    private String deliveryPincode;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "buyer_id", nullable = false)
    private User buyer;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<OrderItem> items = new ArrayList<>();

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public void addItem(OrderItem item) {
        items.add(item);
        item.setOrder(this);
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) {
            status = STATUS_PENDING;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
