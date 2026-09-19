package com.kbase.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProjectRequest {

    @NotBlank(message = "Tên dự án không được để trống")
    @Size(min = 3, max = 100, message = "Tên dự án phải từ 3 đến 100 ký tự")
    private String name;

    private String description;
}
