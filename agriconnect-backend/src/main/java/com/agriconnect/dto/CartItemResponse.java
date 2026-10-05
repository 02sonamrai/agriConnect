package com.agriconnect.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CartItemResponse {

    private Long id;

    /** Null only when the underlying crop row has been deleted. */
    private Long cropId;

    private String cropName;
    private String category;
    private String imageUrl;
    private String unit;
    private String location;

    /** Seller attribution, resolved the same way the marketplace resolves it. */
    private String farmerName;
    private Boolean isCollectedFarmer;
    private Long collectedFarmerId;

    /** Price captured when the item was added. */
    private BigDecimal pricePerUnit;

    /** Quantity the buyer asked for. */
    private BigDecimal quantity;

    /** quantity * pricePerUnit. */
    private BigDecimal lineTotal;

    /** Stock currently listed on the crop, or null if the crop was deleted. */
    private BigDecimal stockQuantity;

    /** False when the crop was deleted or deactivated after being added. */
    private Boolean available;

    private String unavailableReason;
}
