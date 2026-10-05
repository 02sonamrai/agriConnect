package com.agriconnect.config;

import com.agriconnect.entity.MarketPrice;
import com.agriconnect.repository.MarketPriceRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

/**
 * Seeds a starting set of sample mandi rates on first run.
 *
 * <p>Guarded by an empty-table check, so this is a one-time bootstrap: once an administrator
 * edits or deletes a seeded row the change is never overwritten on a later restart. Nothing here
 * runs if the table already has rows.
 */
@Component
public class MarketPriceSeedRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(MarketPriceSeedRunner.class);

    private final MarketPriceRepository marketPriceRepository;

    public MarketPriceSeedRunner(MarketPriceRepository marketPriceRepository) {
        this.marketPriceRepository = marketPriceRepository;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (marketPriceRepository.count() > 0) {
            return;
        }

        marketPriceRepository.saveAll(samplePrices());
        log.info("Seeded {} sample market prices (table was empty)", marketPriceRepository.count());
    }

    private List<MarketPrice> samplePrices() {
        return List.of(
                price("Wheat", "2450", "Pune Market Yard"),
                price("Rice", "2380", "Pune Market Yard"),
                price("Maize", "2100", "Nashik APMC"),
                price("Soybean", "4650", "Nagpur Market"),
                price("Cotton", "7120", "Akola APMC"),
                price("Onion", "1850", "Lasalgaon APMC"),
                price("Tomato", "1650", "Nashik APMC"),
                price("Potato", "1250", "Pune Market Yard"),
                price("Tur (Arhar Dal)", "8350", "Latur APMC"),
                price("Groundnut", "6280", "Junagadh APMC"));
    }

    private MarketPrice price(String cropName, String amountPerQuintal, String marketName) {
        return MarketPrice.builder()
                .cropName(cropName)
                .pricePerUnit(new BigDecimal(amountPerQuintal))
                .unit("Quintal")
                .marketName(marketName)
                .build();
    }
}