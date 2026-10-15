package com.kbase.dto.request;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CreateChatSessionRequest {

    @Size(max = 255, message = "Tiêu đề phiên không được vượt quá 255 ký tự")
    private String title;
}
