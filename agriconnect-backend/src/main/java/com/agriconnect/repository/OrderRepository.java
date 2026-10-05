package com.agriconnect.repository;

import com.agriconnect.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    List<Order> findByBuyerIdOrderByCreatedAtDesc(Long buyerId);

    /** Ownership-scoped lookup so one buyer can never read another buyer's order by id. */
    Optional<Order> findByIdAndBuyerId(Long id, Long buyerId);

    /**
     * Orders that contain at least one crop owned by the given farmer. Callers must still
     * filter the items down to that farmer's own lines before returning them.
     */
    @Query("SELECT DISTINCT o FROM Order o JOIN o.items i WHERE i.farmer.id = :farmerId ORDER BY o.createdAt DESC")
    List<Order> findOrdersForFarmer(@Param("farmerId") Long farmerId);

    /**
     * Orders that contain at least one crop belonging to any CollectedFarmer collected by the
     * given coordinator (middleman). Callers must still trim items to that coordinator's
     * collected farmers before returning them.
     */
    @Query("SELECT DISTINCT o FROM Order o JOIN o.items i WHERE i.collectedFarmer.collectedBy.id = :coordinatorId ORDER BY o.createdAt DESC")
    List<Order> findOrdersForCoordinator(@Param("coordinatorId") Long coordinatorId);

    List<Order> findAllByOrderByCreatedAtDesc();
}
