package com.agriconnect.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Order header as seen by a seller. Contains only the seller own order lines - never the
 * other sellers items that happen to sit in the same order.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReceivedOrderResponse {

    private Long id;
    private String orderNumber;
    private String status;
    private String buyerName;
    /**
     * Delivery address the seller has to fulfil to. Only the address is exposed - no buyer
     * email, phone or account data - and only for orders containing this seller's own lines.
     */
    private String deliveryAddress;
    private String deliveryCity;
    private String deliveryState;
    private String deliveryPincode;
    private LocalDateTime createdAt;

    /** Total value of this seller's lines only. */
    private BigDecimal totalAmount;

    private int itemCount;
    private LocalDateTime updatedAt;
    private List<OrderItemResponse> items;
}
