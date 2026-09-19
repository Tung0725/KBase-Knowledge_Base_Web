package com.kbase.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UploadRequest {
    
    @NotBlank(message = "File name cannot be empty")
    private String fileName;
    
    @NotNull(message = "File size cannot be null")
    @Positive(message = "File size must be positive")
    private Long fileSizeBytes;
    
    @NotBlank(message = "File type cannot be empty")
    private String fileType;
}
