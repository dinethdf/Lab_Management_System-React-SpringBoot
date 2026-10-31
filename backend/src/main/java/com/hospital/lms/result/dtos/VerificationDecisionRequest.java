package com.hospital.lms.result.dtos;

import lombok.Data;

@Data
public class VerificationDecisionRequest {
    private String reason; // required when rejecting
}
