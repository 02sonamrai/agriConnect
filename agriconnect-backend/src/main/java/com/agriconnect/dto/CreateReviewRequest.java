package com.agriconnect.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * A buyer's request to rate one seller within one delivered order.
 *
 * <p>{@code sellerKey} is the discriminator the review-targets endpoint hands out (for example
 * {@code COLLECTED_FARMER:7}). It is never trusted on its own: the service re-derives the order's
 * sellers and rejects a key that does not belong to the order.
 *
 * <p>The 1-5 bounds mirror {@code Review.MIN_RATING} / {@code Review.MAX_RATING}, which the service
 * re-checks. They are written as literals to keep DTOs free of entity imports.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateReviewRequest {

    @NotNull(message = "Order is required")
    private Long orderId;

    @NotNull(message = "Seller is required")
    @Size(max = 60, message = "Invalid seller")
    private String sellerKey;

    @NotNull(message = "Rating is required")
    @Min(value = 1, message = "Rating must be between 1 and 5")
    @Max(value = 5, message = "Rating must be between 1 and 5")
    private Integer rating;

    @Size(max = 500, message = "Review must be less than 500 characters")
    private String comment;
}
