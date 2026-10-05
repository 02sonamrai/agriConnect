package com.agriconnect.service;

import com.agriconnect.dto.CropResponse;
import com.agriconnect.entity.CollectedFarmer;
import com.agriconnect.entity.Crop;
import com.agriconnect.entity.User;
import com.agriconnect.exception.CustomException;
import com.agriconnect.repository.CollectedFarmerRepository;
import com.agriconnect.repository.CropRepository;
import com.agriconnect.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CropServiceImplTest {

    @Mock
    private CropRepository cropRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private CollectedFarmerRepository collectedFarmerRepository;

    @InjectMocks
    private CropServiceImpl cropService;

    @Test
    void farmerCropLookupIsScopedToAuthenticatedOwner() {
        User owner = User.builder().id(17L).email("owner@example.test").firstName("Farm").lastName("Owner").build();
        Crop crop = Crop.builder().id(9L).cropName("Wheat").farmer(owner).build();
        when(userRepository.findByEmail("owner@example.test")).thenReturn(Optional.of(owner));
        when(cropRepository.findByIdAndFarmerId(9L, 17L)).thenReturn(Optional.of(crop));

        CropResponse response = cropService.getCropById(9L, "owner@example.test");

        assertEquals(17L, response.getFarmerId());
        verify(cropRepository).findByIdAndFarmerId(9L, 17L);
        verify(cropRepository, never()).findById(9L);
    }

    @Test
    void farmerCannotReadAnotherOwnersCrop() {
        User other = User.builder().id(22L).email("other@example.test").firstName("Other").lastName("Farmer").build();
        when(userRepository.findByEmail("other@example.test")).thenReturn(Optional.of(other));
        when(cropRepository.findByIdAndFarmerId(9L, 22L)).thenReturn(Optional.empty());

        CustomException exception = assertThrows(CustomException.class,
                () -> cropService.getCropById(9L, "other@example.test"));

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatus());
        verify(cropRepository).findByIdAndFarmerId(9L, 22L);
    }

    @Test
    void marketplaceMapsCollectedFarmerAsCropOwner() {
        CollectedFarmer collected = CollectedFarmer.builder()
                .id(41L)
                .farmerName("Suresh Kumar")
                .build();
        Crop crop = Crop.builder()
                .id(9L)
                .cropName("Rice")
                .available(true)
                .collectedFarmer(collected)
                .build();
        when(cropRepository.findByAvailableTrue()).thenReturn(List.of(crop));

        List<CropResponse> response = cropService.getAvailableCrops();

        assertEquals(1, response.size());
        assertEquals("Suresh Kumar", response.get(0).getFarmerName());
        assertTrue(response.get(0).getIsCollectedFarmer());
        assertNull(response.get(0).getFarmerId());
        assertEquals(41L, response.get(0).getCollectedFarmerId());
        verify(cropRepository).findByAvailableTrue();
    }

    @Test
    void coordinatorCannotReadCropsForAnotherCoordinatorsCollectedFarmer() {
        when(collectedFarmerRepository.findByIdAndCollectedByEmail(52L, "coord-b@example.test"))
                .thenReturn(Optional.empty());

        assertThrows(CustomException.class,
                () -> cropService.getCropsForCollectedFarmer(52L, "coord-b@example.test", false));

        verify(cropRepository, never()).findByCollectedFarmerId(anyLong());
    }

    @Test
    void unavailableCropCannotBeOpenedFromMarketplace() {
        when(cropRepository.findByIdAndAvailableTrue(88L)).thenReturn(Optional.empty());

        CustomException exception = assertThrows(CustomException.class,
                () -> cropService.getAvailableCropById(88L));

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatus());
        verify(cropRepository).findByIdAndAvailableTrue(88L);
    }
}
