package com.hospital.lms.collection.dtos;

import lombok.Data;
import java.time.LocalDateTime;

/**
 * Data Transfer Object providing comprehensive specimen container details
 * for the phlebotomy collection workbench.
 */
@Data
public class ContainerDetailDTO {
    private Long id;
    private Long orderTestId;
    private Long testId;
    private String testName;
    private String testCode;
    private String testCategory;
    private String testSampleCode;

    // Specimen / Tube context
    private Long sampleGroupId;
    private String sampleType;
    private String sampleTypeName;
    private String containerTypeCode;
    private String containerTypeName;
    private String containerLabelLetter;
    private String containerColorHint;

    // Sticker & status
    private Long stickerSetId;
    private String stickerSetFormattedNumber;
    private String containerCode;
    private Integer dayOffset;
    private java.time.LocalDate dueDate;
    private boolean isDueToday;
    private Integer containerSequence;
    private String status;

    // Timestamps and staff audit
    private LocalDateTime collectedAt;
    private Long collectedBy;
    private String collectedByName;

    private LocalDateTime receivedAt;
    private Long receivedBy;
    private String receivedByName;

    private LocalDateTime rejectedAt;
    private String rejectionReason;
}
