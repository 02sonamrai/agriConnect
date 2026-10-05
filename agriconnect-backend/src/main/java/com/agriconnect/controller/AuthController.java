package com.agriconnect.controller;

import com.agriconnect.dto.AuthResponse;
import com.agriconnect.dto.LoginRequest;
import com.agriconnect.dto.RegisterRequest;
import com.agriconnect.dto.UpdateProfileRequest;
import com.agriconnect.dto.UserProfileResponse;
import com.agriconnect.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(
            @Valid @RequestBody RegisterRequest request) {

        AuthResponse response = authService.register(request);

        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/profile")
    public ResponseEntity<UserProfileResponse> getProfile(Principal principal) {

        if (principal == null) {
            return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
        }

        UserProfileResponse response =
                authService.getProfile(principal.getName());

        return ResponseEntity.ok(response);
    }

    /**
     * Updates the caller's own delivery address. The account is resolved from the JWT subject
     * and never from the request body, so there is no way to address someone else's record.
     *
     * This only touches the User profile. Orders keep the address snapshot taken when they were
     * placed, so sellers continue to see the destination an order was actually shipped to.
     */
    @PutMapping("/profile")
    public ResponseEntity<UserProfileResponse> updateProfile(
            Principal principal, @Valid @RequestBody UpdateProfileRequest request) {

        if (principal == null) {
            return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
        }

        UserProfileResponse response =
                authService.updateProfile(principal.getName(), request);

        return ResponseEntity.ok(response);
    }
}
