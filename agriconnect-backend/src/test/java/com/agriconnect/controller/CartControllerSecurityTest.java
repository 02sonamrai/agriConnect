package com.agriconnect.controller;

import com.agriconnect.config.SecurityConfig;
import com.agriconnect.dto.CartResponse;
import com.agriconnect.security.CustomUserDetailsService;
import com.agriconnect.security.JwtAuthenticationFilter;
import com.agriconnect.service.CartService;
import com.agriconnect.util.JwtUtil;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(CartController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class})
class CartControllerSecurityTest {

    @Autowired private MockMvc mvc;
    @MockBean private CartService cartService;
    @MockBean private JwtUtil jwtUtil;
    @MockBean private CustomUserDetailsService userDetailsService;

    @Test
    @WithMockUser(authorities = "ROLE_BUYER")
    void buyerCanReadTheirCart() throws Exception {
        when(cartService.getCart(anyString())).thenReturn(CartResponse.builder().build());
        mvc.perform(get("/api/cart")).andExpect(status().isOk());
    }

    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void adminCanReadCart() throws Exception {
        when(cartService.getCart(anyString())).thenReturn(CartResponse.builder().build());
        mvc.perform(get("/api/cart")).andExpect(status().isOk());
    }

    @Test
    @WithMockUser(authorities = "ROLE_FARMER")
    void farmerCannotUseTheCart() throws Exception {
        mvc.perform(get("/api/cart")).andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(authorities = "ROLE_MIDDLEMAN")
    void coordinatorCannotUseTheCart() throws Exception {
        mvc.perform(get("/api/cart")).andExpect(status().isForbidden());
    }

    @Test
    void anonymousCallerCannotUseTheCart() throws Exception {
        mvc.perform(get("/api/cart")).andExpect(status().is4xxClientError());
    }
}
