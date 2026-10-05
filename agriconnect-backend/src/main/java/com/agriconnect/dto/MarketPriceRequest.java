package com.agriconnect.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.math.BigDecimal;

/**
 * Admin-managed body for creating and updating a market price.
 *
 * <p>There is no {@code id} and no owner field on purpose - market prices are shared reference
 * data, so a write can only ever change the rate itself.
 */
@Data
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MarketPriceRequest {

    @NotBlank(message = "Crop name is required")
    @Size(max = 100, message = "Crop name must be less than 100 characters")
    private String cropName;

    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.01", message = "Price must be greater than zero")
    @Digits(integer = 8, fraction = 2, message = "Price must have at most 8 digits and 2 decimal places")
    private BigDecimal pricePerUnit;

    @Size(max = 20, message = "Unit must be less than 20 characters")
    private String unit;

    @NotBlank(message = "Market name is required")
    @Size(max = 150, message = "Market name must be less than 150 characters")
    private String marketName;
}