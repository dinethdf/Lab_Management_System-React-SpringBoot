package com.hospital.lms.result.dtos;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class SaveResultRequestDTO {
    private Long orderTestId;
    private String notes;
    private List<ParameterValueDTO> values;

    @Data
    public static class ParameterValueDTO {
        private Long parameterId;
        private BigDecimal numericValue;
        private String textValue;
        private String choiceValue;
    }
}
