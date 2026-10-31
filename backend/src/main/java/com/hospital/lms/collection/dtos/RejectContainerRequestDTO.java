package com.hospital.lms.collection.dtos;

import lombok.Data;

/**
 * Request payload when rejecting a physical specimen container
 * at the lab bench due to a quality issue (e.g. hemolysis, clotted).
 */
@Data
public class RejectContainerRequestDTO {
    private String reason;
}
