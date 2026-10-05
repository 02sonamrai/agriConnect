package com.agriconnect.repository;

import com.agriconnect.entity.MarketPrice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MarketPriceRepository extends JpaRepository<MarketPrice, Long> {

    /** Alphabetical by crop so the read-only price list is stable between requests. */
    List<MarketPrice> findAllByOrderByCropNameAsc();

    /**
     * Case-insensitive partial match on the crop name or the market name. Used by the farmer and
     * buyer price view so a farmer can filter to the crops they actually grow.
     */
    List<MarketPrice> findByCropNameContainingIgnoreCaseOrMarketNameContainingIgnoreCaseOrderByCropNameAsc(
            String cropName, String marketName);
}