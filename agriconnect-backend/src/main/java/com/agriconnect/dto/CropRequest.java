package com.agriconnect.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CropRequest {

    @NotBlank(message = "Crop name is required")
    @Size(max = 100, message = "Crop name must be less than 100 characters")
    private String cropName;

    @NotBlank(message = "Category is required")
    @Size(max = 50, message = "Category must be less than 50 characters")
    private String category;

    @Size(max = 500, message = "Description must not exceed 500 characters")
    private String description;

    @NotNull(message = "Quantity is required")
    @DecimalMin(value = "0.01", message = "Quantity must be greater than 0")
    private BigDecimal quantity;

    @NotBlank(message = "Unit is required")
    @Pattern(regexp = "^(Kg|Quintal|Ton)$", message = "Unit must be Kg, Quintal, or Ton")
    private String unit;

    @NotNull(message = "Price per unit is required")
    @DecimalMin(value = "0.01", message = "Price per unit must be greater than 0")
    private BigDecimal pricePerUnit;

    @NotBlank(message = "Location is required")
    @Size(max = 100, message = "Location must be less than 100 characters")
    private String location;

    @Size(max = 255, message = "Image URL must be less than 255 characters")
    private String imageUrl;

    private Boolean available = true;
}
