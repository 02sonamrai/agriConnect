package com.agriconnect.service;

import com.agriconnect.entity.Role;
import com.agriconnect.entity.User;
import com.agriconnect.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PasswordResetServiceTest {
    @Spy private PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    @Mock private UserRepository userRepository;
    @InjectMocks private PasswordResetService service;

    private User existingUser() {
        return User.builder()
                .id(1L)
                .email("sonam@gmail.com")
                .password("$2a$10$originalhashvalue")
                .firstName("Sonam")
                .lastName("Rai")
                .role(Role.builder().id(1).name("ROLE_ADMIN").build())
                .isActive(true)
                .build();
    }

    @Test
    void replacesOnlyThePasswordOfTheTargetAccount() {
        User user = existingUser();
        when(userRepository.findByEmail("sonam@gmail.com")).thenReturn(Optional.of(user));

        service.resetPasswordForExistingAccount("sonam@gmail.com", "Admin123");

        assertTrue(passwordEncoder.matches("Admin123", user.getPassword()),
                "stored hash should verify against the new password");
        assertNotEquals("$2a$10$originalhashvalue", user.getPassword(), "hash should be replaced");
        verify(userRepository).save(user);
    }

    @Test
    void leavesRoleProfileAndActiveFlagUntouched() {
        User user = existingUser();
        when(userRepository.findByEmail("sonam@gmail.com")).thenReturn(Optional.of(user));

        service.resetPasswordForExistingAccount("sonam@gmail.com", "Admin123");

        assertEquals("ROLE_ADMIN", user.getRole().getName());
        assertEquals("Sonam", user.getFirstName());
        assertEquals("Rai", user.getLastName());
        assertTrue(user.getIsActive());
    }

    @Test
    void neverCreatesAnAccountWhenTheEmailIsUnknown() {
        when(userRepository.findByEmail("missing@example.test")).thenReturn(Optional.empty());

        assertThrows(IllegalStateException.class,
                () -> service.resetPasswordForExistingAccount("missing@example.test", "Admin123"));

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void rejectsABlankPasswordBeforeAnyLookup() {
        assertThrows(IllegalArgumentException.class,
                () -> service.resetPasswordForExistingAccount("sonam@gmail.com", "   "));

        verify(userRepository, never()).findByEmail(anyString());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void rejectsATooShortPasswordBeforeAnyLookup() {
        assertThrows(IllegalArgumentException.class,
                () -> service.resetPasswordForExistingAccount("sonam@gmail.com", "Ab1"));

        verify(userRepository, never()).findByEmail(anyString());
        verify(userRepository, never()).save(any(User.class));
    }
}
