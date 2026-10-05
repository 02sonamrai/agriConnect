package com.agriconnect.service;

import com.agriconnect.dto.CreateReviewRequest;
import com.agriconnect.dto.OrderReviewTargetsResponse;
import com.agriconnect.dto.ReviewResponse;
import com.agriconnect.dto.SellerReviewSummaryResponse;
import com.agriconnect.dto.UpdateReviewRequest;

import java.util.List;

/**
 * Buyer reviews of sellers on delivered orders.
 *
 * <p>A review belongs to one order <em>and</em> one seller, because an order can mix a registered
 * farmer with a collected farmer. That pairing is what stops a collected farmer's review from
 * landing on a registered farmer's profile.
 *
 * <p>Every method takes the caller's email rather than an id, and resolves the subject from it, so
 * a caller can only ever reach their own orders and their own reviews.
 */
public interface ReviewService {

    /** The sellers in one of the buyer's orders, and which of them are still reviewable. */
    OrderReviewTargetsResponse getReviewTargets(Long orderId, String buyerEmail);

    ReviewResponse createReview(CreateReviewRequest request, String buyerEmail);

    ReviewResponse updateReview(Long reviewId, UpdateReviewRequest request, String buyerEmail);

    /** Reviews the signed-in buyer has written. */
    List<ReviewResponse> getMyReviews(String buyerEmail);

    /** Scorecard for the signed-in farmer. */
    SellerReviewSummaryResponse getReviewsReceivedByFarmer(String farmerEmail);

    /**
     * Scorecard for one of a coordinator's own collected farmers.
     *
     * @throws com.agriconnect.exception.CustomException if the coordinator does not own that
     *         collected farmer
     */
    SellerReviewSummaryResponse getReviewsReceivedByCollectedFarmer(Long collectedFarmerId,
                                                                    String coordinatorEmail);
}
