package com.kbase.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class EditChatMessageRequest {

    @NotBlank(message = "Nội dung câu hỏi không được để trống")
    private String message;

    private List<UUID> documentIds;
}
