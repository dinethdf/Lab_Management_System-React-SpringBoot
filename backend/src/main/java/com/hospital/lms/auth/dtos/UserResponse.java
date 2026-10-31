package com.hospital.lms.auth.dtos;

import com.hospital.lms.auth.models.Role;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Safe DTO for sending user data to the frontend.
 * Never includes password_hash!
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserResponse {
    private Long id;
    private String username;
    private Role role;
    private Boolean isActive;
    private Boolean mustChangePassword;
    private LocalDateTime createdAt;
    private String temporaryPassword;

    public UserResponse(Long id, String username, Role role, Boolean isActive, Boolean mustChangePassword, LocalDateTime createdAt) {
        this.id = id;
        this.username = username;
        this.role = role;
        this.isActive = isActive;
        this.mustChangePassword = mustChangePassword;
        this.createdAt = createdAt;
    }
}
