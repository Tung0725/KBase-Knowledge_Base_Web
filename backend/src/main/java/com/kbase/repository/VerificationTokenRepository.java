package com.kbase.repository;

import com.kbase.entity.VerificationToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface VerificationTokenRepository extends JpaRepository<VerificationToken, UUID> {
    Optional<VerificationToken> findByToken(String token);
    
    void deleteByUser_Id(UUID userId);

    @Modifying
    @Query("DELETE FROM VerificationToken v WHERE v.expiryDate < :time")
    void deleteExpiredTokens(@Param("time") LocalDateTime time);
}
