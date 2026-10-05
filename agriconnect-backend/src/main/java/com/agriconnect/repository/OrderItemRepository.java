package com.agriconnect.repository;

import com.agriconnect.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    List<OrderItem> findByOrderId(Long orderId);

    List<OrderItem> findByOrderIdAndFarmerId(Long orderId, Long farmerId);

    List<OrderItem> findByOrderIdAndCollectedFarmer_CollectedBy_Id(Long orderId, Long coordinatorId);

    /**
     * Every order line belonging to one registered farmer account, newest first, with the parent
     * order and its buyer fetched in the same query to avoid a lazy-load per row.
     *
     * <p>Sold to the farmer's sales dashboard. The predicate is {@code i.farmer.id = :farmerId},
     * which is the same ownership scope Orders Received already uses. A line sold by a collected
     * farmer has {@code farmer} null and {@code collectedFarmer} set (applySellerAttribution sets
     * exactly one of the two), so those lines can never appear in this result.
     */
    @Query("SELECT i FROM OrderItem i JOIN FETCH i.order o JOIN FETCH o.buyer "
            + "WHERE i.farmer.id = :farmerId ORDER BY i.createdAt DESC, i.id DESC")
    List<OrderItem> findSalesLinesForFarmer(@Param("farmerId") Long farmerId);
}
