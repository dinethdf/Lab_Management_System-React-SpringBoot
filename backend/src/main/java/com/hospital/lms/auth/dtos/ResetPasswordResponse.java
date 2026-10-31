package com.hospital.lms.auth.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO returned after Admin successfully resets a staff password.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class ResetPasswordResponse {
    private String message;
    private String temporaryPassword;
}
