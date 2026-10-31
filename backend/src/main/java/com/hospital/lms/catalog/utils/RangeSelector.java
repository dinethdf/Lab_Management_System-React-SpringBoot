package com.hospital.lms.catalog.utils;

import com.hospital.lms.catalog.models.TestParameter;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.Optional;

/**
 * Utility for selecting the appropriate reference range limits for a patient
 * based on patient sex (MALE vs FEMALE).
 */
public class RangeSelector {

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class RangeLimits {
        private BigDecimal lowerLimit;
        private BigDecimal upperLimit;
        private BigDecimal criticalLow;
        private BigDecimal criticalHigh;
    }

    /**
     * Resolves the applicable reference range and critical limits for a patient
     * from a TestParameter based on the patient's sex.
     *
     * @param param the TestParameter containing male and female range definitions
     * @param patientSex patient sex ("FEMALE" or "MALE")
     * @return Optional RangeLimits
     */
    public static Optional<RangeLimits> findMatchingRange(TestParameter param, String patientSex) {
        if (param == null) {
            return Optional.empty();
        }

        boolean isFemale = patientSex != null && "FEMALE".equalsIgnoreCase(patientSex.trim());

        BigDecimal lower = isFemale ? param.getFemaleMinRange() : param.getMaleMinRange();
        BigDecimal upper = isFemale ? param.getFemaleMaxRange() : param.getMaleMaxRange();
        BigDecimal critLow = isFemale ? param.getFemaleCriticalLow() : param.getMaleCriticalLow();
        BigDecimal critHigh = isFemale ? param.getFemaleCriticalHigh() : param.getMaleCriticalHigh();

        // Fallback to other sex if specific sex limits are not defined
        if (lower == null && upper == null) {
            lower = isFemale ? param.getMaleMinRange() : param.getFemaleMinRange();
            upper = isFemale ? param.getMaleMaxRange() : param.getFemaleMaxRange();
            critLow = isFemale ? param.getMaleCriticalLow() : param.getFemaleCriticalLow();
            critHigh = isFemale ? param.getMaleCriticalHigh() : param.getFemaleCriticalHigh();
        }

        if (lower == null && upper == null && critLow == null && critHigh == null) {
            return Optional.empty();
        }

        return Optional.of(new RangeLimits(lower, upper, critLow, critHigh));
    }
}
