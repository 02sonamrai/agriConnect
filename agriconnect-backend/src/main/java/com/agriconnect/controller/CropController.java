package com.agriconnect.controller;

import com.agriconnect.dto.CropRequest;
import com.agriconnect.dto.CropResponse;
import com.agriconnect.service.CropService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/farmer/crops")
public class CropController {

    private final CropService cropService;

    public CropController(CropService cropService) {
        this.cropService = cropService;
    }

    @PostMapping
    public ResponseEntity<CropResponse> createCrop(@Valid @RequestBody CropRequest request, Principal principal) {
        CropResponse response = cropService.createCrop(request, principal.getName());
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<CropResponse>> getFarmerCrops(Principal principal) {
        List<CropResponse> response = cropService.getFarmerCrops(principal.getName());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<CropResponse> getCropById(@PathVariable Long id, Principal principal) {
        CropResponse response = cropService.getCropById(id, principal.getName());
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<CropResponse> updateCrop(@PathVariable Long id, @Valid @RequestBody CropRequest request, Principal principal) {
        CropResponse response = cropService.updateCrop(id, request, principal.getName());
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCrop(@PathVariable Long id, Principal principal) {
        cropService.deleteCrop(id, principal.getName());
        return ResponseEntity.noContent().build();
    }
}
