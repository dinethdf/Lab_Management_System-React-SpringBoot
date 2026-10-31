package com.hospital.lms.result.services;

import com.hospital.lms.auth.models.User;
import com.hospital.lms.auth.repositories.UserRepository;
import com.hospital.lms.catalog.models.TestParameter;
import com.hospital.lms.catalog.repositories.TestParameterRepository;
import com.hospital.lms.catalog.utils.RangeSelector;
import com.hospital.lms.order.models.Container;
import com.hospital.lms.order.models.OrderTest;
import com.hospital.lms.order.repositories.ContainerRepository;
import com.hospital.lms.order.repositories.OrderTestRepository;
import com.hospital.lms.patient.models.Patient;
import com.hospital.lms.result.dtos.*;
import com.hospital.lms.result.models.ResultValue;
import com.hospital.lms.result.models.TestResult;
import com.hospital.lms.result.models.TestResult.ResultStatus;
import com.hospital.lms.result.repositories.TestResultRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service managing diagnostic result entry, snapshot freezing, server-side
 * abnormal/critical flag calculations, and verification workflows.
 */
@Service
public class ResultService {

    private final TestResultRepository testResultRepository;
    private final OrderTestRepository orderTestRepository;
    private final TestParameterRepository parameterRepository;
    private final UserRepository userRepository;
    private final ContainerRepository containerRepository;

    @Autowired
    public ResultService(TestResultRepository testResultRepository,
                         OrderTestRepository orderTestRepository,
                         TestParameterRepository parameterRepository,
                         UserRepository userRepository,
                         ContainerRepository containerRepository) {
        this.testResultRepository = testResultRepository;
        this.orderTestRepository = orderTestRepository;
        this.parameterRepository = parameterRepository;
        this.userRepository = userRepository;
        this.containerRepository = containerRepository;
    }

    public ResultService(TestResultRepository testResultRepository,
                         OrderTestRepository orderTestRepository,
                         TestParameterRepository parameterRepository,
                         UserRepository userRepository) {
        this(testResultRepository, orderTestRepository, parameterRepository, userRepository, null);
    }

