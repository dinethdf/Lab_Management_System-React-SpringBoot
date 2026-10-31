package com.hospital.lms.catalog.dtos;

import lombok.Data;
import java.util.List;

@Data
public class CreateTestRequest {
    private String name;
    private String code;
    private String category;
    private String description;
    private List<ParameterDTO> parameters;
    private List<SampleGroupDTO> sampleGroups;
}
