package com.agriconnect.service;

import com.agriconnect.dto.CropRequest;
import com.agriconnect.dto.CropResponse;
import java.util.List;

public interface CropService {
    CropResponse createCrop(CropRequest request, String farmerEmail);
    List<CropResponse> getFarmerCrops(String farmerEmail);
    CropResponse getCropById(Long id, String farmerEmail);
    CropResponse updateCrop(Long id, CropRequest request, String farmerEmail);
    void deleteCrop(Long id, String farmerEmail);
    List<CropResponse> getAvailableCrops();
    CropResponse getAvailableCropById(Long id);
}
