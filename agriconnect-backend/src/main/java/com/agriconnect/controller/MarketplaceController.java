package com.agriconnect.controller;

import com.agriconnect.dto.CropResponse;
import com.agriconnect.service.CropService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/marketplace")
public class MarketplaceController {

    private final CropService cropService;

    public MarketplaceController(CropService cropService) {
        this.cropService = cropService;
    }

    @GetMapping("/crops")
    public ResponseEntity<List<CropResponse>> getAvailableCrops() {
        List<CropResponse> response = cropService.getAvailableCrops();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/crops/{id}")
    public ResponseEntity<CropResponse> getAvailableCropById(@PathVariable Long id) {
        CropResponse response = cropService.getAvailableCropById(id);
        return ResponseEntity.ok(response);
    }
}
