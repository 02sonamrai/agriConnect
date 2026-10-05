package com.agriconnect.repository;

import com.agriconnect.entity.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CartItemRepository extends JpaRepository<CartItem, Long> {

    List<CartItem> findByBuyerIdOrderByIdAsc(Long buyerId);

    /** Ownership-scoped lookup: a cart item is only ever reachable through its own buyer. */
    Optional<CartItem> findByIdAndBuyerId(Long id, Long buyerId);

    Optional<CartItem> findByBuyerIdAndCropId(Long buyerId, Long cropId);

    long countByBuyerId(Long buyerId);
}
