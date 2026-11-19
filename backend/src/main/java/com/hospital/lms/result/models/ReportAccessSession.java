package com.hospital.lms.result.models;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

/**
 * ReportAccessSession — Represents a temporary authenticated session for a patient
 * who successfully entered their 4-digit mobile verification PIN on the public report portal.
 *
 * This session grants a 30-minute access window to stream or download their clinical PDF
 * without exposing an open, unverified public download endpoint.
 */
@Entity
@Table(name = "report_access_sessions")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReportAccessSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // The report that this session authorizes the patient to access
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "report_id", nullable = false)
    private Report report;

    // A secure random UUID session token sent in the X-Session-Token header
    @Column(name = "session_token", nullable = false, unique = true, length = 64)
    private String sessionToken;

    // Session expiration timestamp (typically 30 minutes from creation)
    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    // When the patient verified their identity and this session was issued
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (expiresAt == null) {
            // Default session validity: 30 minutes
            expiresAt = LocalDateTime.now().plusMinutes(30);
        }
    }

    /**
     * Checks if this session has expired.
     * @return true if the current time is after expiresAt
     */
    public boolean isExpired() {
        return LocalDateTime.now().isAfter(expiresAt);
    }
}
