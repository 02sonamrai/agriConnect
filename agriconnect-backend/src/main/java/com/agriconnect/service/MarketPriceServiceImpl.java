package com.agriconnect.service;

import com.agriconnect.dto.MarketPriceRequest;
import com.agriconnect.dto.MarketPriceResponse;
import com.agriconnect.entity.MarketPrice;
import com.agriconnect.exception.CustomException;
import com.agriconnect.repository.MarketPriceRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class MarketPriceServiceImpl implements MarketPriceService {

    /** Mandi rates are conventionally quoted per quintal; used when the admin leaves unit blank. */
    private static final String DEFAULT_UNIT = "Quintal";

    private final MarketPriceRepository marketPriceRepository;

    public MarketPriceServiceImpl(MarketPriceRepository marketPriceRepository) {
        this.marketPriceRepository = marketPriceRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<MarketPriceResponse> getAll(String search) {
        List<MarketPrice> prices = (search == null || search.isBlank())
                ? marketPriceRepository.findAllByOrderByCropNameAsc()
                : marketPriceRepository
                        .findByCropNameContainingIgnoreCaseOrMarketNameContainingIgnoreCaseOrderByCropNameAsc(
                                search.trim(), search.trim());

        return prices.stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional
    public MarketPriceResponse create(MarketPriceRequest request) {
        MarketPrice saved = marketPriceRepository.save(MarketPrice.builder()
                .cropName(request.getCropName().trim())
                .pricePerUnit(request.getPricePerUnit())
                .unit(defaultUnit(request.getUnit()))
                .marketName(request.getMarketName().trim())
                .build());

        return toResponse(saved);
    }

    @Override
    @Transactional
    public MarketPriceResponse update(Long id, MarketPriceRequest request) {
        MarketPrice price = marketPriceRepository.findById(id)
                .orElseThrow(() -> new CustomException("Market price not found", HttpStatus.NOT_FOUND));

        price.setCropName(request.getCropName().trim());
        price.setPricePerUnit(request.getPricePerUnit());
        price.setUnit(defaultUnit(request.getUnit()));
        price.setMarketName(request.getMarketName().trim());

        return toResponse(marketPriceRepository.save(price));
    }

    @Override
    @Transactional
    public void delete(Long id) {
        MarketPrice price = marketPriceRepository.findById(id)
                .orElseThrow(() -> new CustomException("Market price not found", HttpStatus.NOT_FOUND));

        marketPriceRepository.delete(price);
    }

    private String defaultUnit(String unit) {
        return (unit == null || unit.isBlank()) ? DEFAULT_UNIT : unit.trim();
    }

    private MarketPriceResponse toResponse(MarketPrice price) {
        return MarketPriceResponse.builder()
                .id(price.getId())
                .cropName(price.getCropName())
                .pricePerUnit(price.getPricePerUnit())
                .unit(price.getUnit())
                .marketName(price.getMarketName())
                .updatedAt(price.getUpdatedAt())
                .build();
    }
}