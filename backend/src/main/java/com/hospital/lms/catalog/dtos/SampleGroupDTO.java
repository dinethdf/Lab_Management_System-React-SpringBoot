package com.hospital.lms.catalog.dtos;

import com.hospital.lms.catalog.models.SampleGroup.SampleType;
import lombok.Data;

@Data
public class SampleGroupDTO {
    private String key;
    private SampleType sampleType;
    private Long containerTypeId;
    private Integer numContainers;
    private Integer dayOffset;
}
