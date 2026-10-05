package com.agriconnect.controller;

import com.agriconnect.dto.FarmerSalesResponse;
import com.agriconnect.service.FarmerDashboardService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;

/**
 * Sales and earnings figures for the signed-in farmer.
 *
 * <p>Sits under the existing {@code /api/farmer/**} prefix, which SecurityConfig already restricts
 * to ROLE_FARMER, so no security rule had to change. The farmer is taken from the JWT principal
 * rather than from any request parameter - a farmer can only ever read their own numbers.
 */
@RestController
@RequestMapping("/api/farmer/dashboard")
public class FarmerDashboardController {

    private final FarmerDashboardService farmerDashboardService;

    public FarmerDashboardController(FarmerDashboardService farmerDashboardService) {
        this.farmerDashboardService = farmerDashboardService;
    }

    @GetMapping("/sales")
    public FarmerSalesResponse getSales(Principal principal) {
        return farmerDashboardService.getSales(principal.getName());
    }
}