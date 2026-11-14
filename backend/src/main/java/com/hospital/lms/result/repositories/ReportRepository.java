package com.hospital.lms.result.repositories;

import com.hospital.lms.result.models.Report;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository interface for managing Report persistence and queries.
 */
@Repository
public interface ReportRepository extends JpaRepository<Report, Long> {

    /**
     * Finds the report associated with a specific TestResult ID.
     */
    Optional<Report> findByTestResult_Id(Long testResultId);

    /**
     * Finds a report by its unique public report number (e.g. RPT-2026-00001).
     */
    Optional<Report> findByReportNumber(String reportNumber);

    /**
     * Fetches the 20 most recently generated reports.
     */
    List<Report> findTop20ByOrderByGeneratedAtDesc();

    /**
     * Finds reports matching a Lab Slip barcode (LS-...), Patient Slip barcode (PS-...), or Test Sample Code (TSC-...).
     */
    @Query("SELECT r FROM Report r " +
           "JOIN r.testResult tr " +
           "JOIN tr.orderTest ot " +
           "JOIN ot.testOrder o " +
           "WHERE o.labSlipBarcode = :barcode " +
           "   OR o.labSlipBarcode = REPLACE(:barcode, 'PS-', 'LS-') " +
           "   OR ot.testSampleCode = :barcode")
    List<Report> findByOrderOrSampleBarcode(@Param("barcode") String barcode);

    /**
     * Finds reports linked to a physical specimen container code (SC...).
     */
    @Query("SELECT r FROM Report r " +
           "JOIN r.testResult tr " +
           "JOIN tr.orderTest ot " +
           "JOIN ot.containers c " +
           "WHERE c.containerCode = :containerCode")
    List<Report> findByContainerCode(@Param("containerCode") String containerCode);
}
