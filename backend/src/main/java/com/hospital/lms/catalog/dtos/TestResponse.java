package com.hospital.lms.catalog.dtos;

import lombok.Data;

@Data
public class TestResponse {
    private Long id;
    private String name;
    private String code;
    private String category;
    private Integer parameterCount;
    private Boolean isActive;
}
