package com.agriconnect.controller;

import com.agriconnect.config.SecurityConfig;
import com.agriconnect.dto.OrderReviewTargetResponse;
import com.agriconnect.dto.OrderReviewTargetsResponse;
import com.agriconnect.dto.ReviewResponse;
import com.agriconnect.dto.SellerReviewSummaryResponse;
import com.agriconnect.security.CustomUserDetailsService;
import com.agriconnect.security.JwtAuthenticationFilter;
import com.agriconnect.service.ReviewService;
import com.agriconnect.util.JwtUtil;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Role authorization for reviews happens per action in ReviewServiceImpl, not at the URL, because
 * "who may write" and "who may read which scorecard" are different questions. These tests cover the
 * URL half - the prefix is authenticated for every role, and the request bodies are validated -
 * and leave the ownership rules to ReviewServiceImplTest.
 */
@WebMvcTest(ReviewController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class})
class ReviewControllerSecurityTest {

    @Autowired
    private MockMvc mvc;

    @MockBean
    private ReviewService reviewService;
    @MockBean
    private JwtUtil jwtUtil;
    @MockBean
    private CustomUserDetailsService userDetailsService;

    private static final String VALID_BODY = """
            {"orderId":500,"sellerKey":"COLLECTED_FARMER:9","rating":5,"comment":"Fresh produce"}
            """;

    private ReviewResponse review() {
        return ReviewResponse.builder()
                .id(70L).orderId(500L).orderNumber("ORD-000500")
                .sellerType("COLLECTED_FARMER").sellerKey("COLLECTED_FARMER:9")
                .sellerName("Collected Ram").rating(5).comment("Fresh produce")
                .buyerName("Bela Buyer").build();
    }

