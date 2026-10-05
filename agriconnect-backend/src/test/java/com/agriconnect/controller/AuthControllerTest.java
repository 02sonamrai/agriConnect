package com.agriconnect.controller;

import com.agriconnect.dto.AuthResponse;
import com.agriconnect.dto.RegisterRequest;
import com.agriconnect.dto.UpdateProfileRequest;
import com.agriconnect.dto.UserProfileResponse;
import com.agriconnect.service.AuthService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.http.MediaType;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AuthControllerTest {

    private final AuthService authService = mock(AuthService.class);
    private final LocalValidatorFactoryBean validator = new LocalValidatorFactoryBean();
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        validator.afterPropertiesSet();
        mockMvc = MockMvcBuilders.standaloneSetup(new AuthController(authService))
                .setValidator(validator)
                .build();
    }

    @AfterEach
    void tearDown() {
        validator.destroy();
    }

    @Test
    void registrationRejectsAdminBeforeCallingService() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"admin@example.test","password":"safe-password",
                                 "firstName":"Admin","lastName":"User","phoneNumber":"9876543210",
                                 "role":"ADMIN"}
                                """))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(authService);
    }

    @Test
    void registrationKeepsFarmerBuyerAndCoordinatorRoles() throws Exception {
        when(authService.register(any(RegisterRequest.class)))
                .thenReturn(AuthResponse.builder().role("ROLE_FARMER").build());

        for (String role : new String[]{"FARMER", "BUYER", "MIDDLEMAN"}) {
            String body = """
                    {"email":"%s@example.test","password":"safe-password",
                     "firstName":"Test","lastName":"User","phoneNumber":"9876543210",
                     "role":"%s"}
                    """.formatted(role.toLowerCase(), role);

            mockMvc.perform(post("/api/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(body))
                    .andExpect(status().isCreated());
        }

        verify(authService, times(3)).register(any(RegisterRequest.class));
    }

    @Test
    void authenticationDtoToStringOmitsPasswordsAndJwt() {
        String password = "sensitive-password-sentinel";
        String token = "sensitive-jwt-sentinel";

        assertFalse(RegisterRequest.builder().password(password).build().toString().contains(password));
        assertFalse(com.agriconnect.dto.LoginRequest.builder().password(password).build().toString().contains(password));
        assertFalse(AuthResponse.builder().token(token).build().toString().contains(token));
    }

    @Test
    void loginRejectsInvalidEmailAndBlankPasswordBeforeCallingService() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"not-an-email\",\"password\":\"\"}"))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(authService);
    }

    @Test
    void profileUpdateRejectsOversizedAddressBeforeCallingService() throws Exception {
        mockMvc.perform(put("/api/auth/profile")
                        .principal(() -> "buyer@example.test")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"addressLine\":\"" + "a".repeat(201) + "\"}"))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(authService);
    }

    /**
     * The account being edited must come from the caller's own credentials. A body-supplied
     * email is ignored, so one user cannot redirect the update onto someone else's record.
     */
    @Test
    void profileUpdateEditsTheCallersOwnAccountOnly() throws Exception {
        when(authService.updateProfile(any(String.class), any(UpdateProfileRequest.class)))
                .thenReturn(UserProfileResponse.builder().email("buyer@example.test").build());

        mockMvc.perform(put("/api/auth/profile")
                        .principal(() -> "buyer@example.test")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"victim@example.test","addressLine":"12 Shivaji Nagar","city":"Pune"}
                                """))
                .andExpect(status().isOk());

        ArgumentCaptor<UpdateProfileRequest> sent = ArgumentCaptor.forClass(UpdateProfileRequest.class);
        verify(authService).updateProfile(eq("buyer@example.test"), sent.capture());
        assertEquals("12 Shivaji Nagar", sent.getValue().getAddressLine());
        assertEquals("Pune", sent.getValue().getCity());
        // Absent parts stay null so the service can clear a stored value on an empty field.
        assertNull(sent.getValue().getState());
        assertNull(sent.getValue().getPincode());
    }
}
