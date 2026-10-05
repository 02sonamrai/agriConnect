package com.agriconnect.service;

import com.agriconnect.dto.CartItemResponse;
import com.agriconnect.dto.CartResponse;
import com.agriconnect.entity.CartItem;
import com.agriconnect.entity.Crop;
import com.agriconnect.entity.User;
import com.agriconnect.exception.CustomException;
import com.agriconnect.repository.CartItemRepository;
import com.agriconnect.repository.CropRepository;
import com.agriconnect.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CartServiceImplTest {

    @Mock
    private CartItemRepository cartItemRepository;
    @Mock
    private CropRepository cropRepository;
    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private CartServiceImpl cartService;

    private User buyer() {
        return User.builder().id(7L).email("buyer@example.test").firstName("Test").lastName("Buyer").build();
    }

    private Crop availableCrop() {
        return Crop.builder()
                .id(9L)
                .cropName("Wheat")
                .quantity(new BigDecimal("50"))
                .unit("Kg")
                .pricePerUnit(new BigDecimal("20"))
                .available(true)
                .build();
    }

    @Test
    void unavailableCropCannotBeAdded() {
        when(userRepository.findByEmail("buyer@example.test")).thenReturn(Optional.of(buyer()));
        Crop crop = availableCrop();
        crop.setAvailable(false);
        when(cropRepository.findById(9L)).thenReturn(Optional.of(crop));

        CustomException ex = assertThrows(CustomException.class,
                () -> cartService.addItem(9L, BigDecimal.ONE, "buyer@example.test"));

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertTrue(ex.getMessage().contains("no longer available"));
        verify(cartItemRepository, never()).save(any());
    }

    @Test
    void quantityAboveListedStockIsRejected() {
        when(userRepository.findByEmail("buyer@example.test")).thenReturn(Optional.of(buyer()));
        when(cropRepository.findById(9L)).thenReturn(Optional.of(availableCrop()));

        CustomException ex = assertThrows(CustomException.class,
                () -> cartService.addItem(9L, new BigDecimal("500"), "buyer@example.test"));

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertTrue(ex.getMessage().contains("Only 50 Kg"));
        verify(cartItemRepository, never()).save(any());
    }

    @Test
    void zeroOrNegativeQuantityIsRejected() {
        when(userRepository.findByEmail("buyer@example.test")).thenReturn(Optional.of(buyer()));
        when(cropRepository.findById(9L)).thenReturn(Optional.of(availableCrop()));

        assertThrows(CustomException.class,
                () -> cartService.addItem(9L, BigDecimal.ZERO, "buyer@example.test"));
        assertThrows(CustomException.class,
                () -> cartService.addItem(9L, new BigDecimal("-2"), "buyer@example.test"));
    }

    @Test
    void addingSameCropTwiceMergesIntoOneCartLine() {
        User buyer = buyer();
        when(userRepository.findByEmail("buyer@example.test")).thenReturn(Optional.of(buyer));
        Crop crop = availableCrop();
        when(cropRepository.findById(9L)).thenReturn(Optional.of(crop));
        when(cartItemRepository.findByBuyerIdAndCropId(7L, 9L)).thenReturn(Optional.of(CartItem.builder()
                .id(3L)
                .buyer(buyer)
                .crop(crop)
                .quantity(new BigDecimal("5"))
                .unitPrice(new BigDecimal("20"))
                .build()));
        when(cartItemRepository.save(any(CartItem.class))).thenAnswer(i -> i.getArgument(0));
        when(cartItemRepository.findByBuyerIdOrderByIdAsc(7L)).thenReturn(List.of(CartItem.builder()
                .id(3L)
                .buyer(buyer)
                .crop(crop)
                .quantity(new BigDecimal("8"))
                .unitPrice(new BigDecimal("20"))
                .build()));

        CartResponse response = cartService.addItem(9L, new BigDecimal("3"), "buyer@example.test");

        assertEquals(1, response.getItemCount());
        assertEquals(new BigDecimal("8"), response.getItems().get(0).getQuantity());
        assertEquals(1, response.getOrderableItemCount());
        assertEquals(0, new BigDecimal("160").compareTo(response.getTotalAmount()));
    }

    @Test
    void mergedQuantityAboveStockIsRejected() {
        User buyer = buyer();
        when(userRepository.findByEmail("buyer@example.test")).thenReturn(Optional.of(buyer));
        Crop crop = availableCrop();
        when(cropRepository.findById(9L)).thenReturn(Optional.of(crop));
        when(cartItemRepository.findByBuyerIdAndCropId(7L, 9L)).thenReturn(Optional.of(CartItem.builder()
                .id(3L).buyer(buyer).crop(crop)
                .quantity(new BigDecimal("45")).unitPrice(new BigDecimal("20")).build()));

        assertThrows(CustomException.class,
                () -> cartService.addItem(9L, new BigDecimal("10"), "buyer@example.test"));

        verify(cartItemRepository, never()).save(any());
    }

    @Test
    void buyerCannotUpdateAnotherBuyersCartItem() {
        when(userRepository.findByEmail("buyer@example.test")).thenReturn(Optional.of(buyer()));
        when(cartItemRepository.findByIdAndBuyerId(42L, 7L)).thenReturn(Optional.empty());

        CustomException ex = assertThrows(CustomException.class,
                () -> cartService.updateItem(42L, BigDecimal.ONE, "buyer@example.test"));

        assertEquals(HttpStatus.NOT_FOUND, ex.getStatus());
        verify(cartItemRepository, never()).save(any());
    }

    @Test
    void buyerCannotRemoveAnotherBuyersCartItem() {
        when(userRepository.findByEmail("buyer@example.test")).thenReturn(Optional.of(buyer()));
        when(cartItemRepository.findByIdAndBuyerId(42L, 7L)).thenReturn(Optional.empty());

        CustomException ex = assertThrows(CustomException.class,
                () -> cartService.removeItem(42L, "buyer@example.test"));

        assertEquals(HttpStatus.NOT_FOUND, ex.getStatus());
        verify(cartItemRepository, never()).delete(any());
    }

    @Test
    void cartReportsCropDeletedAfterItWasAddedAsUnavailable() {
        User buyer = buyer();
        when(userRepository.findByEmail("buyer@example.test")).thenReturn(Optional.of(buyer));
        when(cartItemRepository.findByBuyerIdOrderByIdAsc(7L)).thenReturn(List.of(CartItem.builder()
                .id(3L)
                .buyer(buyer)
                .crop(null) // crop row was deleted, cart line survives
                .quantity(new BigDecimal("4"))
                .unitPrice(new BigDecimal("20"))
                .build()));

        CartResponse response = cartService.getCart("buyer@example.test");

        assertEquals(1, response.getItemCount());
        assertEquals(0, response.getOrderableItemCount());
        assertEquals(0, BigDecimal.ZERO.compareTo(response.getTotalAmount()));

        CartItemResponse item = response.getItems().get(0);
        assertFalse(item.getAvailable());
        assertEquals("Removed listing", item.getCropName());
        assertNotNull(item.getUnavailableReason());
    }

    @Test
    void cartFlagsQuantityThatNoLongerFitsRemainingStock() {
        User buyer = buyer();
        Crop crop = availableCrop();
        crop.setQuantity(new BigDecimal("2"));
        when(userRepository.findByEmail("buyer@example.test")).thenReturn(Optional.of(buyer));
        when(cartItemRepository.findByBuyerIdOrderByIdAsc(7L)).thenReturn(List.of(CartItem.builder()
                .id(3L).buyer(buyer).crop(crop)
                .quantity(new BigDecimal("10")).unitPrice(new BigDecimal("20")).build()));

        CartResponse response = cartService.getCart("buyer@example.test");

        assertFalse(response.getItems().get(0).getAvailable());
        assertTrue(response.getItems().get(0).getUnavailableReason().contains("Only 2 Kg left"));
        assertEquals(0, response.getOrderableItemCount());
    }

    @Test
    void cartKeepsCollectedFarmerAttribution() {
        User buyer = buyer();
        Crop crop = Crop.builder()
                .id(9L)
                .cropName("Turmeric")
                .quantity(new BigDecimal("100"))
                .unit("Kg")
                .pricePerUnit(new BigDecimal("310"))
                .available(true)
                .collectedFarmer(com.agriconnect.entity.CollectedFarmer.builder()
                        .id(5L).farmerName("Gurdev Test Farmer").build())
                .build();
        when(userRepository.findByEmail("buyer@example.test")).thenReturn(Optional.of(buyer));
        when(cartItemRepository.findByBuyerIdOrderByIdAsc(7L)).thenReturn(List.of(CartItem.builder()
                .id(3L).buyer(buyer).crop(crop)
                .quantity(new BigDecimal("2")).unitPrice(new BigDecimal("310")).build()));

        CartItemResponse item = cartService.getCart("buyer@example.test").getItems().get(0);

        assertEquals("Gurdev Test Farmer", item.getFarmerName());
        assertTrue(item.getIsCollectedFarmer());
        assertEquals(5L, item.getCollectedFarmerId());
    }
}
