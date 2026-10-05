package com.agriconnect.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CollectedFarmerRequest {

    @NotBlank(message = "Farmer name is required")
    @Size(max = 100, message = "Farmer name must be less than 100 characters")
    private String farmerName;

    @NotBlank(message = "Phone number is required")
    @Pattern(regexp = "^[0-9]{10,15}$", message = "Phone number must be between 10 and 15 digits")
    private String phoneNumber;

    @NotBlank(message = "Village is required")
    @Size(max = 100, message = "Village must be less than 100 characters")
    private String village;

    @Size(max = 100, message = "District must be less than 100 characters")
    private String district;

    @Size(max = 100, message = "State must be less than 100 characters")
    private String state;

    @Size(max = 50, message = "Farming type must be less than 50 characters")
    private String farmingType;

    @NotBlank(message = "Primary crop is required")
    @Size(max = 100, message = "Primary crop must be less than 100 characters")
    private String primaryCrop;

    @DecimalMin(value = "0.00", message = "Land area must be zero or positive")
    private BigDecimal landArea;

    @Size(max = 20, message = "Land area unit must be less than 20 characters")
    private String landAreaUnit;

    @DecimalMin(value = "0.00", message = "Approximate production must be zero or positive")
    private BigDecimal approximateProduction;

    @Size(max = 20, message = "Production unit must be less than 20 characters")
    private String productionUnit;

    @Size(max = 150, message = "Preferred market must be less than 150 characters")
    private String preferredMarket;

    private String notes;
}
