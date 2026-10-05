package com.agriconnect.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * One crop line from one of the signed-in farmer's orders, used for the "recent sales" list.
 *
 * <p>Everything here is already visible to that farmer on the Orders Received screen. Buyer
 * contact details (email, phone, delivery address) are deliberately absent - a sales summary
 * needs to say who bought, not where they live.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FarmerSaleLineResponse {
    private Long orderId;
    private String orderNumber;
    private LocalDateTime orderDate;
    private String orderStatus;
    private String buyerName;
    private String cropName;
    private BigDecimal quantity;
    private String unit;
    private BigDecimal totalPrice;
    private String location;
}