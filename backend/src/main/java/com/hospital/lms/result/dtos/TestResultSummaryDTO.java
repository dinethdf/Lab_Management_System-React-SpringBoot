package com.hospital.lms.result.dtos;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class TestResultSummaryDTO {
    private Long id;
    private Long orderTestId;
    private String testSampleCode;
    private String testName;
    private String testCategory;
    private String patientName;
    private String patientSex;
    private Integer patientAgeYears;
    private Long enteredById;
    private String enteredByUsername;
    private String status;
    private String notes;
    private String rejectionReason;
    private LocalDateTime submittedAt;
    private LocalDateTime verifiedAt;
    private int abnormalCount;
    private int criticalCount;
}
