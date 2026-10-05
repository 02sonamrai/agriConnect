package com.agriconnect.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "collected_farmers")
@Data
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CollectedFarmer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "farmer_name", nullable = false, length = 100)
    private String farmerName;

    @Column(name = "phone_number", nullable = false, length = 15)
    private String phoneNumber;

    @Column(nullable = false, length = 100)
    private String village;

    @Column(length = 100)
    private String district;

    @Column(length = 100)
    private String state;

    @Column(name = "farming_type", length = 50)
    private String farmingType;

    @Column(name = "primary_crop", nullable = false, length = 100)
    private String primaryCrop;

    @Column(name = "land_area", precision = 10, scale = 2)
    private BigDecimal landArea;

    @Column(name = "land_area_unit", length = 20)
    private String landAreaUnit;

    @Column(name = "approximate_production", precision = 10, scale = 2)
    private BigDecimal approximateProduction;

    @Column(name = "production_unit", length = 20)
    private String productionUnit;

    @Column(name = "preferred_market", length = 150)
    private String preferredMarket;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "collected_by", nullable = false)
    private User collectedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "linked_farmer_id")
    private User linkedFarmer;

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
