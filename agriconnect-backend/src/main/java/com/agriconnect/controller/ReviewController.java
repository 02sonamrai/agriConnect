package com.agriconnect.controller;

import com.agriconnect.dto.CreateReviewRequest;
import com.agriconnect.dto.OrderReviewTargetsResponse;
import com.agriconnect.dto.ReviewResponse;
import com.agriconnect.dto.SellerReviewSummaryResponse;
import com.agriconnect.dto.UpdateReviewRequest;
import com.agriconnect.service.ReviewService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

/**
 * Buyer reviews and the seller-side scorecards.
 *
 * <p>Who may call what is decided by role at the URL level and again per action in the service, so
 * a buyer cannot review someone else's order and a farmer can only ever read their own scorecard.
 * No endpoint exposes another seller's reviews.
 */
@RestController
@RequestMapping("/api/reviews")
public class ReviewController {

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    /** Rate one seller on one delivered order. */
    @PostMapping
    public ReviewResponse createReview(@Valid @RequestBody CreateReviewRequest request, Principal principal) {
        return reviewService.createReview(request, principal.getName());
    }

    /** Change the rating or comment on a review the caller already wrote. */
    @PutMapping("/{reviewId}")
    public ReviewResponse updateReview(@PathVariable Long reviewId,
                                      @Valid @RequestBody UpdateReviewRequest request,
                                      Principal principal) {
        return reviewService.updateReview(reviewId, request, principal.getName());
    }

    /** The caller's own submissions. */
    @GetMapping("/mine")
    public List<ReviewResponse> getMyReviews(Principal principal) {
        return reviewService.getMyReviews(principal.getName());
    }

    /** The sellers in one of the caller's orders, and which still need a review. */
    @GetMapping("/order/{orderId}/targets")
    public OrderReviewTargetsResponse getReviewTargets(@PathVariable Long orderId, Principal principal) {
        return reviewService.getReviewTargets(orderId, principal.getName());
    }

    /** The signed-in farmer's own scorecard. */
    @GetMapping("/received/farmer")
    public SellerReviewSummaryResponse getReviewsReceivedByFarmer(Principal principal) {
        return reviewService.getReviewsReceivedByFarmer(principal.getName());
    }

    /** The scorecard for one of the signed-in coordinator's own collected farmers. */
    @GetMapping("/received/collected-farmer/{collectedFarmerId}")
    public SellerReviewSummaryResponse getReviewsReceivedByCollectedFarmer(
            @PathVariable Long collectedFarmerId, Principal principal) {
        return reviewService.getReviewsReceivedByCollectedFarmer(collectedFarmerId, principal.getName());
    }
}
