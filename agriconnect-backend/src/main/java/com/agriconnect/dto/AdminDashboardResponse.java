package com.agriconnect.dto;

public record AdminDashboardResponse(
        long totalUsers,
        long farmers,
        long buyers,
        long coordinators,
        long administrators,
        long totalCrops,
        long availableCrops) {
}