    /**
     * Resolves an order test by container barcode or test sample code, and prepares
     * the result entry form populated with patient demographics, test parameters,
     * options, and sex-matched reference ranges.
     */
    @Transactional(readOnly = true)
    public ResultFormDataDTO getResultFormByCode(String rawBarcode) {
        if (rawBarcode == null || rawBarcode.trim().isEmpty()) {
            throw new IllegalArgumentException("Barcode or sample code cannot be empty.");
        }

        String searchCode = rawBarcode.trim();
        OrderTest orderTest = null;

        // 1. Check if scanning a pre-printed SC container sticker (e.g. SC00001)
        if (containerRepository != null) {
            Optional<Container> containerOpt = containerRepository.findByContainerCode(searchCode);
            if (containerOpt.isPresent()) {
                Container container = containerOpt.get();
                if (container.getStatus() == Container.ContainerStatus.REJECTED) {
                    throw new IllegalArgumentException("Container '" + searchCode + "' was REJECTED at lab receipt due to sample defect: " + container.getRejectionReason());
                }
                orderTest = container.getOrderTest();
            }
        }

        // 2. If not an SC sticker, check if scanning a legacy container code (e.g. TSC-00456-01-P1)
        if (orderTest == null) {
            if (searchCode.matches("TSC-\\d+-\\d+-[A-Z]\\d+")) {
                int lastHyphen = searchCode.lastIndexOf('-');
                searchCode = searchCode.substring(0, lastHyphen);
            }
            orderTest = orderTestRepository.findByTestSampleCode(searchCode)
                    .orElseThrow(() -> new IllegalArgumentException("No laboratory order test found for code: " + rawBarcode));
        }

        Patient patient = orderTest.getTestOrder().getPatient();
        int ageDays = (int) ChronoUnit.DAYS.between(patient.getDateOfBirth(), LocalDate.now());
        int ageYears = (int) ChronoUnit.YEARS.between(patient.getDateOfBirth(), LocalDate.now());
        String patientSex = patient.getGender() != null ? patient.getGender().toUpperCase() : "MALE";

        ResultFormDataDTO form = new ResultFormDataDTO();
        form.setOrderTestId(orderTest.getId());
        form.setTestSampleCode(orderTest.getTestSampleCode());
        form.setTestId(orderTest.getTest().getId());
        form.setTestName(orderTest.getTest().getName());
        form.setTestCategory(orderTest.getTest().getCategory());

        form.setPatientId(patient.getId());
        form.setPatientName(patient.getFullName());
        form.setPatientAgeYears(ageYears);
        form.setPatientAgeDays(ageDays);
        form.setPatientSex(patientSex);
        form.setPatientContact(patient.getContactNumber());

        // Check if a result already exists for this test
        Optional<TestResult> existingResultOpt = testResultRepository.findByOrderTestId(orderTest.getId());
        Map<Long, ResultValue> existingValuesMap = new HashMap<>();

        if (existingResultOpt.isPresent()) {
            TestResult existingResult = existingResultOpt.get();
            form.setResultId(existingResult.getId());
            form.setStatus(existingResult.getStatus().name());
            form.setNotes(existingResult.getNotes());
            form.setRejectionReason(existingResult.getRejectionReason());

            for (ResultValue rv : existingResult.getValues()) {
                existingValuesMap.put(rv.getParameter().getId(), rv);
            }
        } else {
            form.setStatus("PENDING_ENTRY");
        }

        // Load test parameters and reference ranges
        List<TestParameter> params = parameterRepository.findByTestIdOrderBySortOrderAsc(orderTest.getTest().getId());
        List<ResultFormDataDTO.ResultFormParameterDTO> paramDtos = new ArrayList<>();

        for (TestParameter p : params) {
            ResultFormDataDTO.ResultFormParameterDTO pDto = new ResultFormDataDTO.ResultFormParameterDTO();
            pDto.setParameterId(p.getId());
            pDto.setSampleGroupId(p.getSampleGroup() != null ? p.getSampleGroup().getId() : null);
            pDto.setParameterName(p.getName());
            pDto.setResultType(p.getResultType());
            pDto.setUnit(p.getUnit());
            pDto.setDecimalPlaces(p.getDecimalPlaces());
            pDto.setSortOrder(p.getSortOrder());

            // If draft exists, pre-fill entered value
            ResultValue existingVal = existingValuesMap.get(p.getId());
            if (existingVal != null) {
                pDto.setCurrentNumericValue(existingVal.getNumericValue());
                pDto.setCurrentTextValue(existingVal.getTextValue());
                pDto.setCurrentChoiceValue(existingVal.getChoiceValue());
                pDto.setIsAbnormal(existingVal.getIsAbnormal());
                pDto.setIsCritical(existingVal.getIsCritical());
            }

            // Options for CHOICE type
            if (p.getResultType() == TestParameter.ResultType.CHOICE && p.getPossibleOptions() != null) {
                Set<String> abnormalSet = new HashSet<>();
                if (p.getAbnormalOptions() != null) {
                    Arrays.stream(p.getAbnormalOptions().split(","))
                            .map(String::trim)
                            .filter(s -> !s.isEmpty())
                            .forEach(s -> abnormalSet.add(s.toLowerCase()));
                }

                List<ResultFormDataDTO.FormOptionDTO> optDtos = Arrays.stream(p.getPossibleOptions().split(","))
                        .map(String::trim)
                        .filter(s -> !s.isEmpty())
                        .map(label -> {
                            ResultFormDataDTO.FormOptionDTO optDto = new ResultFormDataDTO.FormOptionDTO();
                            optDto.setLabel(label);
                            optDto.setIsAbnormal(abnormalSet.contains(label.toLowerCase()));
                            return optDto;
                        }).collect(Collectors.toList());
                pDto.setOptions(optDtos);
            }

            // Reference range matching for NUMBER type
            if (p.getResultType() == TestParameter.ResultType.NUMBER) {
                Optional<RangeSelector.RangeLimits> matchedRange = RangeSelector.findMatchingRange(p, patientSex);
                if (matchedRange.isPresent()) {
                    RangeSelector.RangeLimits r = matchedRange.get();
                    pDto.setRefLower(r.getLowerLimit());
                    pDto.setRefUpper(r.getUpperLimit());
                    pDto.setCriticalLow(r.getCriticalLow());
                    pDto.setCriticalHigh(r.getCriticalHigh());
                }
            }

            paramDtos.add(pDto);
        }

        form.setParameters(paramDtos);
        return form;
    }

