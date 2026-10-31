package com.hospital.lms.auth.models;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

/**
 * Represents a User in the database.
 * Mapped to the 'users' table created in schema.sql.
 */
@Entity
@Table(name = "users")
@Data // Lombok annotation to auto-generate getters and setters
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Must be unique as it's used for login
    @Column(nullable = false, unique = true)
    private String username;

    // Stores the BCrypt hashed password
    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    // The user's role in the system
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "must_change_password", nullable = false)
    private Boolean mustChangePassword = true;

    // Audit columns
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "created_by")
    private Long createdBy;

    @Column(name = "updated_by")
    private Long updatedBy;

    // Automatically set the timestamps before saving
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
