package com.kbase.service;

import dev.langchain4j.data.message.AiMessage;
import dev.langchain4j.data.message.ChatMessage;
import dev.langchain4j.data.message.UserMessage;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.time.Duration;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RedisChatMemoryStoreTest {

    @Mock
    private StringRedisTemplate stringRedisTemplate;

    @Mock
    private ValueOperations<String, String> valueOperations;

    @Test
    @DisplayName("Kiểm tra khi không có RedisTemplate thì getMessages trả về danh sách rỗng an toàn")
    void testGetMessages_whenRedisAbsent_returnsEmptyList() {
        RedisChatMemoryStore store = new RedisChatMemoryStore(Optional.empty());

        List<ChatMessage> messages = store.getMessages("session-1");

        assertTrue(messages.isEmpty());
    }

    @Test
    @DisplayName("Kiểm tra lưu trữ và khôi phục tin nhắn thành công qua Redis")
    void testUpdateAndGetMessages_success() {
        when(stringRedisTemplate.opsForValue()).thenReturn(valueOperations);

        RedisChatMemoryStore store = new RedisChatMemoryStore(Optional.of(stringRedisTemplate));

        List<ChatMessage> originalMessages = List.of(
                UserMessage.from("Xin chào"),
                AiMessage.from("Chào bạn, tôi có thể giúp gì?")
        );

        store.updateMessages("session-1", originalMessages);
        verify(valueOperations).set(eq("kbase:chat:memory:session-1"), anyString(), any(Duration.class));
    }

    @Test
    @DisplayName("Kiểm tra khi Redis ném Exception thì store không làm crash ứng dụng")
    void testGetMessages_whenRedisThrowsException_handlesGracefully() {
        when(stringRedisTemplate.opsForValue()).thenThrow(new RuntimeException("Redis connection refused"));

        RedisChatMemoryStore store = new RedisChatMemoryStore(Optional.of(stringRedisTemplate));

        List<ChatMessage> result = store.getMessages("session-1");

        assertNotNull(result);
        assertTrue(result.isEmpty());
    }
}
