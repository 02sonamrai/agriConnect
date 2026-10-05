package com.agriconnect.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * What the buyer can review on one of their delivered orders: the sellers involved and which of
 * them have already been reviewed.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderReviewTargetsResponse {

    private Long orderId;

    private String orderNumber;

    private String orderStatus;

    /** False for any status other than DELIVERED - the order is not reviewable yet. */
    private boolean reviewable;

    /** Why the order cannot be reviewed, when {@link #reviewable} is false. */
    private String reason;

    private List<OrderReviewTargetResponse> targets;
}
