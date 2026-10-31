package com.hospital.lms.catalog.dtos;

import com.hospital.lms.catalog.models.SampleGroup.SampleType;
import com.hospital.lms.catalog.models.TestParameter.ResultType;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class TestDetailResponse {
    private Long id;
    private String name;
    private String code;
    private String category;
    private String description;
    private Boolean isActive;
    private List<SampleGroupDetailDTO> sampleGroups;
    private List<ParameterDetailDTO> parameters;

    @Data
    public static class SampleGroupDetailDTO {
        private Long id;
        private SampleType sampleType;
        private Long containerTypeId;
        private String containerTypeName;
        private String containerTypeCode;
        private String labelLetter;
        private Integer numContainers;
        private Integer dayOffset;
    }

    @Data
    public static class ParameterDetailDTO {
        private Long id;
        private Long sampleGroupId;
        private String name;
        private ResultType resultType;
        private String unit;
        private Integer decimalPlaces;
        private Integer sortOrder;
        private Boolean isActive;

        // Male Reference Range & Critical Limits
        private BigDecimal maleMinRange;
        private BigDecimal maleMaxRange;
        private BigDecimal maleCriticalLow;
        private BigDecimal maleCriticalHigh;

        // Female Reference Range & Critical Limits
        private BigDecimal femaleMinRange;
        private BigDecimal femaleMaxRange;
        private BigDecimal femaleCriticalLow;
        private BigDecimal femaleCriticalHigh;

        // For CHOICE Parameters
        private String possibleOptions;
        private String abnormalOptions;
    }
}
