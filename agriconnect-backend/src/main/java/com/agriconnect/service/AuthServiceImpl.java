package com.agriconnect.service;

import com.agriconnect.dto.AuthResponse;
import com.agriconnect.dto.LoginRequest;
import com.agriconnect.dto.RegisterRequest;
import com.agriconnect.dto.UpdateProfileRequest;
import com.agriconnect.dto.UserProfileResponse;
import com.agriconnect.entity.Role;
import com.agriconnect.entity.User;
import com.agriconnect.exception.CustomException;
import com.agriconnect.repository.RoleRepository;
import com.agriconnect.repository.UserRepository;
import com.agriconnect.util.JwtUtil;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;

    public AuthServiceImpl(UserRepository userRepository,
                            RoleRepository roleRepository,
                            PasswordEncoder passwordEncoder,
                            JwtUtil jwtUtil,
                            AuthenticationManager authenticationManager) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.authenticationManager = authenticationManager;
    }

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new CustomException("Email is already registered", HttpStatus.BAD_REQUEST);
        }

        if (userRepository.existsByPhoneNumber(request.getPhoneNumber())) {
            throw new CustomException("Phone number is already registered", HttpStatus.BAD_REQUEST);
        }

        String inputRole = request.getRole().toUpperCase();
        String dbRoleName = inputRole.startsWith("ROLE_") ? inputRole : "ROLE_" + inputRole;

        Role role = roleRepository.findByName(dbRoleName)
                .or(() -> roleRepository.findByName(inputRole))
                .orElseGet(() -> roleRepository.save(
                        Role.builder()
                                .name(dbRoleName)
                                .description(inputRole + " Role")
                                .build()
                ));

        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .phoneNumber(request.getPhoneNumber())
                .addressLine(trimToNull(request.getAddressLine()))
                .city(trimToNull(request.getCity()))
                .state(trimToNull(request.getState()))
                .pincode(trimToNull(request.getPincode()))
                .role(role)
                .isActive(true)
                .build();

        userRepository.save(user);

        String token = jwtUtil.generateToken(user.getEmail());

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .role(role.getName())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new CustomException("User not found", HttpStatus.UNAUTHORIZED));

        String token = jwtUtil.generateToken(user.getEmail());

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .role(user.getRole().getName())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public UserProfileResponse getProfile(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new CustomException("User not found", HttpStatus.NOT_FOUND));

        return toProfileResponse(user);
    }

    @Override
    @Transactional
    public UserProfileResponse updateProfile(String email, UpdateProfileRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new CustomException("User not found", HttpStatus.NOT_FOUND));

        // Full replacement, not a merge: the submitted form is the whole address, so clearing
        // a field must clear the stored value instead of leaving a stale value behind. The
        // same trimToNull used at registration keeps blank input from being stored as "".
        user.setAddressLine(trimToNull(request.getAddressLine()));
        user.setCity(trimToNull(request.getCity()));
        user.setState(trimToNull(request.getState()));
        user.setPincode(trimToNull(request.getPincode()));

        return toProfileResponse(userRepository.save(user));
    }

    /**
     * Single mapping from User to the profile DTO, shared by read and update so the address
     * fields cannot drift apart between the two.
     */
    private UserProfileResponse toProfileResponse(User user) {
        return UserProfileResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .phoneNumber(user.getPhoneNumber())
                .addressLine(user.getAddressLine())
                .city(user.getCity())
                .state(user.getState())
                .pincode(user.getPincode())
                .role(user.getRole().getName())
                .isActive(user.getIsActive())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }

    /**
     * Normalises an optional form field: a blank or whitespace-only address part is stored
     * as null so it is never echoed back to sellers as an empty line.
     */
    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
