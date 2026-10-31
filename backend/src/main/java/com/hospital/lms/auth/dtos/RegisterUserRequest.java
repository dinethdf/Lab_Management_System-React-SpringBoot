package com.hospital.lms.auth.dtos;

import com.hospital.lms.auth.models.Role;
import lombok.Data;

/**
 * DTO for creating a new staff user.
 */
@Data
public class RegisterUserRequest {
    private String username;
    private String password;
    private Role role;
}
