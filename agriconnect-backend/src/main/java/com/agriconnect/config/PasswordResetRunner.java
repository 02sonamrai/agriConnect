package com.agriconnect.config;

import com.agriconnect.service.PasswordResetService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

/**
 * Opt-in local development password reset for an account that already exists.
 *
 * <p>Inert unless the {@code local} or {@code dev} profile is active and
 * {@code AGRICONNECT_PASSWORD_RESET_ENABLED=true} is set. Unset the flag after the one startup
 * that needs it so later startups never rewrite the stored password.
 */
@Component
@Profile({"local", "dev"})
@ConditionalOnProperty(prefix = "agriconnect.password-reset", name = "enabled", havingValue = "true")
public class PasswordResetRunner implements ApplicationRunner {
    private static final Logger log = LoggerFactory.getLogger(PasswordResetRunner.class);

    private final PasswordResetService passwordResetService;
    private final String email;
    private final String password;

    public PasswordResetRunner(PasswordResetService passwordResetService,
                               @Value("${agriconnect.password-reset.email}") String email,
                               @Value("${agriconnect.password-reset.password}") String password) {
        this.passwordResetService = passwordResetService;
        this.email = email;
        this.password = password;
    }

    @Override
    public void run(ApplicationArguments args) {
        passwordResetService.resetPasswordForExistingAccount(email, password);
        // Email only. The password is never written to the log.
        log.info("Local development password reset applied to existing account {}", email);
    }
}
