package com.kbase.repository;

import com.kbase.entity.ChatMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, UUID> {
    List<ChatMessage> findByProjectIdAndUserIdOrderByCreatedAtAsc(UUID projectId, UUID userId);

    List<ChatMessage> findBySessionIdOrderByCreatedAtAsc(UUID sessionId);

    Page<ChatMessage> findBySessionIdOrderByCreatedAtDesc(UUID sessionId, Pageable pageable);

    long countBySessionId(UUID sessionId);

    void deleteAllBySessionId(UUID sessionId);

    void deleteBySessionIdAndCreatedAtGreaterThanEqual(UUID sessionId, java.time.LocalDateTime createdAt);

    void deleteAllByProjectId(UUID projectId);
}
