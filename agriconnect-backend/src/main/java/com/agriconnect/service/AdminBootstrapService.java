package com.agriconnect.service;

import com.agriconnect.entity.Role;
import com.agriconnect.entity.User;
import com.agriconnect.repository.RoleRepository;
import com.agriconnect.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminBootstrapService {
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;

    public AdminBootstrapService(UserRepository userRepository, RoleRepository roleRepository) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
    }

    @Transactional
    public void promoteExistingAccount(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("Admin bootstrap account was not found"));
        Role adminRole = roleRepository.findByName("ROLE_ADMIN")
                .or(() -> roleRepository.findByName("ADMIN"))
                .orElseGet(() -> roleRepository.save(Role.builder()
                        .name("ROLE_ADMIN").description("Administrator role").build()));
        if (!"ROLE_ADMIN".equals(adminRole.getName())) {
            adminRole.setName("ROLE_ADMIN");
            adminRole = roleRepository.save(adminRole);
        }
        user.setRole(adminRole);
        userRepository.save(user);
    }
}
