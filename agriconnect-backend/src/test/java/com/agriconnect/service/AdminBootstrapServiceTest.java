package com.agriconnect.service;

import com.agriconnect.entity.Role;
import com.agriconnect.entity.User;
import com.agriconnect.repository.RoleRepository;
import com.agriconnect.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminBootstrapServiceTest {
    @Mock private UserRepository userRepository;
    @Mock private RoleRepository roleRepository;
    @InjectMocks private AdminBootstrapService service;

    @Test
    void promotesOnlyAnExistingAccountWithoutChangingItsPassword() {
        User user = User.builder().email("admin@example.test").password("existing-hash")
                .role(Role.builder().name("ROLE_BUYER").build()).build();
        Role adminRole = Role.builder().id(4).name("ROLE_ADMIN").build();
        when(userRepository.findByEmail("admin@example.test")).thenReturn(Optional.of(user));
        when(roleRepository.findByName("ROLE_ADMIN")).thenReturn(Optional.of(adminRole));

        service.promoteExistingAccount("admin@example.test");

        assertEquals("ROLE_ADMIN", user.getRole().getName());
        assertEquals("existing-hash", user.getPassword());
        verify(userRepository).save(user);
        verify(roleRepository, never()).save(any(Role.class));
    }
}
