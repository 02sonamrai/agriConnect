package com.agriconnect.config;

import com.agriconnect.service.AdminBootstrapService;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.beans.factory.annotation.Value;

@Component
@Profile({"local", "dev"})
@ConditionalOnProperty(prefix = "agriconnect.admin-bootstrap", name = "enabled", havingValue = "true")
public class AdminBootstrapRunner implements ApplicationRunner {
    private final AdminBootstrapService adminBootstrapService;
    private final String email;

    public AdminBootstrapRunner(AdminBootstrapService adminBootstrapService,
                                @Value("${agriconnect.admin-bootstrap.email}") String email) {
        this.adminBootstrapService = adminBootstrapService;
        this.email = email;
    }

    @Override
    public void run(ApplicationArguments args) {
        adminBootstrapService.promoteExistingAccount(email);
    }
}
