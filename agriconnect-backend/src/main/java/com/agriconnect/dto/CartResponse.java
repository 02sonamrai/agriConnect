package com.agriconnect.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CartResponse {

    private List<CartItemResponse> items;

    private long itemCount;

    private BigDecimal totalAmount;

    /** Number of entries that can actually be ordered right now. */
    private long orderableItemCount;
}
