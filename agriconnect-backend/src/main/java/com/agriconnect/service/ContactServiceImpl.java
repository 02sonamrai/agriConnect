package com.agriconnect.service;

import com.agriconnect.dto.FarmerContactResponse;
import com.agriconnect.entity.CollectedFarmer;
import com.agriconnect.entity.Crop;
import com.agriconnect.entity.User;
import com.agriconnect.exception.CustomException;
import com.agriconnect.repository.CropRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.stream.Collectors;

@Service
public class ContactServiceImpl implements ContactService {

    private final CropRepository cropRepository;

    public ContactServiceImpl(CropRepository cropRepository) {
        this.cropRepository = cropRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public FarmerContactResponse getContactForCrop(Long cropId) {
        // Same lookup the marketplace details page uses, so inactive listings stay hidden.
        Crop crop = cropRepository.findByIdAndAvailableTrue(cropId)
                .orElseThrow(() -> new CustomException(
                        "Listing not found or no longer available", HttpStatus.NOT_FOUND));

        String contactName = "Unknown";
        String contactType = null;
        Boolean collectedListing = false;
        String phone = null;
        String location = crop.getLocation();

        User farmer = crop.getFarmer();
        CollectedFarmer collectedFarmer = crop.getCollectedFarmer();

        if (farmer != null) {
            contactName = farmer.getFirstName() + " " + farmer.getLastName();
            contactType = "Farmer";
            phone = farmer.getPhoneNumber();
        } else if (collectedFarmer != null) {
            contactName = collectedFarmer.getFarmerName();
            contactType = "Collected Farmer";
            collectedListing = true;
            phone = collectedFarmer.getPhoneNumber();
            location = joinLocation(collectedFarmer);
        }

        return FarmerContactResponse.builder()
                .cropId(crop.getId())
                .cropName(crop.getCropName())
                .contactName(contactName)
                .contactType(contactType)
                .collectedFarmerListing(collectedListing)
                .phone(phone)
                .location(location)
                .stockQuantity(crop.getQuantity())
                .unit(crop.getUnit())
                .available(Boolean.TRUE.equals(crop.getAvailable()))
                .build();
    }

    private String joinLocation(CollectedFarmer collectedFarmer) {
        String location = java.util.stream.Stream.of(
                        collectedFarmer.getVillage(),
                        collectedFarmer.getDistrict(),
                        collectedFarmer.getState())
                .filter(part -> part != null && !part.isBlank())
                .map(String::trim)
                .collect(Collectors.joining(", "));
        return location.isEmpty() ? null : location;
    }
}
