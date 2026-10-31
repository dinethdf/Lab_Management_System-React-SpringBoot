package com.hospital.lms.auth.dtos;

import lombok.Data;

/**
 * DTO for toggling user active/disabled status.
 */
@Data
public class UpdateUserStatusRequest {
    private Boolean isActive;
}
