package com.agriconnect.service;

import com.agriconnect.dto.AuthResponse;
import com.agriconnect.dto.LoginRequest;
import com.agriconnect.dto.RegisterRequest;
import com.agriconnect.dto.UpdateProfileRequest;
import com.agriconnect.dto.UserProfileResponse;

public interface AuthService {
    AuthResponse register(RegisterRequest request);
    AuthResponse login(LoginRequest request);
    UserProfileResponse getProfile(String email);

    /**
     * Overwrites the given user's delivery address. The email is resolved from the caller's
     * own credentials, never from the request body, so one user can never edit another.
     */
    UserProfileResponse updateProfile(String email, UpdateProfileRequest request);
}
