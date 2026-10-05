package com.agriconnect.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * A seller's review scorecard: their average rating, how many reviews it is based on, and the
 * reviews themselves.
 *
 * <p>Served to the rated seller only - a registered farmer for their own profile, or the
 * coordinator who collected a collected farmer. {@code averageRating} is 0.0 when there are no
 * reviews yet, so callers should treat {@link #totalReviews} as the authority on whether a score
 * exists.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SellerReviewSummaryResponse {

    /** FARMER or COLLECTED_FARMER. */
    private String sellerType;

    private String sellerKey;

    private String sellerName;

    /** Average of all ratings, rounded to one decimal place. 0.0 when there are no reviews. */
    private double averageRating;

    private long totalReviews;

    /** Count of each star value, keyed 1-5, so a seller can see their own distribution. */
    private Map<Integer, Long> ratingBreakdown;

    private List<ReviewResponse> reviews;
}
