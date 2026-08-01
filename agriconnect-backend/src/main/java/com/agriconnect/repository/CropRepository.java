package com.agriconnect.repository;

import com.agriconnect.entity.Crop;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface CropRepository extends JpaRepository<Crop, Long> {
    List<Crop> findByFarmerId(Long farmerId);
    Optional<Crop> findByIdAndFarmerId(Long id, Long farmerId);
}
