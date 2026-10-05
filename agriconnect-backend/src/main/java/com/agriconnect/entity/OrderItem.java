package com.agriconnect.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * One crop line inside an Order.
 *
 * <p>Every displayable field is snapshotted (crop name, unit, price, seller name) so a placed
 * order stays accurate even if the crop is later edited or deleted. The crop / farmer /
 * collectedFarmer relationships are kept for querying and are all ON DELETE SET NULL for the
 * same reason: existing crop-deletion endpoints must keep working.
 *
 * <p>Seller attribution mirrors Crop exactly - a crop is owned either by a registered User
 * farmer or by a CollectedFarmer added by a Field Coordinator, never both. sellerName is the
 * resolved display name so callers never have to guess.
 */
@Entity
@Table(name = "order_items")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderItem {

    public static final String SELLER_TYPE_FARMER = "FARMER";
    public static final String SELLER_TYPE_COLLECTED_FARMER = "COLLECTED_FARMER";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "crop_name", nullable = false, length = 100)
    private String cropName;

    @Column(length = 50)
    private String category;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal quantity;

    @Column(nullable = false, length = 20)
    private String unit;

    @Column(name = "unit_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal unitPrice;

    @Column(name = "total_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalPrice;

    @Column(name = "image_url", length = 255)
    private String imageUrl;

    /** Resolved seller display name - farmer full name or collected farmer name. */
    @Column(name = "seller_name", nullable = false, length = 150)
    private String sellerName;

    @Column(name = "seller_type", length = 20)
    private String sellerType;

    @Column(name = "location", length = 100)
    private String location;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "crop_id")
    @OnDelete(action = OnDeleteAction.SET_NULL)
    private Crop crop;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "farmer_id")
    @OnDelete(action = OnDeleteAction.SET_NULL)
    private User farmer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "collected_farmer_id")
    @OnDelete(action = OnDeleteAction.SET_NULL)
    private CollectedFarmer collectedFarmer;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
