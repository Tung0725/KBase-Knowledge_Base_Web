package com.kbase.service;

import com.kbase.repository.ChatSessionRepository;
import dev.langchain4j.model.chat.ChatLanguageModel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.UUID;
import java.util.function.Consumer;

/**
 * Service generating concise titles for new chat sessions using LLM summarization.
 * Isolates title generation logic from core chat streaming pipeline.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ChatTitleGenerator {

    private static final String DEFAULT_TITLE = "Đoạn chat mới";
    private static final int MAX_TITLE_LENGTH = 50;

    private final ChatLanguageModel deepseekChatModel;
    private final ChatSessionRepository chatSessionRepository;

    /**
     * Business Flow: Generates a 3-6 word title if the session currently holds the default title.
     * Role Permissions: Internal asynchronous service task.
     *
     * @param sessionId identifier of the conversation session
     * @param initialPrompt user's initial query text
     * @param onTitleGenerated optional callback invoked with the sanitized title
     */
    public void generateTitleIfFirstMessage(UUID sessionId, String initialPrompt, Consumer<String> onTitleGenerated) {
        if (sessionId == null || initialPrompt == null || initialPrompt.isBlank()) {
            return;
        }

        chatSessionRepository.findById(sessionId).ifPresent(session -> {
            if (!DEFAULT_TITLE.equalsIgnoreCase(session.getTitle())) {
                return;
            }

            try {
                String prompt = "Hãy đặt một tiêu đề ngắn gọn (từ 3 đến 6 từ) tóm tắt câu hỏi sau. Không dùng dấu ngoặc kép, không giải thích, chỉ trả về đúng tiêu đề: "
                        + initialPrompt;
                String generated = deepseekChatModel.generate(prompt);

                if (generated != null && !generated.isBlank()) {
                    String cleanTitle = generated.replaceAll("^[\"']+|[\"']+$", "").trim();
                    if (cleanTitle.length() > MAX_TITLE_LENGTH) {
                        cleanTitle = cleanTitle.substring(0, MAX_TITLE_LENGTH);
                    }
                    session.setTitle(cleanTitle);
                    chatSessionRepository.save(session);
                    if (onTitleGenerated != null) {
                        onTitleGenerated.accept(cleanTitle);
                    }
                }
            } catch (Exception e) {
                log.warn("[Auto Title] Lỗi khi tạo tiêu đề tự động cho session {}: {}", sessionId, e.getMessage());
            }
        });
    }
}
