package com.hospital.lms.collection.dtos;

import lombok.Data;

/**
 * Request payload to allocate a pre-printed sticker set code (e.g. "0001")
 * to a specific ordered test.
 */
@Data
public class AllocateSetRequestDTO {
    private String setCode;
}
