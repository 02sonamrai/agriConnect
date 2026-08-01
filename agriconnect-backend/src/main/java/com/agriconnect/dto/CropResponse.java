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
public class CropResponse {
    private Long id;
    private String cropName;
    private String category;
    private String description;
    private BigDecimal quantity;
    private String unit;
    private BigDecimal pricePerUnit;
    private String location;
    private String imageUrl;
    private Boolean available;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long farmerId;
    private String farmerName;
}
