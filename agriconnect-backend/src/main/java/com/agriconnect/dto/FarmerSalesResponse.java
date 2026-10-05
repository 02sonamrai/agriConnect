package com.agriconnect.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

/**
 * Sales and earnings summary for one registered farmer, derived entirely from that farmer's own
 * order items and crop listings. Nothing is stored; every figure is computed on read.
 *
 * <p>Earnings are reported two ways on purpose. {@code deliveredEarnings} counts only DELIVERED
 * orders and is the headline, because that is money actually in hand. {@code totalEarnings} counts
 * every order that has not been cancelled or rejected, so a farmer can see the full pipeline
 * value. CANCELLED and REJECTED orders are excluded from both, along with their quantity.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FarmerSalesResponse {

    private long totalCropsListed;
    private long availableCrops;

    /** Distinct orders containing at least one of this farmer's crops. */
    private long totalOrdersReceived;

    /** Orders still to fulfil: PLACED, PENDING, CONFIRMED or SHIPPED. */
    private long pendingOrders;

    /** Orders in the DELIVERED state. */
    private long completedOrders;

    /** Orders in the CANCELLED or REJECTED state - shown for information, never counted as earnings. */
    private long cancelledOrders;

    /**
     * Sum of ordered quantity across non-cancelled orders. Mixed units cannot be added
     * meaningfully, so {@link #quantitySoldByUnit} is the figure to present; this total is kept
     * for a simple single-unit farmer and is not shown when more than one unit is present.
     */
    private BigDecimal totalQuantitySold;

    /** Ordered quantity split by unit, e.g. {"Kg": 120.00, "Quintal": 8.00}. */
    private Map<String, BigDecimal> quantitySoldByUnit;

    /** Value of DELIVERED orders - the headline earnings figure. */
    private BigDecimal deliveredEarnings;

    /** Value of every order that is not cancelled or rejected. */
    private BigDecimal totalEarnings;

    /** Most recent order lines, newest first. */
    private List<FarmerSaleLineResponse> recentSales;
}