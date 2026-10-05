package com.agriconnect.repository;

import com.agriconnect.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    /** Backs the database unique index on (order, seller); also used for a friendly 409. */
    Optional<Review> findByOrderIdAndSellerKey(Long orderId, String sellerKey);

    /** Everything the buyer wrote for one order, so already-reviewed sellers can be marked. */
    @Query("SELECT r FROM Review r WHERE r.order.id = :orderId")
    List<Review> findByOrderId(@Param("orderId") Long orderId);

    /** The buyer's own submissions, newest first. Capped so a long history stays a bounded page. */
    List<Review> findTop100ByBuyer_IdOrderByCreatedAtDesc(Long buyerId);

    /**
     * Recent reviews a registered farmer received. {@code farmer.id} is the registered-farmer
     * foreign key only, so it can never pick up a collected farmer's review.
     */
    List<Review> findTop50ByFarmer_IdOrderByCreatedAtDesc(Long farmerId);

    /** Recent reviews a collected farmer received. */
    List<Review> findTop50ByCollectedFarmer_IdOrderByCreatedAtDesc(Long collectedFarmerId);

    /**
     * Star distribution for a registered farmer as {@code [rating, count]} rows.
     *
     * <p>The scorecard's average, total and breakdown are all derived from this one result so the
     * figures cannot disagree with each other, and they stay correct even though the review list
     * itself is capped.
     */
    @Query("SELECT r.rating, COUNT(r) FROM Review r WHERE r.farmer.id = :farmerId GROUP BY r.rating")
    List<Object[]> ratingBreakdownForFarmer(@Param("farmerId") Long farmerId);

    @Query("SELECT r.rating, COUNT(r) FROM Review r "
            + "WHERE r.collectedFarmer.id = :collectedFarmerId GROUP BY r.rating")
    List<Object[]> ratingBreakdownForCollectedFarmer(@Param("collectedFarmerId") Long collectedFarmerId);
}
