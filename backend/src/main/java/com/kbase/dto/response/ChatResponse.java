package com.kbase.dto.response;

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
public class ChatResponse {
    private String response;
    private List<SourceDto> sources;

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class SourceDto {
        private int sourceId;
        private UUID documentId;
        private String fileName;
        private String text;
    }
}
