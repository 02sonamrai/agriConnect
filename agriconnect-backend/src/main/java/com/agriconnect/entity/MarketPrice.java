package com.agriconnect.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * An approximate mandi (market) rate for a crop, maintained manually by an administrator.
 *
 * <p>This is deliberately a separate concept from {@code Crop.pricePerUnit}. A listing price is
 * what one seller asks for their own stock; a market price is an independent reference rate for
 * the crop as a whole in a given market. Nothing links the two, so editing a listing never moves
 * the market rate and vice versa.
 */
@Entity
@Table(name = "market_prices")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MarketPrice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "crop_name", nullable = false, length = 100)
    private String cropName;

    /**
     * Rate for one {@link #unit}. Seeded rows use Quintal because that is the conventional unit
     * for Indian mandi quotations, but the column is kept so a market quoting per Kg or per
     * tonne can be recorded without a schema change.
     */
    @Column(name = "price_per_unit", nullable = false, precision = 10, scale = 2)
    private BigDecimal pricePerUnit;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String unit = "Quintal";

    /** The market / mandi this rate was observed at, e.g. "Pune Market Yard". */
    @Column(name = "market_name", nullable = false, length = 150)
    private String marketName;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (unit == null || unit.isBlank()) {
            unit = "Quintal";
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}