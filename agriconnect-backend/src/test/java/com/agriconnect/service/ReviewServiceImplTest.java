package com.agriconnect.service;

import com.agriconnect.dto.CreateReviewRequest;
import com.agriconnect.dto.OrderReviewTargetsResponse;
import com.agriconnect.dto.ReviewResponse;
import com.agriconnect.dto.SellerReviewSummaryResponse;
import com.agriconnect.dto.UpdateReviewRequest;
import com.agriconnect.entity.CollectedFarmer;
import com.agriconnect.entity.Order;
import com.agriconnect.entity.OrderItem;
import com.agriconnect.entity.Review;
import com.agriconnect.entity.Role;
import com.agriconnect.entity.User;
import com.agriconnect.exception.CustomException;
import com.agriconnect.repository.CollectedFarmerRepository;
import com.agriconnect.repository.OrderRepository;
import com.agriconnect.repository.ReviewRepository;
import com.agriconnect.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReviewServiceImplTest {

    private static final Long ORDER_ID = 500L;
    private static final Long FARMER_ID = 2L;
    private static final Long COLLECTED_ID = 9L;

    @Mock
    private OrderRepository orderRepository;
    @Mock
    private ReviewRepository reviewRepository;
    @Mock
    private CollectedFarmerRepository collectedFarmerRepository;
    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private ReviewServiceImpl reviewService;

    // --- fixtures -----------------------------------------------------------------------

    private User buyer() {
        return User.builder().id(1L).email("buyer@example.test")
                .firstName("Bela").lastName("Buyer").build();
    }

    private User farmer() {
        return User.builder().id(FARMER_ID).email("farmer@example.test")
                .firstName("Mithun").lastName("F").role(role("ROLE_FARMER")).build();
    }

    private User coordinator() {
        return User.builder().id(3L).email("coord@example.test")
                .firstName("Chan").lastName("C").role(role("ROLE_COORDINATOR")).build();
    }

    private Role role(String name) {
        return Role.builder().id(1).name(name).build();
    }

    private User user(Long id, String first, String last, String email) {
        return User.builder().id(id).firstName(first).lastName(last).email(email).build();
    }

    /**
     * Builds a star-distribution result of the shape the repository query returns, without the
     * {@code List.of} varargs trap that would flatten several {@code Object[]} rows into a
     * {@code List<Object>}.
     */
    private static List<Object[]> breakdown(Object... starsThenCounts) {
        List<Object[]> rows = new java.util.ArrayList<>();
        for (int i = 0; i < starsThenCounts.length; i += 2) {
            rows.add(new Object[]{starsThenCounts[i], starsThenCounts[i + 1]});
        }
        return rows;
    }

    private CollectedFarmer collectedFarmer(User owner) {
        return CollectedFarmer.builder().id(COLLECTED_ID).farmerName("Collected Ram")
                .collectedBy(owner).build();
    }

    private Order deliveredOrder() {
        return order(Order.STATUS_DELIVERED);
    }

    private Order order(String status) {
        return Order.builder().id(ORDER_ID).buyer(buyer())
                .orderNumber("ORD-000500").status(status).build();
    }

    private void addFarmerLine(Order order, String cropName) {
        OrderItem item = OrderItem.builder().cropName(cropName).farmer(farmer())
                .sellerType(OrderItem.SELLER_TYPE_FARMER).build();
        order.addItem(item);
    }

    private void addCollectedLine(Order order, String cropName) {
        OrderItem item = OrderItem.builder().cropName(cropName).collectedFarmer(collectedFarmer(coordinator()))
                .sellerType(OrderItem.SELLER_TYPE_COLLECTED_FARMER).build();
        order.addItem(item);
    }

    private void givenBuyer() {
        when(userRepository.findByEmail("buyer@example.test")).thenReturn(Optional.of(buyer()));
    }

    private void givenOrder(Order order) {
        when(orderRepository.findById(ORDER_ID)).thenReturn(Optional.of(order));
    }

    private CreateReviewRequest request(String sellerKey, Integer rating) {
        return CreateReviewRequest.builder()
                .orderId(ORDER_ID).sellerKey(sellerKey).rating(rating).comment("Good produce").build();
    }

    // --- who may review what ------------------------------------------------------------

    @Test
    void aBuyerCannotReviewSomebodyElsesOrder() {
        // The order belongs to a different buyer than the caller.
        Order someoneElses = Order.builder().id(ORDER_ID).buyer(user(42L, "Other", "Buyer", "o@x.test"))
                .orderNumber("ORD-000500").status(Order.STATUS_DELIVERED).build();
        addFarmerLine(someoneElses, "Wheat");
        givenBuyer();
        givenOrder(someoneElses);

        CustomException ex = assertThrows(CustomException.class, () -> reviewService
                .createReview(request("FARMER:2", 5), "buyer@example.test"));

        assertEquals(HttpStatus.FORBIDDEN, ex.getStatus());
        verify(reviewRepository, never()).saveAndFlush(any());
    }

    @Test
    void anUnknownOrderIsReportedAsNotFound() {
        givenBuyer();
        when(orderRepository.findById(ORDER_ID)).thenReturn(Optional.empty());

        CustomException ex = assertThrows(CustomException.class, () -> reviewService
                .createReview(request("FARMER:2", 5), "buyer@example.test"));

        assertEquals(HttpStatus.NOT_FOUND, ex.getStatus());
    }

    @ParameterizedTest
    @ValueSource(strings = {Order.STATUS_PLACED, Order.STATUS_PENDING, Order.STATUS_CONFIRMED,
            Order.STATUS_SHIPPED, Order.STATUS_CANCELLED, Order.STATUS_REJECTED})
    void aReviewIsOnlyPossibleOnceTheOrderIsDelivered(String status) {
        Order order = order(status);
        addFarmerLine(order, "Wheat");
        givenBuyer();
        givenOrder(order);

        CustomException ex = assertThrows(CustomException.class, () -> reviewService
                .createReview(request("FARMER:2", 5), "buyer@example.test"));

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        verify(reviewRepository, never()).saveAndFlush(any());
    }

    @ParameterizedTest
    @ValueSource(ints = {0, -1, 6, 99})
    void aRatingOutsideOneToFiveIsRejected(int rating) {
        // The order is deliberately not stubbed: the rating is rejected before the order is
        // even loaded, so a bad rating can never depend on order ownership.
        givenBuyer();

        CustomException ex = assertThrows(CustomException.class, () -> reviewService
                .createReview(request("FARMER:2", rating), "buyer@example.test"));

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        verify(orderRepository, never()).findById(any());
        verify(reviewRepository, never()).saveAndFlush(any());
    }

    @Test
    void oneSellerCannotBeReviewedTwiceOnTheSameOrder() {
        Order order = deliveredOrder();
        addFarmerLine(order, "Wheat");
        givenBuyer();
        givenOrder(order);
        when(reviewRepository.findByOrderIdAndSellerKey(ORDER_ID, "FARMER:2"))
                .thenReturn(Optional.of(Review.builder().id(1L).build()));

        CustomException ex = assertThrows(CustomException.class, () -> reviewService
                .createReview(request("FARMER:2", 5), "buyer@example.test"));

        assertEquals(HttpStatus.CONFLICT, ex.getStatus());
        verify(reviewRepository, never()).saveAndFlush(any());
    }

    @Test
    void aSellerKeyBelongingToAnotherOrderIsRejected() {
        Order order = deliveredOrder();
        addFarmerLine(order, "Wheat");
        givenBuyer();
        givenOrder(order);

        // "COLLECTED_FARMER:9" is a real seller, just not a seller on this order.
        CustomException ex = assertThrows(CustomException.class, () -> reviewService
                .createReview(request("COLLECTED_FARMER:9", 5), "buyer@example.test"));

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        verify(reviewRepository, never()).saveAndFlush(any());
    }

    // --- attribution: the point of the feature -------------------------------------------

    @Test
    void aCollectedFarmersListingIsFiledAgainstTheCollectedFarmerNotTheCoordinator() {
        Order order = deliveredOrder();
        addCollectedLine(order, "Rice");
        givenBuyer();
        givenOrder(order);
        when(reviewRepository.findByOrderIdAndSellerKey(ORDER_ID, "COLLECTED_FARMER:9"))
                .thenReturn(Optional.empty());
        when(collectedFarmerRepository.getReferenceById(COLLECTED_ID))
                .thenReturn(collectedFarmer(coordinator()));
        when(reviewRepository.saveAndFlush(any(Review.class))).thenAnswer(i -> i.getArgument(0));

        reviewService.createReview(request("COLLECTED_FARMER:9", 4), "buyer@example.test");

        Review saved = capturedReview();
        assertEquals("COLLECTED_FARMER:9", saved.getSellerKey());
        assertEquals(OrderItem.SELLER_TYPE_COLLECTED_FARMER, saved.getSellerType());
        assertEquals(COLLECTED_ID, saved.getCollectedFarmer().getId());
        // The load-bearing half: farmer must stay null, or this review would surface on the
        // registered farmer's scorecard.
        assertNull(saved.getFarmer());
        assertEquals(4, saved.getRating());
        assertEquals(1L, saved.getBuyer().getId());
    }

    @Test
    void aRegisteredFarmersListingIsFiledAgainstThatFarmer() {
        Order order = deliveredOrder();
        addFarmerLine(order, "Wheat");
        givenBuyer();
        givenOrder(order);
        when(reviewRepository.findByOrderIdAndSellerKey(ORDER_ID, "FARMER:2")).thenReturn(Optional.empty());
        when(userRepository.getReferenceById(FARMER_ID)).thenReturn(farmer());
        when(reviewRepository.saveAndFlush(any(Review.class))).thenAnswer(i -> i.getArgument(0));

        reviewService.createReview(request("FARMER:2", 5), "buyer@example.test");

        Review saved = capturedReview();
        assertEquals("FARMER:2", saved.getSellerKey());
        assertEquals(OrderItem.SELLER_TYPE_FARMER, saved.getSellerType());
        assertEquals(FARMER_ID, saved.getFarmer().getId());
        // And symmetrically, the collected-farmer slot must stay empty.
        assertNull(saved.getCollectedFarmer());
    }

    @Test
    void onAMixedSellerOrderEachReviewIsFiledAgainstItsOwnSeller() {
        Order order = deliveredOrder();
        addFarmerLine(order, "Wheat");
        addCollectedLine(order, "Rice");
        givenBuyer();
        givenOrder(order);
        when(reviewRepository.findByOrderIdAndSellerKey(ORDER_ID, "FARMER:2")).thenReturn(Optional.empty());
        when(userRepository.getReferenceById(FARMER_ID)).thenReturn(farmer());
        when(reviewRepository.saveAndFlush(any(Review.class))).thenAnswer(i -> i.getArgument(0));

        reviewService.createReview(request("FARMER:2", 5), "buyer@example.test");

        assertEquals(FARMER_ID, capturedReview().getFarmer().getId());
        assertNull(capturedReview().getCollectedFarmer());
    }

    @Test
    void aMixedSellerOrderGivesEachSellerTheirOwnReviewSlot() {
        Order order = deliveredOrder();
        addFarmerLine(order, "Wheat");
        addCollectedLine(order, "Rice");
        givenBuyer();
        givenOrder(order);
        when(reviewRepository.findByOrderId(ORDER_ID)).thenReturn(List.of());

        OrderReviewTargetsResponse targets = reviewService.getReviewTargets(ORDER_ID, "buyer@example.test");

        assertTrue(targets.isReviewable());
        assertEquals(2, targets.getTargets().size());
        assertEquals(List.of("FARMER:2", "COLLECTED_FARMER:9"),
                targets.getTargets().stream().map(t -> t.getSellerKey()).toList());
        assertEquals(List.of("Mithun F", "Collected Ram"),
                targets.getTargets().stream().map(t -> t.getSellerName()).toList());
        assertTrue(targets.getTargets().stream().allMatch(t -> !t.isAlreadyReviewed()));
    }

    @Test
    void reviewTargetsMergeOneSellersSeveralLinesAndRememberWhatWasReviewed() {
        Order order = deliveredOrder();
        addFarmerLine(order, "Wheat");
        addFarmerLine(order, "Wheat");
        addCollectedLine(order, "Rice");
        givenBuyer();
        givenOrder(order);
        when(reviewRepository.findByOrderId(ORDER_ID)).thenReturn(List.of(
                Review.builder().id(70L).order(order).sellerKey("FARMER:2").build()));

        OrderReviewTargetsResponse targets = reviewService.getReviewTargets(ORDER_ID, "buyer@example.test");

        assertEquals(2, targets.getTargets().size());
        assertEquals(List.of("Wheat"), targets.getTargets().get(0).getCropNames());
        assertTrue(targets.getTargets().get(0).isAlreadyReviewed());
        assertEquals(70L, targets.getTargets().get(0).getReviewId());
        assertFalse(targets.getTargets().get(1).isAlreadyReviewed());
    }

    @Test
    void anOldOrderWrittenBeforeSellerTypeWasRecordedIsStillAttributed() {
        Order order = deliveredOrder();
        // A legacy line: sellerType was never populated, but the farmer foreign key is there.
        OrderItem legacy = OrderItem.builder().cropName("Millet").farmer(farmer()).build();
        order.addItem(legacy);
        givenBuyer();
        givenOrder(order);
        when(reviewRepository.findByOrderId(ORDER_ID)).thenReturn(List.of());

        OrderReviewTargetsResponse targets = reviewService.getReviewTargets(ORDER_ID, "buyer@example.test");

        assertEquals(1, targets.getTargets().size());
        assertEquals("FARMER:2", targets.getTargets().get(0).getSellerKey());
        assertEquals(OrderItem.SELLER_TYPE_FARMER, targets.getTargets().get(0).getSellerType());
    }

    @Test
    void anOrderLineWhoseSellerWasDeletedIsNotOfferedForReview() {
        Order order = deliveredOrder();
        OrderItem orphan = OrderItem.builder().cropName("Ghost Crop").build();
        order.addItem(orphan);
        givenBuyer();
        givenOrder(order);
        when(reviewRepository.findByOrderId(ORDER_ID)).thenReturn(List.of());

        OrderReviewTargetsResponse targets = reviewService.getReviewTargets(ORDER_ID, "buyer@example.test");

        assertTrue(targets.getTargets().isEmpty());
        assertFalse(targets.isReviewable());
        assertEquals("This order has no seller to review.", targets.getReason());
    }

    @Test
    void reviewTargetsExplainWhyAnUndeliveredOrderCannotBeReviewed() {
        Order order = order(Order.STATUS_SHIPPED);
        addFarmerLine(order, "Wheat");
        givenBuyer();
        givenOrder(order);
        when(reviewRepository.findByOrderId(ORDER_ID)).thenReturn(List.of());

        OrderReviewTargetsResponse targets = reviewService.getReviewTargets(ORDER_ID, "buyer@example.test");

        assertFalse(targets.isReviewable());
        assertEquals("You can review this order once it has been delivered.", targets.getReason());
        assertEquals(1, targets.getTargets().size());
    }

    // --- the scorecards -------------------------------------------------------------------

    @Test
    void aFarmerScorecardAveragesCountsAndGroupsTheirOwnReviewsOnly() {
        when(userRepository.findByEmail("farmer@example.test")).thenReturn(Optional.of(farmer()));
        when(reviewRepository.findTop50ByFarmer_IdOrderByCreatedAtDesc(FARMER_ID))
                .thenReturn(List.of(Review.builder().id(1L).farmer(farmer()).rating(5).build()));
        // Five 5-star and two 4-star reviews: 33 / 7 = 4.714..., shown as 4.7.
        when(reviewRepository.ratingBreakdownForFarmer(FARMER_ID))
                .thenReturn(breakdown(5, 5L, 4, 2L));

        SellerReviewSummaryResponse summary =
                reviewService.getReviewsReceivedByFarmer("farmer@example.test");

        assertEquals(4.7d, summary.getAverageRating());
        assertEquals(7L, summary.getTotalReviews());
        assertEquals(Map.of(4, 2L, 5, 5L), summary.getRatingBreakdown());
        assertEquals("Mithun F", summary.getSellerName());
    }

    @Test
    void anAverageIsRoundedToOneDecimalPlace() {
        when(userRepository.findByEmail("farmer@example.test")).thenReturn(Optional.of(farmer()));
        when(reviewRepository.findTop50ByFarmer_IdOrderByCreatedAtDesc(FARMER_ID)).thenReturn(List.of());
        // 17 / 4 = 4.25, which must not be shown as a bare 4.25 or truncated to 4.2.
        when(reviewRepository.ratingBreakdownForFarmer(FARMER_ID))
                .thenReturn(breakdown(5, 2L, 4, 1L, 3, 1L));

        assertEquals(4.3d,
                reviewService.getReviewsReceivedByFarmer("farmer@example.test").getAverageRating());
    }

    @Test
    void aScorecardIsScopedToTheRegisteredFarmerForeignKeySoCollectedReviewsCannotLeak() {
        when(userRepository.findByEmail("farmer@example.test")).thenReturn(Optional.of(farmer()));
        when(reviewRepository.findTop50ByFarmer_IdOrderByCreatedAtDesc(FARMER_ID)).thenReturn(List.of());
        when(reviewRepository.ratingBreakdownForFarmer(FARMER_ID)).thenReturn(List.of());

        reviewService.getReviewsReceivedByFarmer("farmer@example.test");

        // Both the list and the aggregate filter on farmer.id, which a collected-farmer review
        // never sets - so the two can never be mixed up.
        verify(reviewRepository).findTop50ByFarmer_IdOrderByCreatedAtDesc(FARMER_ID);
        verify(reviewRepository).ratingBreakdownForFarmer(FARMER_ID);
        verify(reviewRepository, never()).findTop50ByCollectedFarmer_IdOrderByCreatedAtDesc(any());
        verify(reviewRepository, never()).ratingBreakdownForCollectedFarmer(any());
    }

    @Test
    void aFarmerWithNoReviewsScoresZeroRatherThanFailing() {
        when(userRepository.findByEmail("farmer@example.test")).thenReturn(Optional.of(farmer()));
        when(reviewRepository.findTop50ByFarmer_IdOrderByCreatedAtDesc(FARMER_ID)).thenReturn(List.of());
        when(reviewRepository.ratingBreakdownForFarmer(FARMER_ID)).thenReturn(List.of());

        SellerReviewSummaryResponse summary =
                reviewService.getReviewsReceivedByFarmer("farmer@example.test");

        assertEquals(0d, summary.getAverageRating());
        assertEquals(0L, summary.getTotalReviews());
    }

    @Test
    void aNonFarmerCannotReadAFarmerScorecard() {
        when(userRepository.findByEmail("buyer@example.test")).thenReturn(Optional.of(buyer()));

        CustomException ex = assertThrows(CustomException.class,
                () -> reviewService.getReviewsReceivedByFarmer("buyer@example.test"));

        assertEquals(HttpStatus.FORBIDDEN, ex.getStatus());
    }

    @Test
    void aCoordinatorCanReadTheScorecardOfACollectedFarmerTheyCollected() {
        when(userRepository.findByEmail("coord@example.test")).thenReturn(Optional.of(coordinator()));
        when(collectedFarmerRepository.findById(COLLECTED_ID))
                .thenReturn(Optional.of(collectedFarmer(coordinator())));
        when(reviewRepository.findTop50ByCollectedFarmer_IdOrderByCreatedAtDesc(COLLECTED_ID))
                .thenReturn(List.of());
        when(reviewRepository.ratingBreakdownForCollectedFarmer(COLLECTED_ID))
                .thenReturn(breakdown(2, 2L));

        SellerReviewSummaryResponse summary = reviewService
                .getReviewsReceivedByCollectedFarmer(COLLECTED_ID, "coord@example.test");

        assertEquals(2d, summary.getAverageRating());
        assertEquals(2L, summary.getTotalReviews());
        assertEquals("Collected Ram", summary.getSellerName());
        assertEquals(OrderItem.SELLER_TYPE_COLLECTED_FARMER, summary.getSellerType());
    }

    @Test
    void aCoordinatorCannotReadTheScorecardOfSomebodyElsesCollectedFarmer() {
        User otherCoordinator = User.builder().id(4L).email("other@example.test")
                .role(role("ROLE_MIDDLEMAN")).build();
        when(userRepository.findByEmail("other@example.test")).thenReturn(Optional.of(otherCoordinator));
        when(collectedFarmerRepository.findById(COLLECTED_ID))
                .thenReturn(Optional.of(collectedFarmer(coordinator())));

        CustomException ex = assertThrows(CustomException.class, () -> reviewService
                .getReviewsReceivedByCollectedFarmer(COLLECTED_ID, "other@example.test"));

        assertEquals(HttpStatus.FORBIDDEN, ex.getStatus());
        verify(reviewRepository, never())
                .findTop50ByCollectedFarmer_IdOrderByCreatedAtDesc(any());
    }

    // --- editing -------------------------------------------------------------------------

    @Test
    void aBuyerCannotEditSomebodyElsesReview() {
        when(userRepository.findByEmail("buyer@example.test")).thenReturn(Optional.of(buyer()));
        Review someoneElses = Review.builder().id(70L).buyer(user(99L, "Other", "Buyer", "o@x.test"))
                .rating(1).build();
        when(reviewRepository.findById(70L)).thenReturn(Optional.of(someoneElses));

        CustomException ex = assertThrows(CustomException.class,
                () -> reviewService.updateReview(70L, UpdateReviewRequest.builder().rating(5).build(),
                        "buyer@example.test"));

        assertEquals(HttpStatus.FORBIDDEN, ex.getStatus());
        verify(reviewRepository, never()).saveAndFlush(any());
    }

    @Test
    void editingAOwnReviewReplacesTheRatingAndTrimsTheComment() {
        User buyer = buyer();
        when(userRepository.findByEmail("buyer@example.test")).thenReturn(Optional.of(buyer));
        Review existing = Review.builder().id(70L).buyer(buyer).rating(1).comment("  Good  ").build();
        when(reviewRepository.findById(70L)).thenReturn(Optional.of(existing));
        when(reviewRepository.saveAndFlush(any(Review.class))).thenAnswer(i -> i.getArgument(0));

        reviewService.updateReview(70L,
                UpdateReviewRequest.builder().rating(5).comment("  Fresh and clean  ").build(),
                "buyer@example.test");

        assertEquals(5, existing.getRating());
        assertEquals("Fresh and clean", existing.getComment());
    }

    @Test
    void aBlankCommentIsStoredAsNoComment() {
        User buyer = buyer();
        Review existing = Review.builder().id(70L).buyer(buyer).rating(3).comment("old").build();
        when(userRepository.findByEmail("buyer@example.test")).thenReturn(Optional.of(buyer));
        when(reviewRepository.findById(70L)).thenReturn(Optional.of(existing));
        when(reviewRepository.saveAndFlush(any(Review.class))).thenAnswer(i -> i.getArgument(0));

        reviewService.updateReview(70L,
                UpdateReviewRequest.builder().rating(3).comment("   ").build(), "buyer@example.test");

        assertNull(existing.getComment());
    }

    @Test
    void anEditingReviewIsMarkedAsEdited() {
        User buyer = buyer();
        java.time.LocalDateTime created = java.time.LocalDateTime.now().minusDays(2);
        java.time.LocalDateTime updated = java.time.LocalDateTime.now();
        Review existing = Review.builder().id(70L).buyer(buyer).rating(3)
                .createdAt(created).updatedAt(updated).build();
        when(userRepository.findByEmail("buyer@example.test")).thenReturn(Optional.of(buyer));
        when(reviewRepository.findById(70L)).thenReturn(Optional.of(existing));
        when(reviewRepository.saveAndFlush(any(Review.class))).thenAnswer(i -> i.getArgument(0));

        assertTrue(reviewService.updateReview(70L,
                UpdateReviewRequest.builder().rating(4).build(), "buyer@example.test").isEdited());
    }

    /**
     * The edit path must flush before building the response. JPA stamps {@code updatedAt} in
     * {@code @PreUpdate}, which only runs during a flush, so a plain save() would hand back the
     * pre-edit timestamp and the UI would show an edited review as never edited.
     *
     * <p>The stub mirrors the real repository: only the flush stamps {@code updatedAt}, so a
     * regression to a plain save() leaves the response on the original timestamp and the
     * timestamp assertion below fails, naming the defect directly.
     */
    @Test
    void editingFlushesSoTheResponseCarriesTheNewTimestamp() {
        User buyer = buyer();
        java.time.LocalDateTime created = java.time.LocalDateTime.now().minusDays(2);
        Review existing = Review.builder().id(70L).buyer(buyer).rating(3).createdAt(created).build();
        when(userRepository.findByEmail("buyer@example.test")).thenReturn(Optional.of(buyer));
        when(reviewRepository.findById(70L)).thenReturn(Optional.of(existing));
        when(reviewRepository.saveAndFlush(any(Review.class))).thenAnswer(i -> {
            Review saved = i.getArgument(0);
            saved.setUpdatedAt(java.time.LocalDateTime.now());
            return saved;
        });

        ReviewResponse response = reviewService.updateReview(70L,
                UpdateReviewRequest.builder().rating(4).build(), "buyer@example.test");

        assertTrue(response.getUpdatedAt().isAfter(created),
                "the edit response must carry a timestamp newer than the original created time");
        assertTrue(response.isEdited(), "an edited review must be reported as edited");
    }

    /** Creation flushes for the same reason: the response is built from the flushed row. */
    @Test
    void creatingFlushesSoTheResponseCarriesTheCreatedTimestamp() {
        Order order = deliveredOrder();
        addFarmerLine(order, "Wheat");
        givenBuyer();
        givenOrder(order);
        when(userRepository.getReferenceById(FARMER_ID)).thenReturn(farmer());
        when(reviewRepository.saveAndFlush(any(Review.class))).thenAnswer(i -> {
            Review saved = i.getArgument(0);
            java.time.LocalDateTime now = java.time.LocalDateTime.now();
            saved.setCreatedAt(now);
            saved.setUpdatedAt(now);
            return saved;
        });

        assertNotNull(reviewService.createReview(request("FARMER:" + FARMER_ID, 4),
                "buyer@example.test"));
    }

    @Test
    void aRatingOutsideOneToFiveIsRejectedOnEditToo() {
        when(userRepository.findByEmail("buyer@example.test")).thenReturn(Optional.of(buyer()));

        CustomException ex = assertThrows(CustomException.class,
                () -> reviewService.updateReview(70L, UpdateReviewRequest.builder().rating(7).build(),
                        "buyer@example.test"));

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
    }

    // --- helpers -------------------------------------------------------------------------

    /** The {@link Review} that was actually handed to the repository. */
    private Review capturedReview() {
        ArgumentCaptor<Review> captor = ArgumentCaptor.forClass(Review.class);
        verify(reviewRepository).saveAndFlush(captor.capture());
        return captor.getValue();
    }
}
