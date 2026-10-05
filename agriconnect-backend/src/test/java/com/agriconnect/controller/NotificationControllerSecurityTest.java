package com.agriconnect.controller;

import com.agriconnect.config.SecurityConfig;
import com.agriconnect.dto.NotificationResponse;
import com.agriconnect.security.CustomUserDetailsService;
import com.agriconnect.security.JwtAuthenticationFilter;
import com.agriconnect.service.NotificationService;
import com.agriconnect.util.JwtUtil;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * A notification belongs to the account it was written for, so every signed-in role may use the
 * prefix and the service does the scoping. These tests pin that half of the contract - the
 * endpoint is authenticated for every role - and assert there is no way to create one by hand.
 *
 * <p>They exercise the real SecurityConfig, so moving the prefix somewhere less restrictive later
 * would fail here.
 */
@WebMvcTest(NotificationController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class})
class NotificationControllerSecurityTest {

    @Autowired
    private MockMvc mvc;

    @MockBean
    private NotificationService notificationService;
    @MockBean
    private JwtUtil jwtUtil;
    @MockBean
    private CustomUserDetailsService userDetailsService;

    private NotificationResponse sample() {
        return NotificationResponse.builder()
                .id(1L).type("ORDER_DELIVERED").title("Order ORD-000500 delivered")
                .message("Delivered.").orderId(500L).orderNumber("ORD-000500")
                .read(false).build();
    }

    @Test
    void anAnonymousCallerCannotReachNotifications() throws Exception {
        // 403, not 401: this app configures no authentication entry point, so every protected
        // endpoint rejects an anonymous caller this way. Asserted as-is rather than "fixed",
        // because it is the existing behaviour of all the other prefixes too.
        mvc.perform(get("/api/notifications")).andExpect(status().isForbidden());
        mvc.perform(get("/api/notifications/unread-count")).andExpect(status().isForbidden());
        mvc.perform(put("/api/notifications/1/read")).andExpect(status().isForbidden());
        mvc.perform(put("/api/notifications/read-all")).andExpect(status().isForbidden());
        verifyNoInteractions(notificationService);
    }

    @Test
    @WithMockUser(authorities = "ROLE_BUYER")
    void aBuyerReadsTheirOwnNotifications() throws Exception {
        when(notificationService.getNotifications(anyString())).thenReturn(List.of(sample()));

        mvc.perform(get("/api/notifications"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].type").value("ORDER_DELIVERED"))
                .andExpect(jsonPath("$[0].read").value(false));
    }

    @Test
    @WithMockUser(authorities = "ROLE_FARMER")
    void aFarmerReadsTheirOwnNotifications() throws Exception {
        when(notificationService.getNotifications(anyString())).thenReturn(List.of(sample()));

        mvc.perform(get("/api/notifications")).andExpect(status().isOk());
    }

    @Test
    @WithMockUser(authorities = "ROLE_MIDDLEMAN")
    void aCoordinatorReadsTheirOwnNotifications() throws Exception {
        when(notificationService.getNotifications(anyString())).thenReturn(List.of(sample()));

        mvc.perform(get("/api/notifications")).andExpect(status().isOk());
    }

    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void anAdminReadsTheirOwnNotifications() throws Exception {
        when(notificationService.getNotifications(anyString())).thenReturn(List.of());

        mvc.perform(get("/api/notifications")).andExpect(status().isOk());
    }

    @Test
    @WithMockUser(authorities = "ROLE_BUYER")
    void theUnreadCountDrivesTheBellBadge() throws Exception {
        when(notificationService.getUnreadCount(anyString())).thenReturn(3L);

        mvc.perform(get("/api/notifications/unread-count"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.unreadCount").value(3));
    }

    @Test
    @WithMockUser(authorities = "ROLE_FARMER")
    void aFarmerCanDismissOneOfTheirNotifications() throws Exception {
        when(notificationService.markRead(eq(1L), anyString())).thenReturn(
                NotificationResponse.builder().id(1L).read(true).build());

        mvc.perform(put("/api/notifications/1/read"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.read").value(true));
    }

    @Test
    @WithMockUser(authorities = "ROLE_BUYER")
    void markAllReadReportsHowManyItCleared() throws Exception {
        when(notificationService.markAllRead(anyString())).thenReturn(5L);

        mvc.perform(put("/api/notifications/read-all"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.markedRead").value(5));
    }

    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void notificationsCannotBeCreatedOverHttp() throws Exception {
        // Alerts are only ever raised by the order flow. No write endpoint exists, so a forged
        // notification is not reachable even by an admin.
        mvc.perform(post("/api/notifications")).andExpect(notSuccessful());
        verifyNoInteractions(notificationService);
    }

    @Test
    @WithMockUser(authorities = "ROLE_BUYER")
    void deletingANotificationIsNotOffered() throws Exception {
        // Notifications are dismissible, not deletable - the history stays intact.
        mvc.perform(delete("/api/notifications/1")).andExpect(notSuccessful());
        verifyNoInteractions(notificationService);
    }

    /**
     * The request must fail. The exact status is deliberately not pinned: an unmapped method or
     * path currently surfaces as 500 rather than 405/404 because GlobalExceptionHandler does not
     * cover those exceptions, which is a pre-existing gap in this app and not part of this
     * feature.
     */
    private static org.springframework.test.web.servlet.ResultMatcher notSuccessful() {
        return result -> assertTrue(result.getResponse().getStatus() >= 400,
                "expected the request to be rejected, got " + result.getResponse().getStatus());
    }
}
