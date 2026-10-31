package com.hospital.lms.catalog.services;

import com.hospital.lms.catalog.dtos.*;
import com.hospital.lms.catalog.models.*;
import com.hospital.lms.catalog.repositories.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Service implementation for managing the laboratory test catalog.
 * Handles validation and creation of tests, sample groups, and parameters
 * with embedded Male/Female reference ranges and discrete options.
 */
@Service
public class CatalogServiceImpl implements CatalogService {

    private final LabTestRepository testRepository;
    private final TestParameterRepository parameterRepository;
    private final SampleGroupRepository sampleGroupRepository;
    private final ContainerTypeRepository containerTypeRepository;

    public CatalogServiceImpl(LabTestRepository testRepository,
                              TestParameterRepository parameterRepository,
                              SampleGroupRepository sampleGroupRepository,
                              ContainerTypeRepository containerTypeRepository) {
        this.testRepository = testRepository;
        this.parameterRepository = parameterRepository;
        this.sampleGroupRepository = sampleGroupRepository;
        this.containerTypeRepository = containerTypeRepository;
    }

    /**
     * Retrieves all active laboratory tests for selection in the reception or order screens.
     */
    @Override
    public List<TestResponse> getAllTests() {
        return testRepository.findByIsActiveTrue().stream().map(test -> {
            TestResponse dto = new TestResponse();
            dto.setId(test.getId());
            dto.setName(test.getName());
            dto.setCode(test.getCode());
            dto.setCategory(test.getCategory());
            dto.setIsActive(test.getIsActive());
            dto.setParameterCount(test.getParameters() != null ? test.getParameters().size() : 0);
            return dto;
        }).collect(Collectors.toList());
    }

    /**
     * Retrieves full configuration details of a test by ID (including sample groups and parameters).
     */
    @Override
    @Transactional(readOnly = true)
    public TestDetailResponse getTestById(Long id) {
        LabTest test = testRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Test with ID " + id + " not found."));

        TestDetailResponse response = new TestDetailResponse();
        response.setId(test.getId());
        response.setName(test.getName());
        response.setCode(test.getCode());
        response.setCategory(test.getCategory());
        response.setDescription(test.getDescription());
        response.setIsActive(test.getIsActive());

        // Map Sample Groups
        List<SampleGroup> sampleGroups = sampleGroupRepository.findByTestId(test.getId());
        List<TestDetailResponse.SampleGroupDetailDTO> sgDtos = sampleGroups.stream().map(sg -> {
            TestDetailResponse.SampleGroupDetailDTO sgDto = new TestDetailResponse.SampleGroupDetailDTO();
            sgDto.setId(sg.getId());
            sgDto.setSampleType(sg.getSampleType());
            sgDto.setContainerTypeId(sg.getContainerType().getId());
            sgDto.setContainerTypeName(sg.getContainerType().getName());
            sgDto.setContainerTypeCode(sg.getContainerType().getCode());
            sgDto.setLabelLetter(sg.getContainerType().getLabelLetter());
            sgDto.setNumContainers(sg.getNumContainers());
            sgDto.setDayOffset(sg.getDayOffset());
            return sgDto;
        }).collect(Collectors.toList());
        response.setSampleGroups(sgDtos);

        // Map Parameters
        List<TestParameter> parameters = parameterRepository.findByTestIdOrderBySortOrderAsc(test.getId());
        List<TestDetailResponse.ParameterDetailDTO> paramDtos = parameters.stream().map(param -> {
            TestDetailResponse.ParameterDetailDTO pDto = new TestDetailResponse.ParameterDetailDTO();
            pDto.setId(param.getId());
            pDto.setSampleGroupId(param.getSampleGroup() != null ? param.getSampleGroup().getId() : null);
            pDto.setName(param.getName());
            pDto.setResultType(param.getResultType());
            pDto.setUnit(param.getUnit());
            pDto.setDecimalPlaces(param.getDecimalPlaces());
            pDto.setSortOrder(param.getSortOrder());
            pDto.setIsActive(param.getIsActive());

            // Male Limits
            pDto.setMaleMinRange(param.getMaleMinRange());
            pDto.setMaleMaxRange(param.getMaleMaxRange());
            pDto.setMaleCriticalLow(param.getMaleCriticalLow());
            pDto.setMaleCriticalHigh(param.getMaleCriticalHigh());

            // Female Limits
            pDto.setFemaleMinRange(param.getFemaleMinRange());
            pDto.setFemaleMaxRange(param.getFemaleMaxRange());
            pDto.setFemaleCriticalLow(param.getFemaleCriticalLow());
            pDto.setFemaleCriticalHigh(param.getFemaleCriticalHigh());

            // Choice options
            pDto.setPossibleOptions(param.getPossibleOptions());
            pDto.setAbnormalOptions(param.getAbnormalOptions());

            return pDto;
        }).collect(Collectors.toList());
        response.setParameters(paramDtos);

        return response;
    }

