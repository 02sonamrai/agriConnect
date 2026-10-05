package com.agriconnect.service;

import com.agriconnect.dto.FarmerContactResponse;

public interface ContactService {

    /**
     * Safe contact details for the seller behind a marketplace listing. Reuses the ownership
     * rule the marketplace already uses, so coordinator-added crops resolve to the Collected
     * Farmer rather than to the coordinator.
     */
    FarmerContactResponse getContactForCrop(Long cropId);
}
