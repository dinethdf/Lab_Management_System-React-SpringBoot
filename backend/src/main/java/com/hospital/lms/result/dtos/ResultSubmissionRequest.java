package com.hospital.lms.result.dtos;

import lombok.Data;
import java.util.List;

@Data
public class ResultSubmissionRequest {
    private Long containerId;
    private List<ParameterResult> results;

    @Data
    public static class ParameterResult {
        private Long parameterId;
        private String value;
    }
}
