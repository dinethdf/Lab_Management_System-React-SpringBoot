package com.hospital.lms.catalog.utils;

import com.hospital.lms.catalog.models.TestParameter;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

class RangeSelectorTest {

    @Test
    @DisplayName("Should return empty when parameter is null")
    void testNullParameter() {
        assertTrue(RangeSelector.findMatchingRange(null, "MALE").isEmpty());
    }

    @Test
    @DisplayName("Should return male limits for male patient and female limits for female patient")
    void testSexSpecificRangeMatching() {
        TestParameter param = new TestParameter();
        param.setName("Hemoglobin");
        param.setMaleMinRange(BigDecimal.valueOf(13.5));
        param.setMaleMaxRange(BigDecimal.valueOf(17.5));
        param.setMaleCriticalLow(BigDecimal.valueOf(7.0));
        param.setMaleCriticalHigh(BigDecimal.valueOf(20.0));

        param.setFemaleMinRange(BigDecimal.valueOf(12.0));
        param.setFemaleMaxRange(BigDecimal.valueOf(15.5));
        param.setFemaleCriticalLow(BigDecimal.valueOf(6.5));
        param.setFemaleCriticalHigh(BigDecimal.valueOf(19.0));

        // Male test
        Optional<RangeSelector.RangeLimits> maleLimits = RangeSelector.findMatchingRange(param, "MALE");
        assertTrue(maleLimits.isPresent());
        assertEquals(BigDecimal.valueOf(13.5), maleLimits.get().getLowerLimit());
        assertEquals(BigDecimal.valueOf(17.5), maleLimits.get().getUpperLimit());

        // Female test
        Optional<RangeSelector.RangeLimits> femaleLimits = RangeSelector.findMatchingRange(param, "FEMALE");
        assertTrue(femaleLimits.isPresent());
        assertEquals(BigDecimal.valueOf(12.0), femaleLimits.get().getLowerLimit());
        assertEquals(BigDecimal.valueOf(15.5), femaleLimits.get().getUpperLimit());
    }

    @Test
    @DisplayName("Should fallback to male range if female range is not specifically defined")
    void testFallbackToCommonRange() {
        TestParameter param = new TestParameter();
        param.setName("Fasting Blood Sugar");
        // Only set on male limits (common for both)
        param.setMaleMinRange(BigDecimal.valueOf(70.0));
        param.setMaleMaxRange(BigDecimal.valueOf(100.0));

        Optional<RangeSelector.RangeLimits> result = RangeSelector.findMatchingRange(param, "FEMALE");
        assertTrue(result.isPresent());
        assertEquals(BigDecimal.valueOf(70.0), result.get().getLowerLimit());
        assertEquals(BigDecimal.valueOf(100.0), result.get().getUpperLimit());
    }

    @Test
    @DisplayName("Should return empty when no limits are configured on parameter")
    void testNoLimitsConfigured() {
        TestParameter param = new TestParameter();
        param.setName("Colour");
        param.setResultType(TestParameter.ResultType.TEXT);

        Optional<RangeSelector.RangeLimits> result = RangeSelector.findMatchingRange(param, "MALE");
        assertTrue(result.isEmpty());
    }
}