    /**
     * Retrieves all active specimen container types for catalog configuration dropdowns.
     */
    @Override
    public List<ContainerType> getAllContainerTypes() {
        return containerTypeRepository.findByIsActiveTrue();
    }

    /**
     * Creates a new laboratory test with its sample groups and parameters.
     */
    @Override
    @Transactional
    public LabTest createTest(CreateTestRequest request) {
        if (testRepository.findByCode(request.getCode()).isPresent()) {
            throw new IllegalArgumentException("Test with code '" + request.getCode() + "' already exists.");
        }

        validateTestRequest(request);

        // 1. Create and save LabTest
        LabTest test = new LabTest();
        test.setName(request.getName().trim());
        test.setCode(request.getCode().trim().toUpperCase());
        test.setCategory(request.getCategory().trim());
        test.setDescription(request.getDescription());
        test = testRepository.save(test);

        // 2. Create and save SampleGroups
        Map<String, SampleGroup> groupMap = new HashMap<>();
        SampleGroup singleGroup = null;

        if (request.getSampleGroups() != null) {
            for (SampleGroupDTO sgDto : request.getSampleGroups()) {
                ContainerType container = containerTypeRepository.findById(sgDto.getContainerTypeId())
                        .orElseThrow(() -> new IllegalArgumentException("Invalid container type ID: " + sgDto.getContainerTypeId()));

                SampleGroup sg = new SampleGroup();
                sg.setTest(test);
                sg.setSampleType(sgDto.getSampleType());
                sg.setContainerType(container);
                sg.setNumContainers(sgDto.getNumContainers() != null ? sgDto.getNumContainers() : 1);
                sg.setDayOffset(sgDto.getDayOffset() != null ? sgDto.getDayOffset() : 0);
                sg = sampleGroupRepository.save(sg);

                if (sgDto.getKey() != null && !sgDto.getKey().trim().isEmpty()) {
                    groupMap.put(sgDto.getKey().trim(), sg);
                }
                singleGroup = sg;
            }
        }

        // 3. Create and save Parameters
        if (request.getParameters() != null) {
            boolean multiGroups = request.getSampleGroups() != null && request.getSampleGroups().size() > 1;

            for (ParameterDTO paramDto : request.getParameters()) {
                TestParameter param = new TestParameter();
                param.setTest(test);
                param.setName(paramDto.getName().trim());

                TestParameter.ResultType resultType = TestParameter.ResultType.NUMBER;
                if (paramDto.getResultType() != null) {
                    try {
                        resultType = TestParameter.ResultType.valueOf(paramDto.getResultType().trim().toUpperCase());
                    } catch (IllegalArgumentException e) {
                        throw new IllegalArgumentException("Invalid result type '" + paramDto.getResultType() + "' for parameter '" + paramDto.getName() + "'.");
                    }
                }
                param.setResultType(resultType);
                param.setUnit(paramDto.getUnit());
                param.setDecimalPlaces(paramDto.getDecimalPlaces());
                param.setSortOrder(paramDto.getSortOrder() != null ? paramDto.getSortOrder() : 1);

                // Assign SampleGroup
                if (multiGroups) {
                    SampleGroup assignedGroup = groupMap.get(paramDto.getSampleGroupKey());
                    param.setSampleGroup(assignedGroup);
                } else if (singleGroup != null) {
                    param.setSampleGroup(singleGroup);
                }

                // Reference Ranges directly on parameter
                if (resultType == TestParameter.ResultType.NUMBER) {
                    param.setMaleMinRange(paramDto.getMaleMinRange());
                    param.setMaleMaxRange(paramDto.getMaleMaxRange());
                    param.setMaleCriticalLow(paramDto.getMaleCriticalLow());
                    param.setMaleCriticalHigh(paramDto.getMaleCriticalHigh());

                    param.setFemaleMinRange(paramDto.getFemaleMinRange());
                    param.setFemaleMaxRange(paramDto.getFemaleMaxRange());
                    param.setFemaleCriticalLow(paramDto.getFemaleCriticalLow());
                    param.setFemaleCriticalHigh(paramDto.getFemaleCriticalHigh());
                } else if (resultType == TestParameter.ResultType.CHOICE) {
                    param.setPossibleOptions(paramDto.getPossibleOptions());
                    param.setAbnormalOptions(paramDto.getAbnormalOptions());
                }

                parameterRepository.save(param);
            }
        }

        return test;
    }