    @Test
    void anAnonymousCallerCannotTouchReviews() throws Exception {
        // 403 rather than 401: this app sets no authentication entry point, so every protected
        // endpoint rejects anonymous callers this way.
        mvc.perform(get("/api/reviews/mine")).andExpect(status().isForbidden());
        mvc.perform(get("/api/reviews/order/500/targets")).andExpect(status().isForbidden());
        mvc.perform(get("/api/reviews/received/farmer")).andExpect(status().isForbidden());
        mvc.perform(post("/api/reviews").contentType(MediaType.APPLICATION_JSON).content(VALID_BODY))
                .andExpect(status().isForbidden());
        mvc.perform(put("/api/reviews/70").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"rating\":4}"))
                .andExpect(status().isForbidden());
        verifyNoInteractions(reviewService);
    }

    // Every role is allowed past the URL rule; who may actually read or write is decided per
    // action in ReviewServiceImpl. Written out per role rather than parameterised because
    // @WithMockUser does not install a security context on a @ParameterizedTest here, which
    // would make these assertions pass or fail for the wrong reason.

    @Test
    @WithMockUser(authorities = "ROLE_BUYER")
    void aBuyerReachesThePrefix() throws Exception {
        when(reviewService.getMyReviews(anyString())).thenReturn(List.of(review()));
        mvc.perform(get("/api/reviews/mine")).andExpect(status().isOk());
    }

    @Test
    @WithMockUser(authorities = "ROLE_FARMER")
    void aFarmerReachesThePrefix() throws Exception {
        when(reviewService.getMyReviews(anyString())).thenReturn(List.of(review()));
        mvc.perform(get("/api/reviews/mine")).andExpect(status().isOk());
    }

    @Test
    @WithMockUser(authorities = "ROLE_MIDDLEMAN")
    void aCoordinatorReachesThePrefix() throws Exception {
        when(reviewService.getMyReviews(anyString())).thenReturn(List.of(review()));
        mvc.perform(get("/api/reviews/mine")).andExpect(status().isOk());
    }

    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void anAdminReachesThePrefix() throws Exception {
        when(reviewService.getMyReviews(anyString())).thenReturn(List.of(review()));
        mvc.perform(get("/api/reviews/mine")).andExpect(status().isOk());
    }

    @Test
    @WithMockUser(authorities = "ROLE_BUYER")
    void aBuyerSeesTheirOwnReviewTargets() throws Exception {
        when(reviewService.getReviewTargets(eq(500L), anyString())).thenReturn(
                OrderReviewTargetsResponse.builder()
                        .orderId(500L).orderNumber("ORD-000500").orderStatus("DELIVERED")
                        .reviewable(true)
                        .targets(List.of(OrderReviewTargetResponse.builder()
                                .sellerKey("COLLECTED_FARMER:9")
                                .sellerType("COLLECTED_FARMER")
                                .sellerName("Collected Ram")
                                .cropNames(List.of("Rice"))
                                .alreadyReviewed(false)
                                .build()))
                        .build());

        mvc.perform(get("/api/reviews/order/500/targets"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.reviewable").value(true))
                .andExpect(jsonPath("$.targets[0].sellerKey").value("COLLECTED_FARMER:9"))
                .andExpect(jsonPath("$.targets[0].alreadyReviewed").value(false));
    }

    @Test
    @WithMockUser(authorities = "ROLE_FARMER")
    void aFarmerReadsTheirOwnScorecard() throws Exception {
        when(reviewService.getReviewsReceivedByFarmer(anyString())).thenReturn(
                SellerReviewSummaryResponse.builder()
                        .sellerType("FARMER").sellerKey("FARMER:2").sellerName("Mithun F")
                        .averageRating(4.5).totalReviews(2L)
                        .ratingBreakdown(Map.of(4, 1L, 5, 1L))
                        .reviews(List.of(review()))
                        .build());

        mvc.perform(get("/api/reviews/received/farmer"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.averageRating").value(4.5))
                .andExpect(jsonPath("$.totalReviews").value(2));
    }

    @Test
    @WithMockUser(authorities = "ROLE_MIDDLEMAN")
    void aCoordinatorReadsACollectedFarmersScorecard() throws Exception {
        when(reviewService.getReviewsReceivedByCollectedFarmer(eq(9L), anyString())).thenReturn(
                SellerReviewSummaryResponse.builder()
                        .sellerType("COLLECTED_FARMER").sellerKey("COLLECTED_FARMER:9")
                        .sellerName("Collected Ram").averageRating(2.0).totalReviews(1L).build());

        mvc.perform(get("/api/reviews/received/collected-farmer/9"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sellerType").value("COLLECTED_FARMER"));
    }

    @Test
    @WithMockUser(authorities = "ROLE_BUYER")
    void aBuyerSubmitsAReview() throws Exception {
        when(reviewService.createReview(any(), anyString())).thenReturn(review());

        mvc.perform(post("/api/reviews").contentType(MediaType.APPLICATION_JSON).content(VALID_BODY))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sellerKey").value("COLLECTED_FARMER:9"));
    }

    @ParameterizedTest
    @ValueSource(ints = {0, 6, -1, 99})
    @WithMockUser(authorities = "ROLE_BUYER")
    void aRatingOutsideOneToFiveIsRejectedBeforeTheService(int rating) throws Exception {
        mvc.perform(post("/api/reviews").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"orderId\":500,\"sellerKey\":\"FARMER:2\",\"rating\":" + rating + "}"))
                .andExpect(status().isBadRequest());
        verify(reviewService, never()).createReview(any(), anyString());
    }

    @Test
    @WithMockUser(authorities = "ROLE_BUYER")
    void aReviewWithoutARatingIsRejected() throws Exception {
        mvc.perform(post("/api/reviews").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"orderId\":500,\"sellerKey\":\"FARMER:2\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(authorities = "ROLE_BUYER")
    void aReviewWithoutASellerIsRejected() throws Exception {
        mvc.perform(post("/api/reviews").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"orderId\":500,\"rating\":4}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(authorities = "ROLE_BUYER")
    void anOverlongCommentIsRejected() throws Exception {
        mvc.perform(post("/api/reviews").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"orderId\":500,\"sellerKey\":\"FARMER:2\",\"rating\":4,\"comment\":\""
                                + "x".repeat(501) + "\"}"))
                .andExpect(status().isBadRequest());
        verify(reviewService, never()).createReview(any(), anyString());
    }

    @Test
    @WithMockUser(authorities = "ROLE_BUYER")
    void aBuyerEditsTheirOwnReview() throws Exception {
        when(reviewService.updateReview(eq(70L), any(), anyString())).thenReturn(review());

        mvc.perform(put("/api/reviews/70").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"rating\":4,\"comment\":\"Updated\"}"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(authorities = "ROLE_BUYER")
    void editingWithoutARatingIsRejected() throws Exception {
        mvc.perform(put("/api/reviews/70").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"comment\":\"Updated\"}"))
                .andExpect(status().isBadRequest());
        verify(reviewService, never()).updateReview(anyLong(), any(), anyString());
    }
}
