package com.hospital.lms.collection.dtos;

import lombok.Data;

/**
 * Request payload to mark an individual specimen tube as COLLECTED by scanning its barcode.
 */
@Data
public class CollectTubeRequestDTO {
    private String tubeCode;
    private Long containerId;
}
