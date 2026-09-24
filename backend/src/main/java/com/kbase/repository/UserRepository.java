package com.kbase.repository;

import com.kbase.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);


    @Query("SELECT u FROM User u WHERE u.isDeleted = false " +
           "AND (:role IS NULL OR u.role = :role) " +
           "AND (:isLocked IS NULL OR u.isLocked = :isLocked) " +
           "AND (:keyword = '' OR LOWER(u.email) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    org.springframework.data.domain.Page<User> searchUsers(@Param("keyword") String keyword, @Param("role") User.Role role, @Param("isLocked") Boolean isLocked, org.springframework.data.domain.Pageable pageable);
}
