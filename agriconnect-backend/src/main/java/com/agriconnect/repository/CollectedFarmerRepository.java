package com.agriconnect.repository;

import com.agriconnect.entity.CollectedFarmer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface CollectedFarmerRepository extends JpaRepository<CollectedFarmer, Long> {

    List<CollectedFarmer> findByCollectedById(Long middlemanId);

    List<CollectedFarmer> findByCollectedByEmail(String email);

    Optional<CollectedFarmer> findByIdAndCollectedByEmail(Long id, String email);

    Optional<CollectedFarmer> findByIdAndCollectedById(Long id, Long middlemanId);

    long countByCollectedByEmail(String email);

    long countByCollectedByEmailAndCreatedAtGreaterThanEqual(String email, LocalDateTime startOfDay);

    @Query("SELECT COUNT(DISTINCT cf.village) FROM CollectedFarmer cf WHERE cf.collectedBy.email = :email")
    long countDistinctVillagesByEmail(@Param("email") String email);

    @Query("SELECT COUNT(DISTINCT cf.primaryCrop) FROM CollectedFarmer cf WHERE cf.collectedBy.email = :email")
    long countDistinctCropsByEmail(@Param("email") String email);

    @Query("SELECT COUNT(DISTINCT cf.village) FROM CollectedFarmer cf")
    long countDistinctVillagesAll();

    @Query("SELECT COUNT(DISTINCT cf.primaryCrop) FROM CollectedFarmer cf")
    long countDistinctCropsAll();

    @Query("SELECT COUNT(cf) FROM CollectedFarmer cf WHERE cf.createdAt >= :startOfDay")
    long countAllAddedToday(@Param("startOfDay") LocalDateTime startOfDay);
}
