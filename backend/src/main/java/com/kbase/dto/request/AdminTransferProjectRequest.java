package com.kbase.dto.request;

import lombok.Data;

@Data
public class AdminTransferProjectRequest {
    private String newOwnerEmail;
}
