package com.kbase.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.util.List;
import java.util.UUID;

@Data
public class ChatRequest {
    @NotBlank(message = "Message cannot be empty")
    private String message;
    
    // Tuỳ chọn: Chỉ hỏi trên một số tài liệu cụ thể
    private List<UUID> documentIds;
}
