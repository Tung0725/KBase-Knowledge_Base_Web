package com.kbase.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UpdateDocumentRequest {
    @NotBlank(message = "File name is required")
    private String fileName;
    
    private String description;
}
