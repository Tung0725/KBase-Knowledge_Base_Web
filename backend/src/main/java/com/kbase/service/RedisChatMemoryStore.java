package com.kbase.service;

import dev.langchain4j.data.message.ChatMessage;
import dev.langchain4j.data.message.ChatMessageDeserializer;
import dev.langchain4j.data.message.ChatMessageSerializer;
import dev.langchain4j.store.memory.chat.ChatMemoryStore;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.List;
import java.util.Optional;

/**
 * Distributed ChatMemoryStore implementation backed by Redis,
 * enabling persistent and horizontally scalable conversation memory across cluster nodes.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class RedisChatMemoryStore implements ChatMemoryStore {

    private static final String KEY_PREFIX = "kbase:chat:memory:";
    private static final Duration DEFAULT_TTL = Duration.ofDays(7);

    private final Optional<StringRedisTemplate> stringRedisTemplate;

    /**
     * Retrieves the serialized list of LangChain4j chat messages from Redis for a given memory session.
     *
     * @param memoryId unique identifier of the conversation session
     * @return list of reconstructed chat messages, or empty list if not found or Redis is unreachable
     */
    @Override
    public List<ChatMessage> getMessages(Object memoryId) {
        if (memoryId == null || stringRedisTemplate.isEmpty()) {
            return List.of();
        }

        try {
            String key = KEY_PREFIX + memoryId;
            String json = stringRedisTemplate.get().opsForValue().get(key);
            if (json == null || json.isBlank()) {
                return List.of();
            }
            return ChatMessageDeserializer.messagesFromJson(json);
        } catch (Exception e) {
            log.warn("[Redis Memory] Không thể đọc lịch sử trò chuyện từ Redis cho session {}: {}", memoryId, e.getMessage());
            return List.of();
        }
    }

    /**
     * Serializes and persists updated chat messages into Redis with a 7-day expiration time.
     *
     * @param memoryId unique identifier of the conversation session
     * @param messages list of chat messages to persist
     */
    @Override
    public void updateMessages(Object memoryId, List<ChatMessage> messages) {
        if (memoryId == null || messages == null || stringRedisTemplate.isEmpty()) {
            return;
        }

        try {
            String key = KEY_PREFIX + memoryId;
            String json = ChatMessageSerializer.messagesToJson(messages);
            stringRedisTemplate.get().opsForValue().set(key, json, DEFAULT_TTL);
        } catch (Exception e) {
            log.warn("[Redis Memory] Không thể lưu lịch sử trò chuyện vào Redis cho session {}: {}", memoryId, e.getMessage());
        }
    }

    /**
     * Evicts the conversation session memory from Redis.
     *
     * @param memoryId unique identifier of the conversation session
     */
    @Override
    public void deleteMessages(Object memoryId) {
        if (memoryId == null || stringRedisTemplate.isEmpty()) {
            return;
        }

        try {
            String key = KEY_PREFIX + memoryId;
            stringRedisTemplate.get().delete(key);
        } catch (Exception e) {
            log.warn("[Redis Memory] Không thể xóa lịch sử trò chuyện trong Redis cho session {}: {}", memoryId, e.getMessage());
        }
    }
}
