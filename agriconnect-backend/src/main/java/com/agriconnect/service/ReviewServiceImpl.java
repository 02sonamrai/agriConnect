package com.agriconnect.service;

import com.agriconnect.dto.CreateReviewRequest;
import com.agriconnect.dto.OrderReviewTargetResponse;
import com.agriconnect.dto.OrderReviewTargetsResponse;
import com.agriconnect.dto.ReviewResponse;
import com.agriconnect.dto.SellerReviewSummaryResponse;
import com.agriconnect.dto.UpdateReviewRequest;
import com.agriconnect.entity.CollectedFarmer;
import com.agriconnect.entity.Order;
import com.agriconnect.entity.OrderItem;
import com.agriconnect.entity.Review;
import com.agriconnect.entity.User;
import com.agriconnect.exception.CustomException;
import com.agriconnect.repository.CollectedFarmerRepository;
import com.agriconnect.repository.OrderRepository;
import com.agriconnect.repository.ReviewRepository;
import com.agriconnect.repository.UserRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

@Service
public class ReviewServiceImpl implements ReviewService {

    private final OrderRepository orderRepository;
    private final ReviewRepository reviewRepository;
    private final CollectedFarmerRepository collectedFarmerRepository;
    private final UserRepository userRepository;

    public ReviewServiceImpl(OrderRepository orderRepository,
                             ReviewRepository reviewRepository,
                             CollectedFarmerRepository collectedFarmerRepository,
                             UserRepository userRepository) {
        this.orderRepository = orderRepository;
        this.reviewRepository = reviewRepository;
        this.collectedFarmerRepository = collectedFarmerRepository;
        this.userRepository = userRepository;
    }

    /**
     * {@inheritDoc}
     *
     * <p>Returns targets for any of the buyer's orders, not just delivered ones, so the UI can
     * explain <em>why</em> an order is not reviewable yet instead of hiding the option.
     */
    @Override
    @Transactional(readOnly = true)
    public OrderReviewTargetsResponse getReviewTargets(Long orderId, String buyerEmail) {
        User buyer = resolveUser(buyerEmail);
        Order order = requireOwnOrder(orderId, buyer);

        Map<String, SellerInOrder> sellers = sellersInOrder(order);
        Map<String, Review> existing = reviewsBySellerKey(order.getId());

        List<OrderReviewTargetResponse> targets = new ArrayList<>(sellers.size());
        for (SellerInOrder seller : sellers.values()) {
            Review review = existing.get(seller.key);
            targets.add(OrderReviewTargetResponse.builder()
                    .sellerKey(seller.key)
                    .sellerType(seller.sellerType)
                    .sellerName(seller.sellerName)
                    .cropNames(seller.cropNames)
                    .alreadyReviewed(review != null)
                    .reviewId(review == null ? null : review.getId())
                    .build());
        }

        boolean delivered = Order.STATUS_DELIVERED.equals(order.getStatus());
        String reason = null;
        if (!delivered) {
            reason = "You can review this order once it has been delivered.";
        } else if (targets.isEmpty()) {
            reason = "This order has no seller to review.";
        }

        return OrderReviewTargetsResponse.builder()
                .orderId(order.getId())
                .orderNumber(order.getOrderNumber())
                .orderStatus(order.getStatus())
                .reviewable(delivered && !targets.isEmpty())
                .reason(reason)
                .targets(targets)
                .build();
    }

    @Override
    @Transactional
    public ReviewResponse createReview(CreateReviewRequest request, String buyerEmail) {
        User buyer = resolveUser(buyerEmail);
        int rating = requireValidRating(request.getRating());
        Order order = requireOwnOrder(request.getOrderId(), buyer);

        if (!Order.STATUS_DELIVERED.equals(order.getStatus())) {
            throw new CustomException("You can only review an order after it has been delivered",
                    HttpStatus.BAD_REQUEST);
        }

        // The client sends a seller key, so re-derive the order's sellers and confirm the key is
        // really one of them. A key from some other order cannot be used to review this one.
        Map<String, SellerInOrder> sellers = sellersInOrder(order);
        SellerInOrder seller = sellers.get(request.getSellerKey());
        if (seller == null) {
            throw new CustomException("This order has no such seller to review", HttpStatus.BAD_REQUEST);
        }

        if (reviewRepository.findByOrderIdAndSellerKey(order.getId(), seller.key).isPresent()) {
            throw new CustomException("You have already reviewed this seller for this order",
                    HttpStatus.CONFLICT);
        }

        Review review = Review.builder()
                .order(order)
                .buyer(buyer)
                .sellerKey(seller.key)
                .sellerType(seller.sellerType)
                .rating(rating)
                .comment(trimToNull(request.getComment()))
                .build();

        if (OrderItem.SELLER_TYPE_COLLECTED_FARMER.equals(seller.sellerType)) {
            review.setCollectedFarmer(collectedFarmerRepository.getReferenceById(seller.sellerId));
        } else {
            review.setFarmer(userRepository.getReferenceById(seller.sellerId));
        }

        try {
            // Flush now so the unique index on (order, seller) is enforced inside this method
            // rather than at commit time, where a double submit would surface as a 500.
            reviewRepository.saveAndFlush(review);
        } catch (DataIntegrityViolationException ex) {
            throw new CustomException("You have already reviewed this seller for this order",
                    HttpStatus.CONFLICT);
        }

        return toResponse(review);
    }

