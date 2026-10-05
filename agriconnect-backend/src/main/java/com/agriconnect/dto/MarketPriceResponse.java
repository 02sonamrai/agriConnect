package com.agriconnect.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * A market rate as shown to farmers and buyers. Carries no seller, buyer or account reference:
 * this is shared reference data, so there is nothing role-specific to withhold.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MarketPriceResponse {
    private Long id;
    private String cropName;
    private BigDecimal pricePerUnit;
    private String unit;
    private String marketName;

    /** When this rate was last edited - the "last updated" date the price view displays. */
    private LocalDateTime updatedAt;
}