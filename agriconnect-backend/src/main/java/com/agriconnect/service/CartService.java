package com.agriconnect.service;

import com.agriconnect.dto.CartResponse;

import java.math.BigDecimal;

public interface CartService {

    CartResponse getCart(String buyerEmail);

    /**
     * Adds a crop to the buyer's cart, merging into an existing entry for the same crop.
     * Rejects unavailable crops and quantities above the listed stock.
     */
    CartResponse addItem(Long cropId, BigDecimal quantity, String buyerEmail);

    CartResponse updateItem(Long itemId, BigDecimal quantity, String buyerEmail);

    void removeItem(Long itemId, String buyerEmail);

    void clearCart(String buyerEmail);
}
