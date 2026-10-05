package com.agriconnect.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * A crop a buyer has reserved in their cart.
 *
 * <p>unitPrice is a snapshot taken when the item is added so the buyer sees a stable
 * figure for the rest of the session. crop is intentionally nullable with ON DELETE SET NULL:
 * a farmer or coordinator must still be able to delete a crop that is sitting in somebody's
 * cart. The orphaned row survives and is surfaced to the buyer as "listing no longer available"
 * instead of blocking the delete.
 */
@Entity
@Table(name = "cart_items", uniqueConstraints = {
        @UniqueConstraint(name = "uk_cart_buyer_crop", columnNames = {"buyer_id", "crop_id"})
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CartItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal quantity;

    /** Price per unit captured when the item was added. */
    @Column(name = "unit_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal unitPrice;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "buyer_id", nullable = false)
    private User buyer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "crop_id")
    @OnDelete(action = OnDeleteAction.SET_NULL)
    private Crop crop;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
