package com.agriconnect.service;

import com.agriconnect.dto.AdminDashboardResponse;
import com.agriconnect.dto.CropResponse;
import com.agriconnect.dto.UserProfileResponse;
import com.agriconnect.entity.Crop;
import com.agriconnect.entity.User;
import com.agriconnect.repository.CropRepository;
import com.agriconnect.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;

@Service
public class AdminService {
    private final UserRepository userRepository;
    private final CropRepository cropRepository;

    public AdminService(UserRepository userRepository, CropRepository cropRepository) {
        this.userRepository = userRepository;
        this.cropRepository = cropRepository;
    }

    @Transactional(readOnly = true)
    public AdminDashboardResponse getDashboard() {
        List<User> users = userRepository.findAll();
        List<Crop> crops = cropRepository.findAll();
        long farmers = countRole(users, "FARMER");
        long buyers = countRole(users, "BUYER");
        long coordinators = countRole(users, "MIDDLEMAN");
        long administrators = countRole(users, "ADMIN");
        return new AdminDashboardResponse(users.size(), farmers, buyers, coordinators,
                administrators, crops.size(), crops.stream().filter(c -> Boolean.TRUE.equals(c.getAvailable())).count());
    }

    @Transactional(readOnly = true)
    public List<UserProfileResponse> getUsers() {
        return userRepository.findAll().stream().map(user -> UserProfileResponse.builder()
                .id(user.getId()).email(user.getEmail()).firstName(user.getFirstName())
                .lastName(user.getLastName()).phoneNumber(user.getPhoneNumber())
                .role(user.getRole() == null ? null : user.getRole().getName())
                .isActive(user.getIsActive()).createdAt(user.getCreatedAt()).updatedAt(user.getUpdatedAt())
                .build()).toList();
    }

    @Transactional(readOnly = true)
    public List<CropResponse> getCrops() {
        return cropRepository.findAll().stream().map(this::mapCrop).toList();
    }

    private long countRole(List<User> users, String expected) {
        return users.stream().filter(user -> user.getRole() != null)
                .filter(user -> expected.equals(normalizeRole(user.getRole().getName()))).count();
    }

    private String normalizeRole(String role) {
        return role == null ? "" : role.toUpperCase(Locale.ROOT).replaceFirst("^ROLE_", "");
    }

    private CropResponse mapCrop(Crop crop) {
        boolean collected = crop.getCollectedFarmer() != null;
        String ownerName = collected
                ? crop.getCollectedFarmer().getFarmerName()
                : crop.getFarmer() == null ? "Unknown" : crop.getFarmer().getFirstName() + " " + crop.getFarmer().getLastName();
        return CropResponse.builder().id(crop.getId()).cropName(crop.getCropName())
                .category(crop.getCategory()).description(crop.getDescription()).quantity(crop.getQuantity())
                .unit(crop.getUnit()).pricePerUnit(crop.getPricePerUnit()).location(crop.getLocation())
                .imageUrl(crop.getImageUrl()).available(crop.getAvailable()).createdAt(crop.getCreatedAt())
                .updatedAt(crop.getUpdatedAt()).farmerId(crop.getFarmer() == null ? null : crop.getFarmer().getId())
                .farmerName(ownerName).collectedFarmerId(collected ? crop.getCollectedFarmer().getId() : null)
                .isCollectedFarmer(collected).build();
    }
}
