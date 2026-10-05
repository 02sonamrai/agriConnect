package com.agriconnect.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CollectedFarmerResponse {

    private Long id;
    private String farmerName;
    private String phoneNumber;
    private String village;
    private String district;
    private String state;
    private String farmingType;
    private String primaryCrop;
    private BigDecimal landArea;
    private String landAreaUnit;
    private BigDecimal approximateProduction;
    private String productionUnit;
    private String preferredMarket;
    private String notes;
    private Long collectedById;
    private String collectedByName;
    private String collectedByEmail;
    private Long linkedFarmerId;
    private String linkedFarmerName;
    private String linkedFarmerEmail;
    private String linkedFarmerPhone;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
