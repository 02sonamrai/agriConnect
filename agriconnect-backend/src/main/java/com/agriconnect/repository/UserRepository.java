package com.agriconnect.repository;

import com.agriconnect.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Boolean existsByEmail(String email);
    Boolean existsByPhoneNumber(String phoneNumber);

    List<User> findByRoleName(String roleName);

    @Query("SELECT u FROM User u WHERE (u.role.name = 'FARMER' OR u.role.name = 'ROLE_FARMER') AND " +
           "(:query IS NULL OR :query = '' OR " +
           "LOWER(u.firstName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(u.lastName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(u.email) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "u.phoneNumber LIKE CONCAT('%', :query, '%'))")
    List<User> searchFarmers(@Param("query") String query);
}
