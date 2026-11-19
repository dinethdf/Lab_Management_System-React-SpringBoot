package com.hospital.lms.result.models;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

/**
 * ReportOtpCode — Represents a temporary One-Time Password (OTP) challenge
 * dispatched via SMS to a patient's registered mobile number when they
 * open their diagnostic report web link.
 *
 * Security Characteristics:
 * 1. 6-digit random numeric code (e.g., 492817).
 * 2. 5-minute expiration window.
 * 3. Single-use: once verified, isUsed is set to true to prevent replay attacks.
 */
@Entity
@Table(name = "report_otp_codes")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReportOtpCode {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // The diagnostic report this OTP challenge grants access to
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "report_id", nullable = false)
    private Report report;

    // 6-digit secret verification code
    @Column(name = "otp_code", nullable = false, length = 6)
    private String otpCode;

    // When the OTP was generated and dispatched
    @Column(name = "generated_at", nullable = false)
    private LocalDateTime generatedAt;

    // Expiration timestamp (5 minutes after generation)
    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    // Flag indicating whether this OTP has already been used to unlock the report
    @Column(name = "is_used", nullable = false)
    private Boolean isUsed = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "created_by")
    private Long createdBy;

    @Column(name = "updated_by")
    private Long updatedBy;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) {
            createdAt = now;
        }
        if (updatedAt == null) {
            updatedAt = now;
        }
        if (generatedAt == null) {
            generatedAt = now;
        }
        if (expiresAt == null) {
            // Standard OTP lifespan: 5 minutes
            expiresAt = now.plusMinutes(5);
        }
        if (isUsed == null) {
            isUsed = false;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    /**
     * Checks if this OTP has expired based on the current timestamp.
     */
    public boolean isExpired() {
        return LocalDateTime.now().isAfter(expiresAt);
    }

    /**
     * Checks if this OTP is currently valid and active (not used and not expired).
     */
    public boolean isValid() {
        return Boolean.FALSE.equals(isUsed) && !isExpired();
    }
}