    /**
     * Saves or updates a draft result. Freezes parameter metadata and calculates
     * abnormal and critical flags on the server.
     */
    @Transactional
    public TestResult saveDraft(SaveResultRequestDTO request, String username) {
        User labTech = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + username));

        OrderTest orderTest = orderTestRepository.findById(request.getOrderTestId())
                .orElseThrow(() -> new IllegalArgumentException("Order test not found with ID: " + request.getOrderTestId()));

        TestResult testResult = testResultRepository.findByOrderTestId(orderTest.getId())
                .orElse(new TestResult());

        // Validate state transitions: only DRAFT, REJECTED, or new result can be edited
        if (testResult.getId() != null) {
            if (testResult.getStatus() == ResultStatus.APPROVED) {
                throw new IllegalArgumentException("Approved results are finalized and cannot be modified.");
            }
            if (testResult.getStatus() == ResultStatus.SUBMITTED) {
                throw new IllegalArgumentException("Result is currently pending senior verification and cannot be edited.");
            }
        }

        Patient patient = orderTest.getTestOrder().getPatient();
        int ageDays = (int) ChronoUnit.DAYS.between(patient.getDateOfBirth(), LocalDate.now());
        String patientSex = patient.getGender() != null ? patient.getGender().toUpperCase() : "MALE";

        testResult.setOrderTest(orderTest);
        testResult.setEnteredBy(labTech);
        testResult.setStatus(ResultStatus.DRAFT);
        testResult.setNotes(request.getNotes());
        testResult.setPatientAgeDays(ageDays);
        testResult.setPatientSex(patientSex);

        // Clear existing values and re-populate
        testResult.getValues().clear();

        if (request.getValues() != null) {
            for (SaveResultRequestDTO.ParameterValueDTO valDto : request.getValues()) {
                TestParameter param = parameterRepository.findById(valDto.getParameterId())
                        .orElseThrow(() -> new IllegalArgumentException("Parameter not found with ID: " + valDto.getParameterId()));

                ResultValue rv = new ResultValue();
                rv.setTestResult(testResult);
                rv.setParameter(param);
                rv.setParameterName(param.getName());
                rv.setParameterUnit(param.getUnit());
                rv.setResultType(param.getResultType());

                if (param.getResultType() == TestParameter.ResultType.NUMBER) {
                    rv.setNumericValue(valDto.getNumericValue());

                    Optional<RangeSelector.RangeLimits> matchedRangeOpt = RangeSelector.findMatchingRange(param, patientSex);

                    boolean isAbnormal = false;
                    boolean isCritical = false;

                    if (matchedRangeOpt.isPresent()) {
                        RangeSelector.RangeLimits r = matchedRangeOpt.get();
                        rv.setRefLower(r.getLowerLimit());
                        rv.setRefUpper(r.getUpperLimit());
                        rv.setCriticalLow(r.getCriticalLow());
                        rv.setCriticalHigh(r.getCriticalHigh());

                        if (valDto.getNumericValue() != null) {
                            BigDecimal val = valDto.getNumericValue();

                            // Normal range limits
                            if (r.getLowerLimit() != null && val.compareTo(r.getLowerLimit()) < 0) {
                                isAbnormal = true;
                            }
                            if (r.getUpperLimit() != null && val.compareTo(r.getUpperLimit()) > 0) {
                                isAbnormal = true;
                            }

                            // Critical panic limits
                            if (r.getCriticalLow() != null && val.compareTo(r.getCriticalLow()) < 0) {
                                isCritical = true;
                            }
                            if (r.getCriticalHigh() != null && val.compareTo(r.getCriticalHigh()) > 0) {
                                isCritical = true;
                            }
                        }
                    }

                    rv.setIsAbnormal(isAbnormal);
                    rv.setIsCritical(isCritical);

                } else if (param.getResultType() == TestParameter.ResultType.CHOICE) {
                    rv.setChoiceValue(valDto.getChoiceValue());

                    boolean isAbnormal = false;
                    if (valDto.getChoiceValue() != null && param.getAbnormalOptions() != null) {
                        String chosen = valDto.getChoiceValue().trim().toLowerCase();
                        isAbnormal = Arrays.stream(param.getAbnormalOptions().split(","))
                                .map(String::trim)
                                .anyMatch(s -> s.equalsIgnoreCase(chosen));
                    }
                    rv.setIsAbnormal(isAbnormal);
                    rv.setIsCritical(false);

                } else if (param.getResultType() == TestParameter.ResultType.TEXT) {
                    rv.setTextValue(valDto.getTextValue());
                    rv.setIsAbnormal(false);
                    rv.setIsCritical(false);
                }

                testResult.addValue(rv);
            }
        }

        TestResult saved = testResultRepository.save(testResult);

        // Advance associated specimen container slots to RESULT_ENTERED
        if (containerRepository != null && orderTest.getId() != null) {
            List<Container> containers = containerRepository.findByOrderTest_Id(orderTest.getId());
            for (Container c : containers) {
                if (c.getStatus() == Container.ContainerStatus.COLLECTED || c.getStatus() == Container.ContainerStatus.RECEIVED_AT_LAB) {
                    c.setStatus(Container.ContainerStatus.RESULT_ENTERED);
                    containerRepository.save(c);
                }
            }
        }

        return saved;
    }

    /**
     * Submits a draft or corrected result for Senior Lab Technician verification.
     */
    @Transactional
    public TestResult submitForVerification(Long resultId, String username) {
        TestResult result = testResultRepository.findById(resultId)
                .orElseThrow(() -> new IllegalArgumentException("Test result not found with ID: " + resultId));

        if (result.getStatus() == ResultStatus.APPROVED) {
            throw new IllegalArgumentException("Cannot submit an already approved result.");
        }
        if (result.getStatus() == ResultStatus.SUBMITTED) {
            throw new IllegalArgumentException("Result is already submitted and pending verification.");
        }

        result.setStatus(ResultStatus.SUBMITTED);
        result.setSubmittedAt(LocalDateTime.now());
        result.setRejectionReason(null);
        return testResultRepository.save(result);
    }

    /**
     * Retrieves all results currently pending verification (SUBMITTED status).
     */
    @Transactional(readOnly = true)
    public List<TestResultSummaryDTO> getPendingVerificationResults() {
        return testResultRepository.findByStatusOrderBySubmittedAtDesc(ResultStatus.SUBMITTED)
                .stream()
                .map(this::mapToSummaryDTO)
                .collect(Collectors.toList());
    }

    /**
     * Approves a submitted test result.
     * Enforces Decision D3: Senior Lab Tech cannot verify a result they entered themselves.
     */
    @Transactional
    public TestResult approveResult(Long resultId, String username) {
        User seniorTech = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + username));

        TestResult result = testResultRepository.findById(resultId)
                .orElseThrow(() -> new IllegalArgumentException("Test result not found with ID: " + resultId));

        // Self-verification block (D3)
        if (result.getEnteredBy().getId().equals(seniorTech.getId())) {
            throw new IllegalArgumentException("Forbidden: You cannot verify or approve a result you entered yourself.");
        }

        if (result.getStatus() != ResultStatus.SUBMITTED) {
            throw new IllegalArgumentException("Only SUBMITTED results can be approved. Current status: " + result.getStatus());
        }

        result.setStatus(ResultStatus.APPROVED);
        result.setVerifiedBy(seniorTech);
        result.setVerifiedAt(LocalDateTime.now());
        TestResult saved = testResultRepository.save(result);

        // Advance associated specimen container slots to VERIFIED
        if (containerRepository != null && result.getOrderTest() != null && result.getOrderTest().getId() != null) {
            List<Container> containers = containerRepository.findByOrderTest_Id(result.getOrderTest().getId());
            for (Container c : containers) {
                if (c.getStatus() == Container.ContainerStatus.RESULT_ENTERED ||
                        c.getStatus() == Container.ContainerStatus.RECEIVED_AT_LAB ||
                        c.getStatus() == Container.ContainerStatus.COLLECTED) {
                    c.setStatus(Container.ContainerStatus.VERIFIED);
                    containerRepository.save(c);
                }
            }
        }

        return saved;
    }

    /**
     * Rejects a submitted test result with a required explanation reason.
     * Enforces Decision D3: Senior Lab Tech cannot verify/reject a result they entered themselves.
     */
    @Transactional
    public TestResult rejectResult(Long resultId, String reason, String username) {
        if (reason == null || reason.trim().isEmpty()) {
            throw new IllegalArgumentException("A rejection reason is required when rejecting results.");
        }

        User seniorTech = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + username));

        TestResult result = testResultRepository.findById(resultId)
                .orElseThrow(() -> new IllegalArgumentException("Test result not found with ID: " + resultId));

        // Self-verification block (D3)
        if (result.getEnteredBy().getId().equals(seniorTech.getId())) {
            throw new IllegalArgumentException("Forbidden: You cannot reject a result you entered yourself.");
        }

        if (result.getStatus() != ResultStatus.SUBMITTED) {
            throw new IllegalArgumentException("Only SUBMITTED results can be rejected. Current status: " + result.getStatus());
        }

        result.setStatus(ResultStatus.REJECTED);
        result.setRejectionReason(reason.trim());
        result.setVerifiedBy(seniorTech);
        result.setVerifiedAt(LocalDateTime.now());
        return testResultRepository.save(result);
    }

    /**
     * Retrieves results entered by the current technician to see DRAFT, REJECTED,
     * and SUBMITTED entries.
     */
    @Transactional(readOnly = true)
    public List<TestResultSummaryDTO> getMyResults(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + username));

        return testResultRepository.findByEnteredByIdOrderByUpdatedAtDesc(user.getId())
                .stream()
                .map(this::mapToSummaryDTO)
                .collect(Collectors.toList());
    }

    private TestResultSummaryDTO mapToSummaryDTO(TestResult tr) {
        TestResultSummaryDTO dto = new TestResultSummaryDTO();
        dto.setId(tr.getId());
        dto.setOrderTestId(tr.getOrderTest().getId());
        dto.setTestSampleCode(tr.getOrderTest().getTestSampleCode());
        dto.setTestName(tr.getOrderTest().getTest().getName());
        dto.setTestCategory(tr.getOrderTest().getTest().getCategory());

        Patient patient = tr.getOrderTest().getTestOrder().getPatient();
        dto.setPatientName(patient.getFullName());
        dto.setPatientSex(patient.getGender());
        dto.setPatientAgeYears((int) ChronoUnit.YEARS.between(patient.getDateOfBirth(), LocalDate.now()));

        dto.setEnteredById(tr.getEnteredBy().getId());
        dto.setEnteredByUsername(tr.getEnteredBy().getUsername());
        dto.setStatus(tr.getStatus().name());
        dto.setNotes(tr.getNotes());
        dto.setRejectionReason(tr.getRejectionReason());
        dto.setSubmittedAt(tr.getSubmittedAt());
        dto.setVerifiedAt(tr.getVerifiedAt());

        int abnormal = 0;
        int critical = 0;
        for (ResultValue val : tr.getValues()) {
            if (Boolean.TRUE.equals(val.getIsAbnormal())) abnormal++;
            if (Boolean.TRUE.equals(val.getIsCritical())) critical++;
        }
        dto.setAbnormalCount(abnormal);
        dto.setCriticalCount(critical);

        return dto;
    }
}
