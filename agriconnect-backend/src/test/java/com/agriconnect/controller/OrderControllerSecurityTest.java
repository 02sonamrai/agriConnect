package com.agriconnect.controller;

import com.agriconnect.config.SecurityConfig;
import com.agriconnect.dto.OrderResponse;
import com.agriconnect.dto.ReceivedOrderResponse;
import com.agriconnect.security.CustomUserDetailsService;
import com.agriconnect.security.JwtAuthenticationFilter;
import com.agriconnect.service.OrderService;
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
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(OrderController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class})
class OrderControllerSecurityTest {

    @Autowired private MockMvc mvc;
    @MockBean private OrderService orderService;
    @MockBean private JwtUtil jwtUtil;
    @MockBean private CustomUserDetailsService userDetailsService;

    @Test
    @WithMockUser(authorities = "ROLE_BUYER")
    void buyerCanReadTheirOrders() throws Exception {
        when(orderService.getMyOrders(anyString())).thenReturn(List.of());
        mvc.perform(get("/api/orders")).andExpect(status().isOk());
    }

    @Test
    @WithMockUser(authorities = "ROLE_FARMER")
    void farmerCanReadOrdersReceived() throws Exception {
        when(orderService.getReceivedOrders(anyString())).thenReturn(List.<ReceivedOrderResponse>of());
        mvc.perform(get("/api/orders/received")).andExpect(status().isOk());
    }

    @Test
    @WithMockUser(authorities = "ROLE_MIDDLEMAN")
    void coordinatorCannotReadAnyOrders() throws Exception {
        mvc.perform(get("/api/orders")).andExpect(status().isForbidden());
        mvc.perform(get("/api/orders/received")).andExpect(status().isForbidden());
        verify(orderService, never()).getMyOrders(anyString());
        verify(orderService, never()).getReceivedOrders(anyString());
    }

    @Test
    void anonymousCallerCannotReadOrders() throws Exception {
        mvc.perform(get("/api/orders")).andExpect(status().is4xxClientError());
        mvc.perform(get("/api/orders/" + 1L)).andExpect(status().is4xxClientError());
        verify(orderService, never()).getOrderById(anyLong(), anyString());
    }

    /**
     * "Received" is the farmer's own view of a buyer's order. A buyer is authenticated and
     * passes the broad /api/orders/** rule, so this needs an explicit narrower matcher -
     * without one the endpoint answers 200 with an empty list.
     */
    @Test
    @WithMockUser(authorities = "ROLE_BUYER")
    void buyerCannotReadTheFarmerReceivedView() throws Exception {
        mvc.perform(get("/api/orders/received")).andExpect(status().isForbidden());
        verify(orderService, never()).getReceivedOrders(anyString());
    }

    /** A farmer has no cart, so a farmer must not be able to create an order. */
    @Test
    @WithMockUser(authorities = "ROLE_FARMER")
    void farmerCannotPlaceAnOrder() throws Exception {
        mvc.perform(post("/api/orders").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isForbidden());
        verify(orderService, never()).placeOrder(any(), anyString());
    }

    /** The narrower POST rule must not accidentally block the buyer. */
    @Test
    @WithMockUser(authorities = "ROLE_BUYER")
    void buyerCanStillPlaceAnOrder() throws Exception {
        when(orderService.placeOrder(any(), anyString())).thenReturn(OrderResponse.builder().build());
        mvc.perform(post("/api/orders").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isCreated());
        verify(orderService).placeOrder(any(), anyString());
    }
}