    /**
     * Fully updates an existing test definition.
     */
    @Override
    @Transactional
    public LabTest updateTest(Long id, CreateTestRequest request) {
        LabTest test = testRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Test with ID " + id + " not found."));

        // If code changed, check uniqueness
        Optional<LabTest> existingWithCode = testRepository.findByCode(request.getCode().trim().toUpperCase());
        if (existingWithCode.isPresent() && !existingWithCode.get().getId().equals(id)) {
            throw new IllegalArgumentException("Test with code '" + request.getCode() + "' already exists.");
        }

        validateTestRequest(request);

        // Update basic test info
        test.setName(request.getName().trim());
        test.setCode(request.getCode().trim().toUpperCase());
        test.setCategory(request.getCategory().trim());
        test.setDescription(request.getDescription());
        test = testRepository.save(test);

        // Delete existing parameters and sample groups
        List<TestParameter> oldParams = parameterRepository.findByTestIdOrderBySortOrderAsc(test.getId());
        parameterRepository.deleteAll(oldParams);

        List<SampleGroup> oldGroups = sampleGroupRepository.findByTestId(test.getId());
        sampleGroupRepository.deleteAll(oldGroups);

        // Recreate sample groups
        Map<String, SampleGroup> groupMap = new HashMap<>();
        SampleGroup singleGroup = null;

        if (request.getSampleGroups() != null) {
            for (SampleGroupDTO sgDto : request.getSampleGroups()) {
                ContainerType container = containerTypeRepository.findById(sgDto.getContainerTypeId())
                        .orElseThrow(() -> new IllegalArgumentException("Invalid container type ID: " + sgDto.getContainerTypeId()));

                SampleGroup sg = new SampleGroup();
                sg.setTest(test);
                sg.setSampleType(sgDto.getSampleType());
                sg.setContainerType(container);
                sg.setNumContainers(sgDto.getNumContainers() != null ? sgDto.getNumContainers() : 1);
                sg.setDayOffset(sgDto.getDayOffset() != null ? sgDto.getDayOffset() : 0);
                sg = sampleGroupRepository.save(sg);

                if (sgDto.getKey() != null && !sgDto.getKey().trim().isEmpty()) {
                    groupMap.put(sgDto.getKey().trim(), sg);
                }
                singleGroup = sg;
            }
        }

        // Recreate parameters
        if (request.getParameters() != null) {
            boolean multiGroups = request.getSampleGroups() != null && request.getSampleGroups().size() > 1;

            for (ParameterDTO paramDto : request.getParameters()) {
                TestParameter param = new TestParameter();
                param.setTest(test);
                param.setName(paramDto.getName().trim());

                TestParameter.ResultType resultType = TestParameter.ResultType.NUMBER;
                if (paramDto.getResultType() != null) {
                    resultType = TestParameter.ResultType.valueOf(paramDto.getResultType().trim().toUpperCase());
                }
                param.setResultType(resultType);
                param.setUnit(paramDto.getUnit());
                param.setDecimalPlaces(paramDto.getDecimalPlaces());
                param.setSortOrder(paramDto.getSortOrder() != null ? paramDto.getSortOrder() : 1);

                if (multiGroups) {
                    param.setSampleGroup(groupMap.get(paramDto.getSampleGroupKey()));
                } else if (singleGroup != null) {
                    param.setSampleGroup(singleGroup);
                }

                if (resultType == TestParameter.ResultType.NUMBER) {
                    param.setMaleMinRange(paramDto.getMaleMinRange());
                    param.setMaleMaxRange(paramDto.getMaleMaxRange());
                    param.setMaleCriticalLow(paramDto.getMaleCriticalLow());
                    param.setMaleCriticalHigh(paramDto.getMaleCriticalHigh());

                    param.setFemaleMinRange(paramDto.getFemaleMinRange());
                    param.setFemaleMaxRange(paramDto.getFemaleMaxRange());
                    param.setFemaleCriticalLow(paramDto.getFemaleCriticalLow());
                    param.setFemaleCriticalHigh(paramDto.getFemaleCriticalHigh());
                } else if (resultType == TestParameter.ResultType.CHOICE) {
                    param.setPossibleOptions(paramDto.getPossibleOptions());
                    param.setAbnormalOptions(paramDto.getAbnormalOptions());
                }

                parameterRepository.save(param);
            }
        }

        return test;
    }

