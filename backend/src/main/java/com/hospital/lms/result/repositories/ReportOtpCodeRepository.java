package com.hospital.lms.result.repositories;

import com.hospital.lms.result.models.Report;
import com.hospital.lms.result.models.ReportOtpCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * ReportOtpCodeRepository — Provides database operations for patient portal OTP challenges.
 */
@Repository
public interface ReportOtpCodeRepository extends JpaRepository<ReportOtpCode, Long> {

    /**
     * Finds the most recent active, unused, unexpired OTP code for a report.
     * Used when the patient submits their 6-digit OTP code to verify their identity.
     */
    Optional<ReportOtpCode> findTopByReportAndIsUsedFalseAndExpiresAtAfterOrderByGeneratedAtDesc(
            Report report, LocalDateTime now
    );

    /**
     * Finds the most recently generated OTP for a report.
     * Used for rate-limiting (e.g. preventing new OTP generation within 60 seconds).
     */
    Optional<ReportOtpCode> findTopByReportOrderByGeneratedAtDesc(Report report);

    /**
     * Finds all active unused OTPs for a report so they can be invalidated when a new OTP is requested.
     */
    List<ReportOtpCode> findByReportAndIsUsedFalse(Report report);
}
