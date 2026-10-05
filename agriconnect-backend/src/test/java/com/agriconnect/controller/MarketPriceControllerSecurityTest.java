package com.agriconnect.controller;

import com.agriconnect.config.SecurityConfig;
import com.agriconnect.dto.MarketPriceResponse;
import com.agriconnect.security.CustomUserDetailsService;
import com.agriconnect.security.JwtAuthenticationFilter;
import com.agriconnect.service.MarketPriceService;
import com.agriconnect.util.JwtUtil;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Market prices are shared reference data, so every role that can reach the marketplace may read
 * them - but only an administrator may change them. These tests exercise the real SecurityConfig,
 * so they also guard the path prefixes against being moved somewhere less restrictive later.
 */
@WebMvcTest(MarketPriceController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class})
class MarketPriceControllerSecurityTest {

    @Autowired
    private MockMvc mvc;

    @MockBean
    private MarketPriceService marketPriceService;
    @MockBean
    private JwtUtil jwtUtil;
    @MockBean
    private CustomUserDetailsService userDetailsService;

    private MarketPriceResponse sample() {
        return MarketPriceResponse.builder().id(1L).cropName("Wheat")
                .pricePerUnit(new java.math.BigDecimal("2450")).unit("Quintal")
                .marketName("Pune Market Yard").build();
    }

    private static final String VALID_BODY = """
            {"cropName":"Wheat","pricePerUnit":2450,"unit":"Quintal","marketName":"Pune Market Yard"}
            """;

    @Test
    @WithMockUser(authorities = "ROLE_FARMER")
    void farmerCanReadMarketPrices() throws Exception {
        when(marketPriceService.getAll(null)).thenReturn(List.of(sample()));
        mvc.perform(get("/api/marketplace/market-prices")).andExpect(status().isOk());
    }

    @Test
    @WithMockUser(authorities = "ROLE_BUYER")
    void buyerCanReadMarketPrices() throws Exception {
        when(marketPriceService.getAll("Pune")).thenReturn(List.of(sample()));
        mvc.perform(get("/api/marketplace/market-prices").param("search", "Pune"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void adminCanReadMarketPrices() throws Exception {
        when(marketPriceService.getAll(null)).thenReturn(List.of());
        mvc.perform(get("/api/marketplace/market-prices")).andExpect(status().isOk());
    }

    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void adminCanAddAMarketPrice() throws Exception {
        when(marketPriceService.create(any())).thenReturn(sample());
        mvc.perform(post("/api/admin/market-prices")
                        .contentType(MediaType.APPLICATION_JSON).content(VALID_BODY))
                .andExpect(status().isCreated());
    }

    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void adminCanEditAMarketPrice() throws Exception {
        when(marketPriceService.update(eq(1L), any())).thenReturn(sample());
        mvc.perform(put("/api/admin/market-prices/1")
                        .contentType(MediaType.APPLICATION_JSON).content(VALID_BODY))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void adminCanDeleteAMarketPrice() throws Exception {
        mvc.perform(delete("/api/admin/market-prices/1")).andExpect(status().isNoContent());
    }

    @Test
    @WithMockUser(authorities = "ROLE_FARMER")
    void farmerCannotAddAMarketPrice() throws Exception {
        mvc.perform(post("/api/admin/market-prices")
                        .contentType(MediaType.APPLICATION_JSON).content(VALID_BODY))
                .andExpect(status().isForbidden());
        verifyNoWrites();
    }

    @Test
    @WithMockUser(authorities = "ROLE_FARMER")
    void farmerCannotEditAMarketPrice() throws Exception {
        mvc.perform(put("/api/admin/market-prices/1")
                        .contentType(MediaType.APPLICATION_JSON).content(VALID_BODY))
                .andExpect(status().isForbidden());
        verifyNoWrites();
    }

    @Test
    @WithMockUser(authorities = "ROLE_FARMER")
    void farmerCannotDeleteAMarketPrice() throws Exception {
        mvc.perform(delete("/api/admin/market-prices/1")).andExpect(status().isForbidden());
        verifyNoWrites();
    }

    @Test
    @WithMockUser(authorities = "ROLE_BUYER")
    void buyerCannotAddAMarketPrice() throws Exception {
        mvc.perform(post("/api/admin/market-prices")
                        .contentType(MediaType.APPLICATION_JSON).content(VALID_BODY))
                .andExpect(status().isForbidden());
        verifyNoWrites();
    }

    @Test
    @WithMockUser(authorities = "ROLE_BUYER")
    void buyerCannotEditAMarketPrice() throws Exception {
        mvc.perform(put("/api/admin/market-prices/1")
                        .contentType(MediaType.APPLICATION_JSON).content(VALID_BODY))
                .andExpect(status().isForbidden());
        verifyNoWrites();
    }

    @Test
    @WithMockUser(authorities = "ROLE_BUYER")
    void buyerCannotDeleteAMarketPrice() throws Exception {
        mvc.perform(delete("/api/admin/market-prices/1")).andExpect(status().isForbidden());
        verifyNoWrites();
    }

    @Test
    @WithMockUser(authorities = "ROLE_MIDDLEMAN")
    void coordinatorCannotReadOrManageMarketPrices() throws Exception {
        mvc.perform(get("/api/marketplace/market-prices")).andExpect(status().isForbidden());
        mvc.perform(post("/api/admin/market-prices")
                        .contentType(MediaType.APPLICATION_JSON).content(VALID_BODY))
                .andExpect(status().isForbidden());
        verifyNoWrites();
    }

    /** A rejected request must never reach the service, so nothing can be half-applied. */
    private void verifyNoWrites() {
        org.mockito.Mockito.verify(marketPriceService, org.mockito.Mockito.never()).create(any());
        org.mockito.Mockito.verify(marketPriceService, org.mockito.Mockito.never()).update(eq(1L), any());
        org.mockito.Mockito.verify(marketPriceService, org.mockito.Mockito.never()).delete(eq(1L));
    }
}