package com.hospital.lms.collection.dtos;

import lombok.Data;

/**
 * Request payload when linking a pre-printed sticker code (e.g. SC00001)
 * to a specimen container slot.
 */
@Data
public class LinkStickerRequestDTO {
    private Long containerId;
    private String stickerCode;
}
