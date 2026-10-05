package com.agriconnect.service;

import com.agriconnect.dto.MarketPriceRequest;
import com.agriconnect.dto.MarketPriceResponse;
import com.agriconnect.entity.MarketPrice;
import com.agriconnect.exception.CustomException;
import com.agriconnect.repository.MarketPriceRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MarketPriceServiceImplTest {

    @Mock
    private MarketPriceRepository marketPriceRepository;

    @InjectMocks
    private MarketPriceServiceImpl service;

    private MarketPriceRequest request(String crop, String price, String unit, String market) {
        return MarketPriceRequest.builder()
                .cropName(crop)
                .pricePerUnit(new BigDecimal(price))
                .unit(unit)
                .marketName(market)
                .build();
    }

    @Test
    void blankUnitFallsBackToQuintalBecauseThatIsTheMandiConvention() {
        when(marketPriceRepository.save(any(MarketPrice.class))).thenAnswer(call -> {
            MarketPrice saved = call.getArgument(0);
            saved.setId(1L);
            return saved;
        });

        MarketPriceResponse created = service.create(request("Wheat", "2450", "  ", "Pune Market Yard"));

        assertEquals("Quintal", created.getUnit());
    }

    @Test
    void suppliedUnitIsKeptAndTextIsTrimmed() {
        when(marketPriceRepository.save(any(MarketPrice.class))).thenAnswer(call -> {
            MarketPrice saved = call.getArgument(0);
            saved.setId(1L);
            return saved;
        });

        MarketPriceResponse created = service.create(request("  Wheat  ", "2450", " Kg ", "  Pune Yard  "));

        assertEquals("Wheat", created.getCropName());
        assertEquals("Kg", created.getUnit());
        assertEquals("Pune Yard", created.getMarketName());
        assertEquals(new BigDecimal("2450"), created.getPricePerUnit());
    }

    @Test
    void updateReplacesEveryFieldOnTheExistingRow() {
        MarketPrice existing = MarketPrice.builder().id(4L).cropName("Wheat")
                .pricePerUnit(new BigDecimal("2000")).unit("Quintal")
                .marketName("Old Market").build();
        when(marketPriceRepository.findById(4L)).thenReturn(Optional.of(existing));
        when(marketPriceRepository.save(any(MarketPrice.class))).thenAnswer(call -> call.getArgument(0));

        MarketPriceResponse updated = service.update(4L, request("Rice", "2380", "Quintal", "New Market"));

        assertEquals("Rice", updated.getCropName());
        assertEquals(new BigDecimal("2380"), updated.getPricePerUnit());
        assertEquals("New Market", updated.getMarketName());
        verify(marketPriceRepository).save(existing);
    }

    @Test
    void updatingAMissingPriceIsANotFound() {
        when(marketPriceRepository.findById(99L)).thenReturn(Optional.empty());

        CustomException ex = assertThrows(CustomException.class,
                () -> service.update(99L, request("Wheat", "2450", "Quintal", "Pune")));
        assertEquals(HttpStatus.NOT_FOUND, ex.getStatus());
    }

    @Test
    void deletingAMissingPriceIsANotFound() {
        when(marketPriceRepository.findById(99L)).thenReturn(Optional.empty());

        CustomException ex = assertThrows(CustomException.class, () -> service.delete(99L));
        assertEquals(HttpStatus.NOT_FOUND, ex.getStatus());
        verify(marketPriceRepository, never()).delete(any(MarketPrice.class));
    }

    @Test
    void deleteRemovesTheExistingRow() {
        MarketPrice existing = MarketPrice.builder().id(4L).cropName("Wheat").build();
        when(marketPriceRepository.findById(4L)).thenReturn(Optional.of(existing));

        service.delete(4L);

        verify(marketPriceRepository).delete(existing);
    }

    @Test
    void noSearchTermReturnsEveryPriceInCropOrder() {
        when(marketPriceRepository.findAllByOrderByCropNameAsc()).thenReturn(List.of(
                MarketPrice.builder().id(1L).cropName("Maize").pricePerUnit(new BigDecimal("2100"))
                        .unit("Quintal").marketName("Nashik APMC").build(),
                MarketPrice.builder().id(2L).cropName("Wheat").pricePerUnit(new BigDecimal("2450"))
                        .unit("Quintal").marketName("Pune Market Yard").build()));

        List<MarketPriceResponse> prices = service.getAll(null);

        assertEquals(2, prices.size());
        assertEquals("Maize", prices.get(0).getCropName());
        verify(marketPriceRepository, never())
                .findByCropNameContainingIgnoreCaseOrMarketNameContainingIgnoreCaseOrderByCropNameAsc(
                        any(), any());
    }

    @Test
    void blankSearchIsTreatedAsNoFilterRatherThanMatchingNothing() {
        when(marketPriceRepository.findAllByOrderByCropNameAsc()).thenReturn(List.of());

        assertEquals(0, service.getAll("   ").size());
        verify(marketPriceRepository).findAllByOrderByCropNameAsc();
    }

    @Test
    void aSearchTermMatchesCropOrMarketName() {
        when(marketPriceRepository
                .findByCropNameContainingIgnoreCaseOrMarketNameContainingIgnoreCaseOrderByCropNameAsc(
                        "Pune", "Pune"))
                .thenReturn(List.of(MarketPrice.builder().id(1L).cropName("Wheat")
                        .pricePerUnit(new BigDecimal("2450")).unit("Quintal")
                        .marketName("Pune Market Yard").build()));

        List<MarketPriceResponse> prices = service.getAll("  Pune  ");

        assertEquals(1, prices.size());
        assertEquals("Pune Market Yard", prices.get(0).getMarketName());
    }
}