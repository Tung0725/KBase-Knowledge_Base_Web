package com.kbase.repository;

import com.kbase.entity.ChatSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ChatSessionRepository extends JpaRepository<ChatSession, UUID> {

    @Query("SELECT s FROM ChatSession s WHERE s.projectId = :projectId AND s.userId = :userId " +
           "ORDER BY s.pinned DESC, s.pinnedAt DESC NULLS LAST, COALESCE(s.lastActivityAt, s.updatedAt, s.createdAt) DESC")
    List<ChatSession> findByProjectIdAndUserIdOrderByPinnedDescUpdatedAtDesc(@Param("projectId") UUID projectId, @Param("userId") UUID userId);

    Optional<ChatSession> findByIdAndUserId(UUID id, UUID userId);

    void deleteAllByProjectId(UUID projectId);
}
