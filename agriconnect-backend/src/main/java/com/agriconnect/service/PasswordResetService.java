package com.agriconnect.service;

import com.agriconnect.entity.User;
import com.agriconnect.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Sets a new password on an account that already exists.
 *
 * <p>This never creates an account, never changes a role or the active flag, and never touches
 * any row other than the single account identified by email. If the email does not resolve to an
 * existing account the operation aborts rather than inserting one.
 */
@Service
public class PasswordResetService {
    private static final int MIN_PASSWORD_LENGTH = 8;
    private static final int MAX_PASSWORD_LENGTH = 100;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public PasswordResetService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Replaces the stored password of exactly one existing account.
     *
     * @throws IllegalStateException    if no account exists for the supplied email
     * @throws IllegalArgumentException if the supplied password is blank or out of range
     */
    @Transactional
    public void resetPasswordForExistingAccount(String email, String rawPassword) {
        if (rawPassword == null || rawPassword.isBlank()) {
            throw new IllegalArgumentException("Password reset requires a non-blank password");
        }
        if (rawPassword.length() < MIN_PASSWORD_LENGTH || rawPassword.length() > MAX_PASSWORD_LENGTH) {
            throw new IllegalArgumentException("Password reset requires a password between "
                    + MIN_PASSWORD_LENGTH + " and " + MAX_PASSWORD_LENGTH + " characters");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException(
                        "Password reset target account was not found; no account was created"));

        // Only the password column is written. Role, active flag and profile fields are left as-is.
        user.setPassword(passwordEncoder.encode(rawPassword));
        userRepository.save(user);
    }
}
