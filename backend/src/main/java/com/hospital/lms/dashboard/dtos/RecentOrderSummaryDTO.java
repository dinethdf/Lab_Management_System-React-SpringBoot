package com.hospital.lms.dashboard.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Lightweight DTO representing a recently created laboratory order
 * for the Admin Dashboard activity table.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecentOrderSummaryDTO {
    private Long orderId;
    private String labSlipBarcode;
    private Long patientId;
    private String patientName;
    private String patientContact;
    private String status;
    private List<String> testNames;
    private LocalDateTime createdAt;
}
