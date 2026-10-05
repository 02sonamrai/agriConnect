package com.agriconnect.service;

import com.agriconnect.dto.FarmerContactResponse;
import com.agriconnect.entity.CollectedFarmer;
import com.agriconnect.entity.Crop;
import com.agriconnect.entity.User;
import com.agriconnect.exception.CustomException;
import com.agriconnect.repository.CropRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ContactServiceImplTest {

    @Mock
    private CropRepository cropRepository;

    @InjectMocks
    private ContactServiceImpl contactService;

    @Test
    void registeredFarmerContactIsReturned() {
        Crop crop = Crop.builder()
                .id(9L).cropName("Wheat").available(true)
                .quantity(new BigDecimal("50")).unit("Kg")
                .location("Buxar, Bihar")
                .farmer(User.builder().id(3L).firstName("Suresh").lastName("Kumar")
                        .phoneNumber("9000000000").build())
                .build();
        when(cropRepository.findByIdAndAvailableTrue(9L)).thenReturn(Optional.of(crop));

        FarmerContactResponse response = contactService.getContactForCrop(9L);

        assertEquals("Suresh Kumar", response.getContactName());
        assertEquals("Farmer", response.getContactType());
        assertEquals("9000000000", response.getPhone());
        assertEquals("Buxar, Bihar", response.getLocation());
        assertFalse(response.getCollectedFarmerListing());
    }

    @Test
    void coordinatorListedCropResolvesToTheCollectedFarmer() {
        Crop crop = Crop.builder()
                .id(11L).cropName("Turmeric").available(true)
                .quantity(new BigDecimal("120")).unit("Kg")
                .collectedFarmer(CollectedFarmer.builder()
                        .id(5L)
                        .farmerName("Gurdev Test Farmer")
                        .phoneNumber("9000003333")
                        .village("Anandpur")
                        .district("Anand")
                        .state("Gujarat")
                        .build())
                .build();
        when(cropRepository.findByIdAndAvailableTrue(11L)).thenReturn(Optional.of(crop));

        FarmerContactResponse response = contactService.getContactForCrop(11L);

        assertEquals("Gurdev Test Farmer", response.getContactName());
        assertEquals("Collected Farmer", response.getContactType());
        assertEquals("9000003333", response.getPhone());
        assertEquals("Anandpur, Anand, Gujarat", response.getLocation());
        assertTrue(response.getCollectedFarmerListing());
    }

    @Test
    void inactiveListingExposesNoContact() {
        when(cropRepository.findByIdAndAvailableTrue(12L)).thenReturn(Optional.empty());

        CustomException ex = assertThrows(CustomException.class,
                () -> contactService.getContactForCrop(12L));

        assertEquals(HttpStatus.NOT_FOUND, ex.getStatus());
    }

    @Test
    void responseCarriesNoCredentialsOrSensitiveFields() {
        Crop crop = Crop.builder()
                .id(9L).cropName("Wheat").available(true)
                .quantity(new BigDecimal("50")).unit("Kg")
                .location("Buxar, Bihar")
                .farmer(User.builder().id(3L).firstName("Suresh").lastName("Kumar")
                        .email("suresh@example.test")
                        .password("bcrypt-hash-should-never-leak")
                        .phoneNumber("9000000000").build())
                .build();
        when(cropRepository.findByIdAndAvailableTrue(9L)).thenReturn(Optional.of(crop));

        String serialised = contactService.getContactForCrop(9L).toString();

        assertFalse(serialised.contains("bcrypt-hash-should-never-leak"));
        assertFalse(serialised.contains("password"));
        assertFalse(serialised.contains("suresh@example.test"));
    }
}
