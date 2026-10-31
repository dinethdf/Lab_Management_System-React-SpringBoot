package com.hospital.lms.catalog.dtos;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class ParameterDTO {
    private String name;
    private String resultType = "NUMBER"; // NUMBER, TEXT, CHOICE
    private String unit;
    private Integer decimalPlaces;
    private String sampleGroupKey;
    private Integer sortOrder;

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
    private String possibleOptions; // e.g. "Negative, Trace, Positive"
    private String abnormalOptions; // e.g. "Trace, Positive"
}
