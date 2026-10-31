package com.hospital.lms.auth.dtos;

import lombok.Data;

/**
 * DTO for staff user changing their own password.
 */
@Data
public class ChangePasswordRequest {
    private String newPassword;
}
