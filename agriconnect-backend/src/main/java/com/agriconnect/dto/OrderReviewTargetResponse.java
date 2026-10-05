package com.agriconnect.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * One seller inside a delivered order that the buyer may review, plus whether they already have.
 *
 * <p>The buyer gets one of these per seller rather than one per order, which is what keeps a
 * collected farmer's review off a registered farmer's profile on a mixed-seller order.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderReviewTargetResponse {

    /** {@code FARMER:<id>} or {@code COLLECTED_FARMER:<id>} - sent back on review creation. */
    private String sellerKey;

    /** FARMER or COLLECTED_FARMER. */
    private String sellerType;

    private String sellerName;

    /** Crops in this order supplied by this seller. */
    private List<String> cropNames;

    private boolean alreadyReviewed;

    /** Set when {@link #alreadyReviewed} is true, so the buyer can open and edit their review. */
    private Long reviewId;
}
