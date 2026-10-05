package com.agriconnect.service;

import com.agriconnect.dto.MarketPriceRequest;
import com.agriconnect.dto.MarketPriceResponse;

import java.util.List;

/**
 * Approximate mandi rates maintained manually by an administrator.
 *
 * <p>Reads are open to any role that can reach the marketplace; writes are only reachable
 * through the /api/admin route prefix, which is already restricted to ROLE_ADMIN.
 */
public interface MarketPriceService {

    List<MarketPriceResponse> getAll(String search);

    MarketPriceResponse create(MarketPriceRequest request);

    MarketPriceResponse update(Long id, MarketPriceRequest request);

    void delete(Long id);
}