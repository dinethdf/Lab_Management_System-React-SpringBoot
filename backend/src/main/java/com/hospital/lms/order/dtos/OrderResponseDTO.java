package com.hospital.lms.order.dtos;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

/**
 * OrderResponseDTO — Data Transfer Object representing a created or retrieved lab order.
 * Prevents direct exposure of JPA entities and avoids ByteBuddy proxy serialization issues.
 */
@Data
public class OrderResponseDTO {
    private Long id;
    private Long patientId;
    private String patientName;
    private String patientContact;
    private String labSlipBarcode;
    private String status;
    private List<OrderTestItemDTO> orderTests;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Data
    public static class OrderTestItemDTO {
        private Long orderTestId;
        private Long testId;
        private String testName;
        private String testCode;
        private String testCategory;
        private String testSampleCode;
    }
}