    @Override
    @Transactional
    public ReviewResponse updateReview(Long reviewId, UpdateReviewRequest request, String buyerEmail) {
        User buyer = resolveUser(buyerEmail);
        int rating = requireValidRating(request.getRating());

        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new CustomException("Review not found", HttpStatus.NOT_FOUND));

        if (review.getBuyer() == null || !review.getBuyer().getId().equals(buyer.getId())) {
            throw new CustomException("You can only edit your own review", HttpStatus.FORBIDDEN);
        }

        review.setRating(rating);
        review.setComment(trimToNull(request.getComment()));

        // Flush for the same reason createReview does, plus one more: @PreUpdate stamps
        // updatedAt during the flush, so without it the response would carry the pre-edit
        // timestamp and every edited review would render as "never edited".
        return toResponse(reviewRepository.saveAndFlush(review));
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReviewResponse> getMyReviews(String buyerEmail) {
        User buyer = resolveUser(buyerEmail);
        List<Review> reviews = reviewRepository.findTop100ByBuyer_IdOrderByCreatedAtDesc(buyer.getId());

        List<ReviewResponse> responses = new ArrayList<>(reviews.size());
        for (Review review : reviews) {
            responses.add(toResponse(review));
        }
        return responses;
    }

    @Override
    @Transactional(readOnly = true)
    public SellerReviewSummaryResponse getReviewsReceivedByFarmer(String farmerEmail) {
        User farmer = resolveUser(farmerEmail);

        if (farmer.getRole() == null || !"ROLE_FARMER".equals(farmer.getRole().getName())) {
            throw new CustomException("Only a farmer can view their own rating", HttpStatus.FORBIDDEN);
        }

        List<Review> reviews = reviewRepository.findTop50ByFarmer_IdOrderByCreatedAtDesc(farmer.getId());

        return buildSummary(
                OrderItem.SELLER_TYPE_FARMER,
                Review.sellerKeyFor(OrderItem.SELLER_TYPE_FARMER, farmer.getId()),
                displayName(farmer),
                reviews,
                reviewRepository.ratingBreakdownForFarmer(farmer.getId()));
    }

    @Override
    @Transactional(readOnly = true)
    public SellerReviewSummaryResponse getReviewsReceivedByCollectedFarmer(Long collectedFarmerId,
                                                                           String coordinatorEmail) {
        User coordinator = resolveUser(coordinatorEmail);

        CollectedFarmer collectedFarmer = collectedFarmerRepository.findById(collectedFarmerId)
                .orElseThrow(() -> new CustomException("Collected farmer not found", HttpStatus.NOT_FOUND));

        // A coordinator may only read the scorecard of a collected farmer they collected.
        if (collectedFarmer.getCollectedBy() == null
                || !collectedFarmer.getCollectedBy().getId().equals(coordinator.getId())) {
            throw new CustomException("You can only view reviews for your own collected farmers",
                    HttpStatus.FORBIDDEN);
        }

        List<Review> reviews = reviewRepository
                .findTop50ByCollectedFarmer_IdOrderByCreatedAtDesc(collectedFarmerId);

        return buildSummary(
                OrderItem.SELLER_TYPE_COLLECTED_FARMER,
                Review.sellerKeyFor(OrderItem.SELLER_TYPE_COLLECTED_FARMER, collectedFarmerId),
                collectedFarmer.getFarmerName(),
                reviews,
                reviewRepository.ratingBreakdownForCollectedFarmer(collectedFarmerId));
    }

    /**
     * Groups an order's lines by seller, in the order they first appear.
     *
     * <p>The seller is read from the line's foreign keys rather than from the snapshotted
     * {@code sellerType} column, which means an order written before that column existed is still
     * attributed correctly.
     */
    private Map<String, SellerInOrder> sellersInOrder(Order order) {
        Map<String, SellerInOrder> sellers = new LinkedHashMap<>();

        for (OrderItem item : order.getItems()) {
            SellerInOrder candidate = resolveSeller(item);
            if (candidate == null) {
                // The seller record was deleted after the order was placed - nothing to review.
                continue;
            }

            SellerInOrder seller = sellers.get(candidate.key);
            if (seller == null) {
                candidate.cropNames = new ArrayList<>();
                seller = candidate;
                sellers.put(candidate.key, seller);
            }
            if (item.getCropName() != null && !seller.cropNames.contains(item.getCropName())) {
                seller.cropNames.add(item.getCropName());
            }
        }

        return sellers;
    }

