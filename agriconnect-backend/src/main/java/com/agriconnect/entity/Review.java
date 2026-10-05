package com.agriconnect.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.LocalDateTime;

/**
 * A buyer's rating of one seller within one delivered order.
 *
 * <p>A single order can contain crops from several sellers - a registered farmer and a collected
 * farmer at the same time - so a review is scoped to (order, seller) rather than to the order
 * alone. That is what keeps a collected farmer's review off a registered farmer's profile.
 *
 * <p>{@code sellerKey} is a non-null discriminator such as {@code FARMER:3} or
 * {@code COLLECTED_FARMER:7}. It exists because MySQL treats every NULL in a unique index as
 * distinct, so a unique constraint over the nullable {@code farmerId} / {@code collectedFarmerId}
 * pair would silently fail to prevent duplicates. The real foreign keys are kept alongside it.
 */
@Entity
@Table(
        name = "reviews",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_review_order_seller", columnNames = {"order_id", "seller_key"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Review {

    public static final int MIN_RATING = 1;
    public static final int MAX_RATING = 5;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "buyer_id", nullable = false)
    private User buyer;

    /** {@code FARMER:<id>} or {@code COLLECTED_FARMER:<id>}. Part of the unique index. */
    @Column(name = "seller_key", nullable = false, length = 60)
    private String sellerKey;

    /** Mirrors {@link OrderItem#sellerType} so a review can be filtered without a join. */
    @Column(name = "seller_type", nullable = false, length = 30)
    private String sellerType;

    /** Set for a registered-farmer listing; null for a collected-farmer listing. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "farmer_id")
    private User farmer;

    /** Set for a coordinator-added listing; null for a registered-farmer listing. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "collected_farmer_id")
    private CollectedFarmer collectedFarmer;

    @Column(nullable = false)
    private Integer rating;

    @Column(length = 500)
    private String comment;

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

    /** Builds the discriminator used by the unique index. */
    public static String sellerKeyFor(String sellerType, Long sellerId) {
        return sellerType + ":" + sellerId;
    }
}