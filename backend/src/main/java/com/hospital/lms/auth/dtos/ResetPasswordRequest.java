package com.hospital.lms.auth.dtos;

import lombok.Data;

/**
 * DTO for Admin resetting a staff member's password.
 */
@Data
public class ResetPasswordRequest {
    private String temporaryPassword;
}
