package com.agriconnect.service;

import com.agriconnect.dto.CollectedFarmerRequest;
import com.agriconnect.dto.CollectedFarmerResponse;
import com.agriconnect.dto.FarmerSearchResponse;
import com.agriconnect.dto.MiddlemanStatsResponse;

import java.util.List;

public interface CollectedFarmerService {

    CollectedFarmerResponse createCollectedFarmer(CollectedFarmerRequest request, String middlemanEmail);

    List<CollectedFarmerResponse> getCollectedFarmers(String userEmail, boolean isAdmin);

    CollectedFarmerResponse getCollectedFarmerById(Long id, String userEmail, boolean isAdmin);

    CollectedFarmerResponse updateCollectedFarmer(Long id, CollectedFarmerRequest request, String userEmail, boolean isAdmin);

    void deleteCollectedFarmer(Long id, String userEmail, boolean isAdmin);

    MiddlemanStatsResponse getMiddlemanStats(String userEmail, boolean isAdmin);

    List<FarmerSearchResponse> searchFarmerAccounts(String query);

    CollectedFarmerResponse linkFarmer(Long id, Long farmerUserId, String userEmail, boolean isAdmin);

    CollectedFarmerResponse unlinkFarmer(Long id, String userEmail, boolean isAdmin);
}
