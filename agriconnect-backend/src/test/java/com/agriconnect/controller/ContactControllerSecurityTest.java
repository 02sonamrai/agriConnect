package com.agriconnect.controller;

import com.agriconnect.config.SecurityConfig;
import com.agriconnect.dto.FarmerContactResponse;
import com.agriconnect.security.CustomUserDetailsService;
import com.agriconnect.security.JwtAuthenticationFilter;
import com.agriconnect.service.ContactService;
import com.agriconnect.util.JwtUtil;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ContactController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class})
class ContactControllerSecurityTest {

    @Autowired private MockMvc mvc;
    @MockBean private ContactService contactService;
    @MockBean private JwtUtil jwtUtil;
    @MockBean private CustomUserDetailsService userDetailsService;

    @Test
    @WithMockUser(authorities = "ROLE_BUYER")
    void buyerCanRequestSellerContact() throws Exception {
        when(contactService.getContactForCrop(anyLong())).thenReturn(FarmerContactResponse.builder().build());
        mvc.perform(get("/api/contact/crop/9")).andExpect(status().isOk());
    }

    @Test
    @WithMockUser(authorities = "ROLE_FARMER")
    void farmerCanRequestSellerContact() throws Exception {
        when(contactService.getContactForCrop(anyLong())).thenReturn(FarmerContactResponse.builder().build());
        mvc.perform(get("/api/contact/crop/9")).andExpect(status().isOk());
    }

    @Test
    @WithMockUser(authorities = "ROLE_MIDDLEMAN")
    void coordinatorCannotRequestSellerContact() throws Exception {
        mvc.perform(get("/api/contact/crop/9")).andExpect(status().isForbidden());
        verify(contactService, never()).getContactForCrop(anyLong());
    }

    @Test
    void anonymousCallerCannotRequestSellerContact() throws Exception {
        mvc.perform(get("/api/contact/crop/9")).andExpect(status().is4xxClientError());
        verify(contactService, never()).getContactForCrop(anyLong());
    }
}
