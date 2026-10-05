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
public class OrderItemResponse {

    private Long id;

    /** Null once the ordered crop has been deleted. */
    private Long cropId;

    private String cropName;
    private String category;
    private String imageUrl;
    private String location;

    private BigDecimal quantity;
    private String unit;
    private BigDecimal pricePerUnit;
    private BigDecimal totalPrice;

    /** Farmer full name, or the Collected Farmer name for coordinator-added crops. */
    private String sellerName;

    /** FARMER or COLLECTED_FARMER - null once the seller record has been removed. */
    private String sellerType;

    private Boolean collectedFarmerListing;
}