    private SellerInOrder resolveSeller(OrderItem item) {
        if (item.getFarmer() != null && item.getFarmer().getId() != null) {
            return new SellerInOrder(
                    Review.sellerKeyFor(OrderItem.SELLER_TYPE_FARMER, item.getFarmer().getId()),
                    OrderItem.SELLER_TYPE_FARMER,
                    item.getFarmer().getId(),
                    displayName(item.getFarmer()));
        }

        if (item.getCollectedFarmer() != null && item.getCollectedFarmer().getId() != null) {
            return new SellerInOrder(
                    Review.sellerKeyFor(OrderItem.SELLER_TYPE_COLLECTED_FARMER,
                            item.getCollectedFarmer().getId()),
                    OrderItem.SELLER_TYPE_COLLECTED_FARMER,
                    item.getCollectedFarmer().getId(),
                    item.getCollectedFarmer().getFarmerName());
        }

        return null;
    }

    private Map<String, Review> reviewsBySellerKey(Long orderId) {
        Map<String, Review> bySellerKey = new LinkedHashMap<>();
        for (Review review : reviewRepository.findByOrderId(orderId)) {
            bySellerKey.put(review.getSellerKey(), review);
        }
        return bySellerKey;
    }

    private Order requireOwnOrder(Long orderId, User buyer) {
        if (orderId == null) {
            throw new CustomException("Order is required", HttpStatus.BAD_REQUEST);
        }

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new CustomException("Order not found", HttpStatus.NOT_FOUND));

        if (order.getBuyer() == null || !order.getBuyer().getId().equals(buyer.getId())) {
            throw new CustomException("You can only review your own orders", HttpStatus.FORBIDDEN);
        }
        return order;
    }

    private int requireValidRating(Integer rating) {
        if (rating == null) {
            throw new CustomException("Rating is required", HttpStatus.BAD_REQUEST);
        }
        // Repeated even though the request DTO is annotated, so the rule holds if the service is
        // ever called from somewhere the bean validation does not cover.
        if (rating < Review.MIN_RATING || rating > Review.MAX_RATING) {
            throw new CustomException("Rating must be between " + Review.MIN_RATING + " and "
                    + Review.MAX_RATING, HttpStatus.BAD_REQUEST);
        }
        return rating;
    }

    private SellerReviewSummaryResponse buildSummary(String sellerType, String sellerKey, String sellerName,
                                                     List<Review> reviews, List<Object[]> breakdown) {
        Map<Integer, Long> counts = new TreeMap<>();
        long total = 0;
        long weightedSum = 0;

        for (Object[] row : breakdown) {
            Integer stars = (Integer) row[0];
            Long count = (Long) row[1];
            if (stars == null || count == null) {
                continue;
            }
            counts.put(stars, count);
            total += count;
            weightedSum += (long) stars * count;
        }

        List<ReviewResponse> responses = new ArrayList<>(reviews.size());
        for (Review review : reviews) {
            responses.add(toResponse(review));
        }

        return SellerReviewSummaryResponse.builder()
                .sellerType(sellerType)
                .sellerKey(sellerKey)
                .sellerName(sellerName)
                .averageRating(total == 0 ? 0d
                        : BigDecimal.valueOf(weightedSum)
                                .divide(BigDecimal.valueOf(total), 1, RoundingMode.HALF_UP)
                                .doubleValue())
                .totalReviews(total)
                .ratingBreakdown(counts)
                .reviews(responses)
                .build();
    }

    private ReviewResponse toResponse(Review review) {
        User buyer = review.getBuyer();
        return ReviewResponse.builder()
                .id(review.getId())
                .orderId(review.getOrder() == null ? null : review.getOrder().getId())
                .orderNumber(review.getOrder() == null ? null : review.getOrder().getOrderNumber())
                .sellerType(review.getSellerType())
                .sellerKey(review.getSellerKey())
                .sellerName(sellerNameOf(review))
                .rating(review.getRating())
                .comment(review.getComment())
                .buyerName(buyer == null ? null : displayName(buyer))
                .createdAt(review.getCreatedAt())
                .updatedAt(review.getUpdatedAt())
                .build();
    }

    /** The reviewed seller, or null once that seller record has been removed. */
    private String sellerNameOf(Review review) {
        if (review.getCollectedFarmer() != null) {
            return review.getCollectedFarmer().getFarmerName();
        }
        if (review.getFarmer() != null) {
            return displayName(review.getFarmer());
        }
        return null;
    }

    private User resolveUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new CustomException("User account not found", HttpStatus.UNAUTHORIZED));
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private static String displayName(User user) {
        if (user == null) {
            return null;
        }
        String first = user.getFirstName() == null ? "" : user.getFirstName().trim();
        String last = user.getLastName() == null ? "" : user.getLastName().trim();
        String full = (first + " " + last).trim();
        return full.isEmpty() ? user.getEmail() : full;
    }

    /** One seller within an order, plus the crops they supplied. */
    private static final class SellerInOrder {
        private final String key;
        private final String sellerType;
        private final Long sellerId;
        private final String sellerName;
        private List<String> cropNames;

        private SellerInOrder(String key, String sellerType, Long sellerId, String sellerName) {
            this.key = key;
            this.sellerType = sellerType;
            this.sellerId = sellerId;
            this.sellerName = sellerName;
        }
    }
}
