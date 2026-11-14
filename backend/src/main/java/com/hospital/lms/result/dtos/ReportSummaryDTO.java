package com.hospital.lms.result.dtos;

import lombok.Data;
import java.time.LocalDateTime;

/**
 * ReportSummaryDTO — Clean representation of an approved diagnostic report for UI display.
 */
@Data
public class ReportSummaryDTO {
    private Long id;
    private String reportNumber;
    private Long testResultId;
    private Long orderTestId;
    private Long testId;
    private String testName;
    private String testCode;
    private String testCategory;
    private String testSampleCode;
    private String labSlipBarcode;

    private Long patientId;
    private String patientName;
    private String patientSex;
    private Integer patientAgeYears;
    private String patientContact;

    private Long approvedById;
    private String approvedByUsername;
    private LocalDateTime generatedAt;

    private int abnormalCount;
    private int criticalCount;

    private String pdfDownloadUrl;
}
