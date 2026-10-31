package com.hospital.lms.result.dtos;

import com.hospital.lms.catalog.models.TestParameter.ResultType;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class ResultFormDataDTO {
    private Long orderTestId;
    private String testSampleCode;
    private Long testId;
    private String testName;
    private String testCategory;

    private Long patientId;
    private String patientName;
    private Integer patientAgeYears;
    private Integer patientAgeDays;
    private String patientSex;
    private String patientContact;

    private Long resultId;
    private String status; // PENDING_ENTRY, DRAFT, SUBMITTED, APPROVED, REJECTED
    private String notes;
    private String rejectionReason;

    private List<ResultFormParameterDTO> parameters;

    @Data
    public static class ResultFormParameterDTO {
        private Long parameterId;
        private Long sampleGroupId;
        private String parameterName;
        private ResultType resultType;
        private String unit;
        private Integer decimalPlaces;
        private Integer sortOrder;

        // Current entered values (if draft exists)
        private BigDecimal currentNumericValue;
        private String currentTextValue;
        private String currentChoiceValue;
        private Boolean isAbnormal = false;
        private Boolean isCritical = false;

        // Reference range applicable for this patient
        private BigDecimal refLower;
        private BigDecimal refUpper;
        private BigDecimal criticalLow;
        private BigDecimal criticalHigh;

        // Choice options (if CHOICE)
        private List<FormOptionDTO> options;
    }

    @Data
    public static class FormOptionDTO {
        private String label;
        private Boolean isAbnormal;
    }
}
