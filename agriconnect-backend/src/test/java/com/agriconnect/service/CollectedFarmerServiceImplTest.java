package com.agriconnect.service;

import com.agriconnect.dto.CollectedFarmerRequest;
import com.agriconnect.entity.User;
import com.agriconnect.exception.CustomException;
import com.agriconnect.repository.CollectedFarmerRepository;
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
class CollectedFarmerServiceImplTest {
    @Mock private CollectedFarmerRepository collectedFarmerRepository;
    @Mock private UserRepository userRepository;
    @InjectMocks private CollectedFarmerServiceImpl service;

    @Test
    void coordinatorListQueryIsScopedToAuthenticatedEmail() {
        when(collectedFarmerRepository.findByCollectedByEmail("coord-a@example.test")).thenReturn(List.of());

        assertTrue(service.getCollectedFarmers("coord-a@example.test", false).isEmpty());

        verify(collectedFarmerRepository).findByCollectedByEmail("coord-a@example.test");
        verify(collectedFarmerRepository, never()).findAll();
    }

    @Test
    void coordinatorCannotUpdateAnotherCoordinatorsCollectedFarmer() {
        when(collectedFarmerRepository.findByIdAndCollectedByEmail(52L, "coord-b@example.test"))
                .thenReturn(Optional.empty());

        CustomException exception = assertThrows(CustomException.class,
                () -> service.updateCollectedFarmer(52L, CollectedFarmerRequest.builder().build(),
                        "coord-b@example.test", false));

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatus());
        verify(collectedFarmerRepository, never()).save(any());
    }

    @Test
    void coordinatorCannotDeleteAnotherCoordinatorsCollectedFarmer() {
        when(collectedFarmerRepository.findByIdAndCollectedByEmail(52L, "coord-b@example.test"))
                .thenReturn(Optional.empty());

        assertThrows(CustomException.class,
                () -> service.deleteCollectedFarmer(52L, "coord-b@example.test", false));

        verify(collectedFarmerRepository, never()).delete(any());
    }

}
