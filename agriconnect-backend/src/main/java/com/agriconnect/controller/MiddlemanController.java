package com.agriconnect.controller;

import com.agriconnect.dto.*;
import com.agriconnect.exception.CustomException;
import com.agriconnect.service.CollectedFarmerService;
import com.agriconnect.service.CropService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.security.Principal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/middleman")
public class MiddlemanController {

    private final CollectedFarmerService collectedFarmerService;
    private final CropService cropService;

    public MiddlemanController(CollectedFarmerService collectedFarmerService, CropService cropService) {
        this.collectedFarmerService = collectedFarmerService;
        this.cropService = cropService;
    }

    private boolean checkIsAdmin(Authentication authentication) {
        if (authentication == null) return false;
        return authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    }

    @PostMapping("/farmers")
    public ResponseEntity<CollectedFarmerResponse> createCollectedFarmer(
            @Valid @RequestBody CollectedFarmerRequest request,
            Principal principal) {

        CollectedFarmerResponse response = collectedFarmerService.createCollectedFarmer(request, principal.getName());
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping("/farmers")
    public ResponseEntity<List<CollectedFarmerResponse>> getCollectedFarmers(
            Principal principal,
            Authentication authentication) {

        boolean isAdmin = checkIsAdmin(authentication);
        List<CollectedFarmerResponse> response = collectedFarmerService.getCollectedFarmers(principal.getName(), isAdmin);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/farmers/stats")
    public ResponseEntity<MiddlemanStatsResponse> getMiddlemanStats(
            Principal principal,
            Authentication authentication) {

        boolean isAdmin = checkIsAdmin(authentication);
        MiddlemanStatsResponse stats = collectedFarmerService.getMiddlemanStats(principal.getName(), isAdmin);
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/farmers/search")
    public ResponseEntity<List<FarmerSearchResponse>> searchFarmers(
            @RequestParam(required = false, defaultValue = "") String query) {
        List<FarmerSearchResponse> results = collectedFarmerService.searchFarmerAccounts(query);
        return ResponseEntity.ok(results);
    }

    @GetMapping("/farmers/{id}")
    public ResponseEntity<CollectedFarmerResponse> getCollectedFarmerById(
            @PathVariable Long id,
            Principal principal,
            Authentication authentication) {

        boolean isAdmin = checkIsAdmin(authentication);
        CollectedFarmerResponse response = collectedFarmerService.getCollectedFarmerById(id, principal.getName(), isAdmin);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/farmers/{id}")
    public ResponseEntity<CollectedFarmerResponse> updateCollectedFarmer(
            @PathVariable Long id,
            @Valid @RequestBody CollectedFarmerRequest request,
            Principal principal,
            Authentication authentication) {

        boolean isAdmin = checkIsAdmin(authentication);
        CollectedFarmerResponse response = collectedFarmerService.updateCollectedFarmer(id, request, principal.getName(), isAdmin);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/farmers/{id}")
    public ResponseEntity<Void> deleteCollectedFarmer(
            @PathVariable Long id,
            Principal principal,
            Authentication authentication) {

        boolean isAdmin = checkIsAdmin(authentication);
        collectedFarmerService.deleteCollectedFarmer(id, principal.getName(), isAdmin);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/farmers/{collectedFarmerId}/link/{farmerUserId}")
    public ResponseEntity<CollectedFarmerResponse> linkFarmer(
            @PathVariable Long collectedFarmerId,
            @PathVariable Long farmerUserId,
            Principal principal,
            Authentication authentication) {

        boolean isAdmin = checkIsAdmin(authentication);
        CollectedFarmerResponse response = collectedFarmerService.linkFarmer(collectedFarmerId, farmerUserId, principal.getName(), isAdmin);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/farmers/{collectedFarmerId}/unlink")
    public ResponseEntity<CollectedFarmerResponse> unlinkFarmer(
            @PathVariable Long collectedFarmerId,
            Principal principal,
            Authentication authentication) {

        boolean isAdmin = checkIsAdmin(authentication);
        CollectedFarmerResponse response = collectedFarmerService.unlinkFarmer(collectedFarmerId, principal.getName(), isAdmin);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/farmers/{collectedFarmerId}/crops")
    public ResponseEntity<CropResponse> createCropForCollectedFarmer(
            @PathVariable Long collectedFarmerId,
            @Valid @RequestBody CropRequest request,
            Principal principal,
            Authentication authentication) {

        boolean isAdmin = checkIsAdmin(authentication);
        CropResponse response = cropService.createCropForCollectedFarmer(collectedFarmerId, request, principal.getName(), isAdmin);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping("/farmers/{collectedFarmerId}/crops")
    public ResponseEntity<List<CropResponse>> getCropsForCollectedFarmer(
            @PathVariable Long collectedFarmerId,
            Principal principal,
            Authentication authentication) {

        boolean isAdmin = checkIsAdmin(authentication);
        List<CropResponse> response = cropService.getCropsForCollectedFarmer(collectedFarmerId, principal.getName(), isAdmin);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/crops/{cropId}")
    public ResponseEntity<CropResponse> updateCropForMiddleman(
            @PathVariable Long cropId,
            @Valid @RequestBody CropRequest request,
            Principal principal,
            Authentication authentication) {

        boolean isAdmin = checkIsAdmin(authentication);
        CropResponse response = cropService.updateCropForMiddleman(cropId, request, principal.getName(), isAdmin);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/crops/{cropId}")
    public ResponseEntity<Void> deleteCropForMiddleman(
            @PathVariable Long cropId,
            Principal principal,
            Authentication authentication) {

        boolean isAdmin = checkIsAdmin(authentication);
        cropService.deleteCropForMiddleman(cropId, principal.getName(), isAdmin);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/crops/upload-image")
    public ResponseEntity<Map<String, String>> uploadCropImage(@RequestParam("file") MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new CustomException("Image file is empty", HttpStatus.BAD_REQUEST);
        }

        String contentType = file.getContentType();
        if (contentType == null || !(contentType.equalsIgnoreCase("image/jpeg") ||
                                   contentType.equalsIgnoreCase("image/jpg") ||
                                   contentType.equalsIgnoreCase("image/png") ||
                                   contentType.equalsIgnoreCase("image/webp") ||
                                   contentType.equalsIgnoreCase("image/gif"))) {
            throw new CustomException("Invalid file type. Only JPEG, PNG, WEBP, and GIF images are allowed.", HttpStatus.BAD_REQUEST);
        }

        if (file.getSize() > 5 * 1024 * 1024) {
            throw new CustomException("File size exceeds maximum limit of 5MB", HttpStatus.BAD_REQUEST);
        }

        try {
            String originalFileName = StringUtils.cleanPath(file.getOriginalFilename() != null ? file.getOriginalFilename() : "image.jpg");
            String fileName = UUID.randomUUID().toString() + "_" + originalFileName.replaceAll("[^a-zA-Z0-9._-]", "_");

            Path uploadPath = Paths.get("uploads");
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            Path filePath = uploadPath.resolve(fileName);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            String imageUrl = "/uploads/" + fileName;
            return ResponseEntity.ok(Map.of("imageUrl", imageUrl));
        } catch (IOException e) {
            throw new CustomException("Failed to store crop image", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
