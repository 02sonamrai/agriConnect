package com.agriconnect.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MiddlemanStatsResponse {
    private long totalFarmersCollected;
    private long farmersAddedToday;
    private long villagesCovered;
    private long mainCropsRecorded;
}
