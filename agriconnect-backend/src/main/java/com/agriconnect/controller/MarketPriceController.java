package com.agriconnect.controller;

import com.agriconnect.dto.MarketPriceRequest;
import com.agriconnect.dto.MarketPriceResponse;
import com.agriconnect.service.MarketPriceService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Market (mandi) price reference data.
 *
 * <p>There is no class-level {@code @RequestMapping} on purpose: the read and write routes have
 * to sit under different path prefixes so the existing SecurityConfig rules do the authorisation
 * work without any change.
 *
 * <ul>
 *   <li>{@code /api/marketplace/market-prices} - already restricted to BUYER, FARMER and ADMIN.</li>
 *   <li>{@code /api/admin/market-prices} - already restricted to ADMIN, so only an
 *       administrator can add, edit or delete a rate.</li>
 * </ul>
 */
@RestController
public class MarketPriceController {

    private final MarketPriceService marketPriceService;

    public MarketPriceController(MarketPriceService marketPriceService) {
        this.marketPriceService = marketPriceService;
    }

    @GetMapping("/api/marketplace/market-prices")
    public List<MarketPriceResponse> getPrices(
            @RequestParam(required = false) String search) {
        return marketPriceService.getAll(search);
    }

    @PostMapping("/api/admin/market-prices")
    public ResponseEntity<MarketPriceResponse> createPrice(
            @Valid @RequestBody MarketPriceRequest request) {
        return new ResponseEntity<>(marketPriceService.create(request), HttpStatus.CREATED);
    }

    @PutMapping("/api/admin/market-prices/{id}")
    public MarketPriceResponse updatePrice(
            @PathVariable Long id, @Valid @RequestBody MarketPriceRequest request) {
        return marketPriceService.update(id, request);
    }

    @DeleteMapping("/api/admin/market-prices/{id}")
    public ResponseEntity<Void> deletePrice(@PathVariable Long id) {
        marketPriceService.delete(id);
        return ResponseEntity.noContent().build();
    }
}