    /**
     * Activates or deactivates a test. Deactivated tests remain on old orders but are
     * hidden from new order selection.
     */
    @Override
    @Transactional
    public void setActiveStatus(Long id, boolean active) {
        LabTest test = testRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Test with ID " + id + " not found."));
        test.setIsActive(active);
        testRepository.save(test);
    }

    /**
     * Validates input parameters according to system business rules.
     */
    private void validateTestRequest(CreateTestRequest request) {
        if (request.getName() == null || request.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Test name cannot be empty.");
        }
        if (request.getCode() == null || request.getCode().trim().isEmpty()) {
            throw new IllegalArgumentException("Test code cannot be empty.");
        }
        if (request.getCategory() == null || request.getCategory().trim().isEmpty()) {
            throw new IllegalArgumentException("Test category cannot be empty.");
        }

        boolean hasMultipleSampleGroups = request.getSampleGroups() != null && request.getSampleGroups().size() > 1;
        Set<String> validGroupKeys = new HashSet<>();
        if (request.getSampleGroups() != null) {
            for (SampleGroupDTO sg : request.getSampleGroups()) {
                if (sg.getKey() != null && !sg.getKey().trim().isEmpty()) {
                    validGroupKeys.add(sg.getKey().trim());
                }
            }
        }

        if (request.getParameters() != null) {
            for (ParameterDTO param : request.getParameters()) {
                if (param.getName() == null || param.getName().trim().isEmpty()) {
                    throw new IllegalArgumentException("Parameter name cannot be empty.");
                }

                if (hasMultipleSampleGroups) {
                    if (param.getSampleGroupKey() == null || param.getSampleGroupKey().trim().isEmpty()) {
                        throw new IllegalArgumentException("Parameter '" + param.getName() + "' must be assigned to a sample group because this test has multiple groups.");
                    }
                    if (!validGroupKeys.contains(param.getSampleGroupKey().trim())) {
                        throw new IllegalArgumentException("Parameter '" + param.getName() + "' references non-existent sample group key '" + param.getSampleGroupKey() + "'.");
                    }
                }

                String resultTypeStr = param.getResultType() != null ? param.getResultType().trim().toUpperCase() : "NUMBER";

                if ("CHOICE".equals(resultTypeStr)) {
                    if (param.getPossibleOptions() == null || param.getPossibleOptions().trim().isEmpty()) {
                        throw new IllegalArgumentException("Parameter '" + param.getName() + "' is of type CHOICE but has no options defined.");
                    }
                    if (param.getMaleMinRange() != null || param.getMaleMaxRange() != null ||
                        param.getFemaleMinRange() != null || param.getFemaleMaxRange() != null) {
                        throw new IllegalArgumentException("Reference ranges cannot be set on parameter '" + param.getName() + "' because its result type is not NUMBER.");
                    }
                } else if ("TEXT".equals(resultTypeStr)) {
                    if (param.getMaleMinRange() != null || param.getMaleMaxRange() != null ||
                        param.getFemaleMinRange() != null || param.getFemaleMaxRange() != null) {
                        throw new IllegalArgumentException("Reference ranges cannot be set on parameter '" + param.getName() + "' because its result type is not NUMBER.");
                    }
                } else if ("NUMBER".equals(resultTypeStr)) {
                    if (param.getMaleMinRange() != null && param.getMaleMaxRange() != null &&
                        param.getMaleMinRange().compareTo(param.getMaleMaxRange()) > 0) {
                        throw new IllegalArgumentException("Male reference range lower limit cannot be greater than upper limit for parameter '" + param.getName() + "'.");
                    }
                    if (param.getFemaleMinRange() != null && param.getFemaleMaxRange() != null &&
                        param.getFemaleMinRange().compareTo(param.getFemaleMaxRange()) > 0) {
                        throw new IllegalArgumentException("Female reference range lower limit cannot be greater than upper limit for parameter '" + param.getName() + "'.");
                    }
                }
            }
        }
    }
}
