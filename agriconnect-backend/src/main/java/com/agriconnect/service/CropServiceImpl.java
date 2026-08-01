package com.agriconnect.service;

import com.agriconnect.dto.CropRequest;
import com.agriconnect.dto.CropResponse;
import com.agriconnect.entity.Crop;
import com.agriconnect.entity.User;
import com.agriconnect.exception.CustomException;
import com.agriconnect.repository.CropRepository;
import com.agriconnect.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class CropServiceImpl implements CropService {

    private final CropRepository cropRepository;
    private final UserRepository userRepository;

    public CropServiceImpl(CropRepository cropRepository, UserRepository userRepository) {
        this.cropRepository = cropRepository;
        this.userRepository = userRepository;
    }

    private User getFarmer(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new CustomException("Farmer user not found", HttpStatus.NOT_FOUND));
    }

    private CropResponse mapToResponse(Crop crop) {
        return CropResponse.builder()
                .id(crop.getId())
                .cropName(crop.getCropName())
                .category(crop.getCategory())
                .description(crop.getDescription())
                .quantity(crop.getQuantity())
                .unit(crop.getUnit())
                .pricePerUnit(crop.getPricePerUnit())
                .location(crop.getLocation())
                .imageUrl(crop.getImageUrl())
                .available(crop.getAvailable())
                .createdAt(crop.getCreatedAt())
                .updatedAt(crop.getUpdatedAt())
                .farmerId(crop.getFarmer().getId())
                .farmerName(crop.getFarmer().getFirstName() + " " + crop.getFarmer().getLastName())
                .build();
    }

    @Override
    @Transactional
    public CropResponse createCrop(CropRequest request, String farmerEmail) {
        User farmer = getFarmer(farmerEmail);

        Crop crop = Crop.builder()
                .cropName(request.getCropName())
                .category(request.getCategory())
                .description(request.getDescription())
                .quantity(request.getQuantity())
                .unit(request.getUnit())
                .pricePerUnit(request.getPricePerUnit())
                .location(request.getLocation())
                .imageUrl(request.getImageUrl())
                .available(request.getAvailable() != null ? request.getAvailable() : true)
                .farmer(farmer)
                .build();

        Crop savedCrop = cropRepository.save(crop);
        return mapToResponse(savedCrop);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CropResponse> getFarmerCrops(String farmerEmail) {
        User farmer = getFarmer(farmerEmail);
        List<Crop> crops = cropRepository.findByFarmerId(farmer.getId());
        return crops.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public CropResponse getCropById(Long id, String farmerEmail) {
        User farmer = getFarmer(farmerEmail);
        Crop crop = cropRepository.findByIdAndFarmerId(id, farmer.getId())
                .orElseThrow(() -> new CustomException("Crop not found or unauthorized", HttpStatus.NOT_FOUND));
        return mapToResponse(crop);
    }

    @Override
    @Transactional
    public CropResponse updateCrop(Long id, CropRequest request, String farmerEmail) {
        User farmer = getFarmer(farmerEmail);
        Crop crop = cropRepository.findByIdAndFarmerId(id, farmer.getId())
                .orElseThrow(() -> new CustomException("Crop not found or unauthorized", HttpStatus.NOT_FOUND));

        crop.setCropName(request.getCropName());
        crop.setCategory(request.getCategory());
        crop.setDescription(request.getDescription());
        crop.setQuantity(request.getQuantity());
        crop.setUnit(request.getUnit());
        crop.setPricePerUnit(request.getPricePerUnit());
        crop.setLocation(request.getLocation());
        crop.setImageUrl(request.getImageUrl());
        crop.setAvailable(request.getAvailable() != null ? request.getAvailable() : true);

        Crop updatedCrop = cropRepository.save(crop);
        return mapToResponse(updatedCrop);
    }

    @Override
    @Transactional
    public void deleteCrop(Long id, String farmerEmail) {
        User farmer = getFarmer(farmerEmail);
        Crop crop = cropRepository.findByIdAndFarmerId(id, farmer.getId())
                .orElseThrow(() -> new CustomException("Crop not found or unauthorized", HttpStatus.NOT_FOUND));

        cropRepository.delete(crop);
    }
}
