package com.agriconnect.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * One stored review. Used in all three places a review can be read - the buyer's own list, the
 * farmer's received list, and the coordinator's list for a collected farmer - because in every one
 * of those the viewer is a genuine party to the order the review was written about.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReviewResponse {

    private Long id;

    private Long orderId;

    private String orderNumber;

    /** FARMER or COLLECTED_FARMER. */
    private String sellerType;

    private String sellerKey;

    /** The rated seller - the registered farmer, or the collected farmer's name. */
    private String sellerName;

    private Integer rating;

    private String comment;

    /** Null once the reviewing account has been removed. */
    private String buyerName;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    /** True when {@link #updatedAt} is later than {@link #createdAt}. */
    public boolean isEdited() {
        return createdAt != null && updatedAt != null && updatedAt.isAfter(createdAt);
    }
}
