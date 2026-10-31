package com.hospital.lms.auth.dtos;

import lombok.Data;

/**
 * Data Transfer Object for Login Requests.
 * This is the exact format we expect React to send when a user logs in.
 */
@Data
public class AuthRequest {
    private String username;
    private String password;
}
