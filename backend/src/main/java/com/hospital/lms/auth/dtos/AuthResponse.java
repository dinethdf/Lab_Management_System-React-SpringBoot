package com.hospital.lms.auth.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;

/**
 * Data Transfer Object for Login Responses.
 * This is what we send back to React after a successful login.
 */
@Data
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private String role;
    private boolean mustChangePassword;
}
