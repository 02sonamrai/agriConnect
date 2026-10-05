package com.agriconnect.controller;

import com.agriconnect.config.SecurityConfig;
import com.agriconnect.dto.AdminDashboardResponse;
import com.agriconnect.security.CustomUserDetailsService;
import com.agriconnect.security.JwtAuthenticationFilter;
import com.agriconnect.service.AdminService;
import com.agriconnect.util.JwtUtil;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AdminController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class})
class AdminControllerSecurityTest {
    @Autowired private MockMvc mvc;
    @MockBean private AdminService adminService;
    @MockBean private JwtUtil jwtUtil;
    @MockBean private CustomUserDetailsService userDetailsService;

    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void adminCanReadDashboard() throws Exception {
        when(adminService.getDashboard()).thenReturn(new AdminDashboardResponse(0, 0, 0, 0, 0, 0, 0));
        mvc.perform(get("/api/admin/dashboard")).andExpect(status().isOk());
    }

    @Test
    @WithMockUser(authorities = "ROLE_FARMER")
    void farmerCannotReadAdminDashboard() throws Exception {
        mvc.perform(get("/api/admin/dashboard")).andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(authorities = "ROLE_BUYER")
    void buyerCannotReadAdminDashboard() throws Exception {
        mvc.perform(get("/api/admin/dashboard")).andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(authorities = "ROLE_MIDDLEMAN")
    void coordinatorCannotReadAdminDashboard() throws Exception {
        mvc.perform(get("/api/admin/dashboard")).andExpect(status().isForbidden());
    }
}
