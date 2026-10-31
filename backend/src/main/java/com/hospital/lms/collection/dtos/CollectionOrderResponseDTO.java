package com.hospital.lms.collection.dtos;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Data Transfer Object containing full order, patient, and container breakdown
 * for the phlebotomy collection workbench.
 */
@Data
public class CollectionOrderResponseDTO {
    private Long orderId;
    private String labSlipBarcode;
    private String orderStatus;
    private LocalDateTime createdAt;

    // Patient demographics
    private Long patientId;
    private String patientName;
    private String patientContact;
    private String patientGender;
    private Integer patientAgeYears;
    private String referringDoctor;

    // Tests in this order with their allocated sticker sets and container lists
    private List<OrderTestSummaryDTO> orderTests = new ArrayList<>();

    // Container groupings by visit day
    private List<ContainerDetailDTO> todayContainers = new ArrayList<>();
    private List<ContainerDetailDTO> futureContainers = new ArrayList<>();

    // Summary counts for technician visibility
    private Integer totalContainers = 0;
    private Integer collectedCount = 0;
    private Integer pendingCount = 0;
    private Integer rejectedCount = 0;

    @Data
    public static class OrderTestSummaryDTO {
        private Long orderTestId;
        private Long testId;
        private String testCode;
        private String testName;
        private String testCategory;
        private String testSampleCode;
        private String stickerSetNumber;
        private List<ContainerDetailDTO> containers = new ArrayList<>();
    }
}
