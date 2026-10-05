package com.agriconnect.service;

import com.agriconnect.dto.CollectedFarmerRequest;
import com.agriconnect.dto.CollectedFarmerResponse;
import com.agriconnect.dto.MiddlemanStatsResponse;
import com.agriconnect.entity.CollectedFarmer;
import com.agriconnect.entity.User;
import com.agriconnect.exception.CustomException;
import com.agriconnect.repository.CollectedFarmerRepository;
import com.agriconnect.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class CollectedFarmerServiceImpl implements CollectedFarmerService {

    private final CollectedFarmerRepository collectedFarmerRepository;
    private final UserRepository userRepository;

    public CollectedFarmerServiceImpl(CollectedFarmerRepository collectedFarmerRepository,
                                       UserRepository userRepository) {
        this.collectedFarmerRepository = collectedFarmerRepository;
        this.userRepository = userRepository;
    }

    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new CustomException("Authenticated user record not found", HttpStatus.NOT_FOUND));
    }

    private CollectedFarmerResponse mapToResponse(CollectedFarmer farmer) {
        return CollectedFarmerResponse.builder()
                .id(farmer.getId())
                .farmerName(farmer.getFarmerName())
                .phoneNumber(farmer.getPhoneNumber())
                .village(farmer.getVillage())
                .district(farmer.getDistrict())
                .state(farmer.getState())
                .farmingType(farmer.getFarmingType())
                .primaryCrop(farmer.getPrimaryCrop())
                .landArea(farmer.getLandArea())
                .landAreaUnit(farmer.getLandAreaUnit())
                .approximateProduction(farmer.getApproximateProduction())
                .productionUnit(farmer.getProductionUnit())
                .preferredMarket(farmer.getPreferredMarket())
                .notes(farmer.getNotes())
                .collectedById(farmer.getCollectedBy() != null ? farmer.getCollectedBy().getId() : null)
                .collectedByName(farmer.getCollectedBy() != null ?
                        farmer.getCollectedBy().getFirstName() + " " + farmer.getCollectedBy().getLastName() : "Unknown")
                .collectedByEmail(farmer.getCollectedBy() != null ? farmer.getCollectedBy().getEmail() : null)
                .linkedFarmerId(farmer.getLinkedFarmer() != null ? farmer.getLinkedFarmer().getId() : null)
                .linkedFarmerName(farmer.getLinkedFarmer() != null ?
                        farmer.getLinkedFarmer().getFirstName() + " " + farmer.getLinkedFarmer().getLastName() : null)
                .linkedFarmerEmail(farmer.getLinkedFarmer() != null ? farmer.getLinkedFarmer().getEmail() : null)
                .linkedFarmerPhone(farmer.getLinkedFarmer() != null ? farmer.getLinkedFarmer().getPhoneNumber() : null)
                .createdAt(farmer.getCreatedAt())
                .updatedAt(farmer.getUpdatedAt())
                .build();
    }

    @Override
    @Transactional
    public CollectedFarmerResponse createCollectedFarmer(CollectedFarmerRequest request, String middlemanEmail) {
        User middleman = getUser(middlemanEmail);

        CollectedFarmer farmer = CollectedFarmer.builder()
                .farmerName(request.getFarmerName())
                .phoneNumber(request.getPhoneNumber())
                .village(request.getVillage())
                .district(request.getDistrict())
                .state(request.getState())
                .farmingType(request.getFarmingType())
                .primaryCrop(request.getPrimaryCrop())
                .landArea(request.getLandArea())
                .landAreaUnit(request.getLandAreaUnit())
                .approximateProduction(request.getApproximateProduction())
                .productionUnit(request.getProductionUnit())
                .preferredMarket(request.getPreferredMarket())
                .notes(request.getNotes())
                .collectedBy(middleman)
                .build();

        CollectedFarmer savedFarmer = collectedFarmerRepository.save(farmer);
        return mapToResponse(savedFarmer);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CollectedFarmerResponse> getCollectedFarmers(String userEmail, boolean isAdmin) {
        List<CollectedFarmer> list;
        if (isAdmin) {
            list = collectedFarmerRepository.findAll();
        } else {
            list = collectedFarmerRepository.findByCollectedByEmail(userEmail);
        }
        return list.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public CollectedFarmerResponse getCollectedFarmerById(Long id, String userEmail, boolean isAdmin) {
        CollectedFarmer farmer;
        if (isAdmin) {
            farmer = collectedFarmerRepository.findById(id)
                    .orElseThrow(() -> new CustomException("Farmer record not found", HttpStatus.NOT_FOUND));
        } else {
            farmer = collectedFarmerRepository.findByIdAndCollectedByEmail(id, userEmail)
                    .orElseThrow(() -> new CustomException("Farmer record not found or access denied", HttpStatus.NOT_FOUND));
        }
        return mapToResponse(farmer);
    }

    @Override
    @Transactional
    public CollectedFarmerResponse updateCollectedFarmer(Long id, CollectedFarmerRequest request, String userEmail, boolean isAdmin) {
        CollectedFarmer farmer;
        if (isAdmin) {
            farmer = collectedFarmerRepository.findById(id)
                    .orElseThrow(() -> new CustomException("Farmer record not found", HttpStatus.NOT_FOUND));
        } else {
            farmer = collectedFarmerRepository.findByIdAndCollectedByEmail(id, userEmail)
                    .orElseThrow(() -> new CustomException("Farmer record not found or access denied", HttpStatus.NOT_FOUND));
        }

        farmer.setFarmerName(request.getFarmerName());
        farmer.setPhoneNumber(request.getPhoneNumber());
        farmer.setVillage(request.getVillage());
        farmer.setDistrict(request.getDistrict());
        farmer.setState(request.getState());
        farmer.setFarmingType(request.getFarmingType());
        farmer.setPrimaryCrop(request.getPrimaryCrop());
        farmer.setLandArea(request.getLandArea());
        farmer.setLandAreaUnit(request.getLandAreaUnit());
        farmer.setApproximateProduction(request.getApproximateProduction());
        farmer.setProductionUnit(request.getProductionUnit());
        farmer.setPreferredMarket(request.getPreferredMarket());
        farmer.setNotes(request.getNotes());

        CollectedFarmer updated = collectedFarmerRepository.save(farmer);
        return mapToResponse(updated);
    }

    @Override
    @Transactional
    public void deleteCollectedFarmer(Long id, String userEmail, boolean isAdmin) {
        CollectedFarmer farmer;
        if (isAdmin) {
            farmer = collectedFarmerRepository.findById(id)
                    .orElseThrow(() -> new CustomException("Farmer record not found", HttpStatus.NOT_FOUND));
        } else {
            farmer = collectedFarmerRepository.findByIdAndCollectedByEmail(id, userEmail)
                    .orElseThrow(() -> new CustomException("Farmer record not found or access denied", HttpStatus.NOT_FOUND));
        }
        collectedFarmerRepository.delete(farmer);
    }

    @Override
    @Transactional(readOnly = true)
    public MiddlemanStatsResponse getMiddlemanStats(String userEmail, boolean isAdmin) {
        LocalDateTime startOfDay = LocalDateTime.of(LocalDate.now(), LocalTime.MIN);

        long totalCollected;
        long addedToday;
        long villagesCovered;
        long mainCrops;

        if (isAdmin) {
            totalCollected = collectedFarmerRepository.count();
            addedToday = collectedFarmerRepository.countAllAddedToday(startOfDay);
            villagesCovered = collectedFarmerRepository.countDistinctVillagesAll();
            mainCrops = collectedFarmerRepository.countDistinctCropsAll();
        } else {
            totalCollected = collectedFarmerRepository.countByCollectedByEmail(userEmail);
            addedToday = collectedFarmerRepository.countByCollectedByEmailAndCreatedAtGreaterThanEqual(userEmail, startOfDay);
            villagesCovered = collectedFarmerRepository.countDistinctVillagesByEmail(userEmail);
            mainCrops = collectedFarmerRepository.countDistinctCropsByEmail(userEmail);
        }

        return MiddlemanStatsResponse.builder()
                .totalFarmersCollected(totalCollected)
                .farmersAddedToday(addedToday)
                .villagesCovered(villagesCovered)
                .mainCropsRecorded(mainCrops)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<com.agriconnect.dto.FarmerSearchResponse> searchFarmerAccounts(String query) {
        List<User> farmers = userRepository.searchFarmers(query);
        return farmers.stream()
                .map(u -> com.agriconnect.dto.FarmerSearchResponse.builder()
                        .id(u.getId())
                        .firstName(u.getFirstName())
                        .lastName(u.getLastName())
                        .email(u.getEmail())
                        .phoneNumber(u.getPhoneNumber())
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public CollectedFarmerResponse linkFarmer(Long id, Long farmerUserId, String userEmail, boolean isAdmin) {
        CollectedFarmer collectedFarmer;
        if (isAdmin) {
            collectedFarmer = collectedFarmerRepository.findById(id)
                    .orElseThrow(() -> new CustomException("Collected farmer record not found", HttpStatus.NOT_FOUND));
        } else {
            collectedFarmer = collectedFarmerRepository.findByIdAndCollectedByEmail(id, userEmail)
                    .orElseThrow(() -> new CustomException("Collected farmer record not found or access denied", HttpStatus.NOT_FOUND));
        }

        User farmerUser = userRepository.findById(farmerUserId)
                .orElseThrow(() -> new CustomException("Farmer user account not found", HttpStatus.NOT_FOUND));

        String roleName = farmerUser.getRole() != null ? farmerUser.getRole().getName() : "";
        if (!"FARMER".equalsIgnoreCase(roleName) && !"ROLE_FARMER".equalsIgnoreCase(roleName)) {
            throw new CustomException("Selected user does not have FARMER role", HttpStatus.BAD_REQUEST);
        }

        collectedFarmer.setLinkedFarmer(farmerUser);
        CollectedFarmer saved = collectedFarmerRepository.save(collectedFarmer);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public CollectedFarmerResponse unlinkFarmer(Long id, String userEmail, boolean isAdmin) {
        CollectedFarmer collectedFarmer;
        if (isAdmin) {
            collectedFarmer = collectedFarmerRepository.findById(id)
                    .orElseThrow(() -> new CustomException("Collected farmer record not found", HttpStatus.NOT_FOUND));
        } else {
            collectedFarmer = collectedFarmerRepository.findByIdAndCollectedByEmail(id, userEmail)
                    .orElseThrow(() -> new CustomException("Collected farmer record not found or access denied", HttpStatus.NOT_FOUND));
        }

        collectedFarmer.setLinkedFarmer(null);
        CollectedFarmer saved = collectedFarmerRepository.save(collectedFarmer);
        return mapToResponse(saved);
    }
}
