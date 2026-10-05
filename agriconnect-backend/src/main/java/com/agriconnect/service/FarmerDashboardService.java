package com.agriconnect.service;

import com.agriconnect.dto.FarmerSalesResponse;

/**
 * Read-only sales and earnings summary for the signed-in farmer. Every figure is calculated on
 * request from existing orders and listings; no sales or order data is duplicated or persisted.
 */
public interface FarmerDashboardService {

    FarmerSalesResponse getSales(String farmerEmail);
}