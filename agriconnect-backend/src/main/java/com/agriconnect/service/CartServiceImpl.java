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
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

@Service
public class CartServiceImpl implements CartService {

    private static final int MONEY_SCALE = 2;

    private final CartItemRepository cartItemRepository;
    private final CropRepository cropRepository;
    private final UserRepository userRepository;

    public CartServiceImpl(CartItemRepository cartItemRepository,
                           CropRepository cropRepository,
                           UserRepository userRepository) {
        this.cartItemRepository = cartItemRepository;
        this.cropRepository = cropRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public CartResponse getCart(String buyerEmail) {
        User buyer = resolveBuyer(buyerEmail);
        return buildCart(cartItemRepository.findByBuyerIdOrderByIdAsc(buyer.getId()));
    }

    @Override
    @Transactional
    public CartResponse addItem(Long cropId, BigDecimal quantity, String buyerEmail) {
        User buyer = resolveBuyer(buyerEmail);

        Crop crop = cropRepository.findById(cropId)
                .orElseThrow(() -> new CustomException("Crop not found", HttpStatus.NOT_FOUND));

        if (!Boolean.TRUE.equals(crop.getAvailable())) {
            throw new CustomException("This crop is no longer available and cannot be added to the cart",
                    HttpStatus.BAD_REQUEST);
        }
        validateQuantity(quantity, crop);

        CartItem item = cartItemRepository.findByBuyerIdAndCropId(buyer.getId(), cropId)
                .orElseGet(() -> CartItem.builder()
                        .buyer(buyer)
                        .crop(crop)
                        .unitPrice(crop.getPricePerUnit())
                        .quantity(BigDecimal.ZERO)
                        .build());

        BigDecimal merged = item.getQuantity().add(quantity);
        validateQuantity(merged, crop);

        item.setQuantity(scale(merged));
        item.setCrop(crop);
        item.setBuyer(buyer);
        // Keep the price the buyer actually sees consistent with the listing they picked.
        item.setUnitPrice(crop.getPricePerUnit());

        cartItemRepository.save(item);
        return buildCart(cartItemRepository.findByBuyerIdOrderByIdAsc(buyer.getId()));
    }

    @Override
    @Transactional
    public CartResponse updateItem(Long itemId, BigDecimal quantity, String buyerEmail) {
        User buyer = resolveBuyer(buyerEmail);

        CartItem item = cartItemRepository.findByIdAndBuyerId(itemId, buyer.getId())
                .orElseThrow(() -> new CustomException("Cart item not found", HttpStatus.NOT_FOUND));

        Crop crop = item.getCrop();
        if (crop == null) {
            throw new CustomException("This listing is no longer available. Please remove it from your cart.",
                    HttpStatus.BAD_REQUEST);
        }
        if (!Boolean.TRUE.equals(crop.getAvailable())) {
            throw new CustomException("This listing is no longer available. Please remove it from your cart.",
                    HttpStatus.BAD_REQUEST);
        }
        validateQuantity(quantity, crop);

        item.setQuantity(scale(quantity));
        cartItemRepository.save(item);

        return buildCart(cartItemRepository.findByBuyerIdOrderByIdAsc(buyer.getId()));
    }

    @Override
    @Transactional
    public void removeItem(Long itemId, String buyerEmail) {
        User buyer = resolveBuyer(buyerEmail);

        CartItem item = cartItemRepository.findByIdAndBuyerId(itemId, buyer.getId())
                .orElseThrow(() -> new CustomException("Cart item not found", HttpStatus.NOT_FOUND));

        cartItemRepository.delete(item);
    }

    @Override
    @Transactional
    public void clearCart(String buyerEmail) {
        User buyer = resolveBuyer(buyerEmail);
        cartItemRepository.deleteAll(cartItemRepository.findByBuyerIdOrderByIdAsc(buyer.getId()));
    }

    private User resolveBuyer(String buyerEmail) {
        return userRepository.findByEmail(buyerEmail)
                .orElseThrow(() -> new CustomException("Buyer account not found", HttpStatus.UNAUTHORIZED));
    }

    private void validateQuantity(BigDecimal quantity, Crop crop) {
        if (quantity == null || quantity.compareTo(BigDecimal.ZERO) <= 0) {
            throw new CustomException("Quantity must be greater than 0", HttpStatus.BAD_REQUEST);
        }
        if (crop.getQuantity() == null || quantity.compareTo(crop.getQuantity()) > 0) {
            throw new CustomException("Only " + crop.getQuantity() + " " + crop.getUnit()
                    + " of " + crop.getCropName() + " is available", HttpStatus.BAD_REQUEST);
        }
    }

    private CartResponse buildCart(List<CartItem> items) {
        List<CartItemResponse> responses = new ArrayList<>();
        BigDecimal total = BigDecimal.ZERO;
        long orderable = 0;

        for (CartItem item : items) {
            CartItemResponse response = toResponse(item);
            responses.add(response);
            if (Boolean.TRUE.equals(response.getAvailable())) {
                total = total.add(response.getLineTotal());
                orderable++;
            }
        }

        return CartResponse.builder()
                .items(responses)
                .itemCount(responses.size())
                .totalAmount(scale(total))
                .orderableItemCount(orderable)
                .build();
    }

    private CartItemResponse toResponse(CartItem item) {
        Crop crop = item.getCrop();

        BigDecimal quantity = item.getQuantity();
        BigDecimal unitPrice = item.getUnitPrice();
        BigDecimal lineTotal = quantity.multiply(unitPrice).setScale(MONEY_SCALE, RoundingMode.HALF_UP);

        if (crop == null) {
            return CartItemResponse.builder()
                    .id(item.getId())
                    .cropName("Removed listing")
                    .quantity(quantity)
                    .pricePerUnit(unitPrice)
                    .unit(null)
                    .lineTotal(lineTotal)
                    .available(false)
                    .unavailableReason("This listing has been removed by the seller.")
                    .build();
        }

        String farmerName = "Unknown";
        Long collectedFarmerId = null;
        boolean collected = false;
        if (crop.getFarmer() != null) {
            farmerName = crop.getFarmer().getFirstName() + " " + crop.getFarmer().getLastName();
        } else if (crop.getCollectedFarmer() != null) {
            collectedFarmerId = crop.getCollectedFarmer().getId();
            farmerName = crop.getCollectedFarmer().getFarmerName();
            collected = true;
        }

        boolean available = Boolean.TRUE.equals(crop.getAvailable());
        String reason = null;
        if (!available) {
            reason = "This listing is no longer available.";
        } else if (crop.getQuantity() == null || quantity.compareTo(crop.getQuantity()) > 0) {
            available = false;
            reason = "Only " + crop.getQuantity() + " " + crop.getUnit() + " left - please reduce the quantity.";
        }

        return CartItemResponse.builder()
                .id(item.getId())
                .cropId(crop.getId())
                .cropName(crop.getCropName())
                .category(crop.getCategory())
                .imageUrl(crop.getImageUrl())
                .unit(crop.getUnit())
                .location(crop.getLocation())
                .farmerName(farmerName)
                .isCollectedFarmer(collected)
                .collectedFarmerId(collectedFarmerId)
                .pricePerUnit(unitPrice)
                .quantity(quantity)
                .lineTotal(lineTotal)
                .stockQuantity(crop.getQuantity())
                .available(available)
                .unavailableReason(reason)
                .build();
    }

    private BigDecimal scale(BigDecimal value) {
        return value.setScale(MONEY_SCALE, RoundingMode.HALF_UP);
    }
}
