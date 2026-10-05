package com.agriconnect.service;

import com.agriconnect.dto.AdminDashboardResponse;
import com.agriconnect.dto.CropResponse;
import com.agriconnect.dto.UserProfileResponse;
import com.agriconnect.entity.CollectedFarmer;
import com.agriconnect.entity.Crop;
import com.agriconnect.entity.Role;
import com.agriconnect.entity.User;
import com.agriconnect.repository.CropRepository;
import com.agriconnect.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminServiceTest {
    @Mock private UserRepository userRepository;
    @Mock private CropRepository cropRepository;
    @InjectMocks private AdminService adminService;

    @Test
    void dashboardCountsRolesAndAvailableListings() {
        when(userRepository.findAll()).thenReturn(List.of(
                user("FARMER"), user("ROLE_BUYER"), user("MIDDLEMAN"), user("ROLE_ADMIN")));
        when(cropRepository.findAll()).thenReturn(List.of(
                Crop.builder().available(true).build(), Crop.builder().available(false).build()));

        AdminDashboardResponse result = adminService.getDashboard();

        assertEquals(4, result.totalUsers());
        assertEquals(1, result.farmers());
        assertEquals(1, result.buyers());
        assertEquals(1, result.coordinators());
        assertEquals(1, result.administrators());
        assertEquals(2, result.totalCrops());
        assertEquals(1, result.availableCrops());
    }

    @Test
    void cropOverviewPreservesCollectedFarmerAttributionAndAvailability() {
        Crop crop = Crop.builder().id(3L).cropName("Rice").quantity(BigDecimal.TEN)
                .pricePerUnit(BigDecimal.ONE).available(false)
                .collectedFarmer(CollectedFarmer.builder().id(7L).farmerName("Suresh Kumar").build()).build();
        when(cropRepository.findAll()).thenReturn(List.of(crop));

        CropResponse response = adminService.getCrops().get(0);

        assertEquals("Suresh Kumar", response.getFarmerName());
        assertEquals(7L, response.getCollectedFarmerId());
        assertTrue(response.getIsCollectedFarmer());
        assertFalse(response.getAvailable());
    }

    @Test
    void accountOverviewDoesNotReturnPassword() {
        User user = user("FARMER");
        user.setPassword("never-return-this");
        user.setEmail("farmer@example.test");
        when(userRepository.findAll()).thenReturn(List.of(user));

        UserProfileResponse response = adminService.getUsers().get(0);

        assertEquals("farmer@example.test", response.getEmail());
        assertFalse(response.toString().contains("never-return-this"));
    }

    private User user(String role) {
        return User.builder().id(1L).role(Role.builder().name(role).build())
                .firstName("Test").lastName("User").build();
    }
}
