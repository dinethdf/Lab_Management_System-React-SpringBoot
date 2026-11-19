package com.hospital.lms.result.models;

import com.hospital.lms.auth.models.User;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Report — Represents a finalized, legally compliant diagnostic laboratory report PDF.
 * Generated automatically when a Senior Lab Technician approves an entered TestResult.
 */
@Entity
@Table(name = "reports")
@Data
public class Report {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "test_result_id", nullable = false, unique = true)
    private TestResult testResult;

    @Column(name = "report_number", nullable = false, unique = true, length = 100)
    private String reportNumber;

    @Column(name = "pdf_path", nullable = false, length = 500)
    private String pdfPath;

    /**
     * Unique 32-character random hex token for public web link report retrieval.
     * Allows patients to view their report online without full user credentials.
     */
    @Column(name = "share_token", unique = true, length = 64)
    private String shareToken;

    @Column(name = "share_token_generated_at")
    private LocalDateTime shareTokenGeneratedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by", nullable = false)
    private User approvedBy;

    @Column(name = "generated_at", nullable = false)
    private LocalDateTime generatedAt;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    private Long createdBy;
    private Long updatedBy;

    @PrePersist
    protected void onCreate() {
        if (generatedAt == null) {
            generatedAt = LocalDateTime.now();
        }
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
