package com.kbase.dto.response;

import com.kbase.entity.ProjectMember;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for the project invite link configuration.
 * Contains everything the frontend needs to render the invite link modal.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InviteLinkResponse {

    @JsonProperty("isActive")
    private Boolean isActive;

    private String inviteCode;

    private String inviteUrl;

    private ProjectMember.ProjectRole inviteRole;
}
