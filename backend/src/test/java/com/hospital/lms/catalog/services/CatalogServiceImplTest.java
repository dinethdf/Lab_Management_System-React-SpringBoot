package com.hospital.lms.catalog.services;

import com.hospital.lms.catalog.dtos.CreateTestRequest;
import com.hospital.lms.catalog.dtos.ParameterDTO;
import com.hospital.lms.catalog.dtos.SampleGroupDTO;
import com.hospital.lms.catalog.models.SampleGroup.SampleType;
import com.hospital.lms.catalog.repositories.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

class CatalogServiceImplTest {

    private LabTestRepository testRepository;
    private TestParameterRepository parameterRepository;
    private SampleGroupRepository sampleGroupRepository;
    private ContainerTypeRepository containerTypeRepository;
    private CatalogServiceImpl catalogService;

    @BeforeEach
    void setUp() {
        testRepository = Mockito.mock(LabTestRepository.class);
        parameterRepository = Mockito.mock(TestParameterRepository.class);
        sampleGroupRepository = Mockito.mock(SampleGroupRepository.class);
        containerTypeRepository = Mockito.mock(ContainerTypeRepository.class);

        when(testRepository.findByCode(anyString())).thenReturn(Optional.empty());

        catalogService = new CatalogServiceImpl(
                testRepository,
                parameterRepository,
                sampleGroupRepository,
                containerTypeRepository
        );
    }

    @Test
    @DisplayName("Should throw when test has multiple sample groups and parameter has no sampleGroupKey")
    void testMultiGroupParameterMissingKey() {
        CreateTestRequest req = new CreateTestRequest();
        req.setName("Routine Check");
        req.setCode("RC01");
        req.setCategory("General");

        List<SampleGroupDTO> groups = new ArrayList<>();
        SampleGroupDTO g1 = new SampleGroupDTO();
        g1.setKey("g1");
        g1.setSampleType(SampleType.BLOOD_VENOUS);
        g1.setContainerTypeId(1L);

        SampleGroupDTO g2 = new SampleGroupDTO();
        g2.setKey("g2");
        g2.setSampleType(SampleType.URINE_SPOT);
        g2.setContainerTypeId(5L);

        groups.add(g1);
        groups.add(g2);
        req.setSampleGroups(groups);

        List<ParameterDTO> params = new ArrayList<>();
        ParameterDTO p = new ParameterDTO();
        p.setName("Hemoglobin");
        p.setResultType("NUMBER");
        // sampleGroupKey intentionally left null
        params.add(p);
        req.setParameters(params);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> catalogService.createTest(req));
        assertTrue(ex.getMessage().contains("must be assigned to a sample group"));
    }

    @Test
    @DisplayName("Should throw when reference range has lower limit > upper limit")
    void testLowerLimitGreaterThanUpperLimit() {
        CreateTestRequest req = new CreateTestRequest();
        req.setName("Blood Sugar");
        req.setCode("BS01");
        req.setCategory("Biochemistry");

        List<ParameterDTO> params = new ArrayList<>();
        ParameterDTO p = new ParameterDTO();
        p.setName("Glucose");
        p.setResultType("NUMBER");
        p.setMaleMinRange(BigDecimal.valueOf(150.0));
        p.setMaleMaxRange(BigDecimal.valueOf(100.0)); // Invalid!

        params.add(p);
        req.setParameters(params);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> catalogService.createTest(req));
        assertTrue(ex.getMessage().contains("lower limit cannot be greater than upper limit"));
    }

    @Test
    @DisplayName("Should throw when CHOICE parameter has no options")
    void testChoiceParameterMissingOptions() {
        CreateTestRequest req = new CreateTestRequest();
        req.setName("Urine Test");
        req.setCode("UT01");
        req.setCategory("Urinalysis");

        List<ParameterDTO> params = new ArrayList<>();
        ParameterDTO p = new ParameterDTO();
        p.setName("Protein");
        p.setResultType("CHOICE");
        p.setPossibleOptions(""); // No options provided
        params.add(p);
        req.setParameters(params);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> catalogService.createTest(req));
        assertTrue(ex.getMessage().contains("has no options defined"));
    }

    @Test
    @DisplayName("Should throw when range limits are defined on CHOICE parameter")
    void testRangeOnChoiceParameter() {
        CreateTestRequest req = new CreateTestRequest();
        req.setName("Urine Test");
        req.setCode("UT01");
        req.setCategory("Urinalysis");

        List<ParameterDTO> params = new ArrayList<>();
        ParameterDTO p = new ParameterDTO();
        p.setName("Protein");
        p.setResultType("CHOICE");
        p.setPossibleOptions("Negative, Trace, Positive");
        p.setMaleMinRange(BigDecimal.valueOf(0)); // Invalid for CHOICE!

        params.add(p);
        req.setParameters(params);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> catalogService.createTest(req));
        assertTrue(ex.getMessage().contains("result type is not NUMBER"));
    }
}
