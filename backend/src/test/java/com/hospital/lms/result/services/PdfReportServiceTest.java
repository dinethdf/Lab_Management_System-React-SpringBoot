package com.hospital.lms.result.services;

import com.hospital.lms.auth.models.Role;
import com.hospital.lms.auth.models.User;
import com.hospital.lms.catalog.models.LabTest;
import com.hospital.lms.order.models.OrderTest;
import com.hospital.lms.order.models.TestOrder;
import com.hospital.lms.patient.models.Patient;
import com.hospital.lms.result.models.Report;
import com.hospital.lms.result.models.ResultValue;
import com.hospital.lms.result.models.TestResult;
import com.hospital.lms.result.models.TestResult.ResultStatus;
import com.hospital.lms.result.repositories.ReportRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

class PdfReportServiceTest {

    private ReportRepository reportRepository;
    private PdfReportService pdfReportService;

    @BeforeEach
    void setUp() {
        reportRepository = Mockito.mock(ReportRepository.class);
        pdfReportService = new PdfReportService(reportRepository);
    }

    @Test
    @DisplayName("Should successfully generate a valid PDF byte array for an approved result with Normal, Abnormal, and Critical parameters")
    void testGenerateReportPdfSuccess() {
        TestResult testResult = createSampleTestResult(ResultStatus.APPROVED);

        byte[] pdfBytes = pdfReportService.generateReportPdf(testResult);

        assertNotNull(pdfBytes, "PDF byte array must not be null");
        assertTrue(pdfBytes.length > 500, "PDF byte array must be a valid document length");

        // First 4 bytes of a valid PDF document must be "%PDF"
        String header = new String(pdfBytes, 0, 4);
        assertEquals("%PDF", header, "Generated document must have standard %PDF header");
    }

    @Test
    @DisplayName("Should save report entity and write PDF to disk when result is APPROVED")
    void testGenerateAndSaveReportSuccess() {
        TestResult testResult = createSampleTestResult(ResultStatus.APPROVED);
        User seniorTech = testResult.getVerifiedBy();

        when(reportRepository.findByTestResult_Id(testResult.getId())).thenReturn(Optional.empty());
        when(reportRepository.save(any(Report.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Report saved = pdfReportService.generateAndSaveReport(testResult, seniorTech);

        assertNotNull(saved, "Report record must be returned");
        assertEquals(testResult, saved.getTestResult(), "Report must be linked to test result");
        assertNotNull(saved.getReportNumber(), "Report number must be generated");
        assertTrue(saved.getReportNumber().startsWith("RPT-"), "Report number must start with RPT-");
        assertNotNull(saved.getPdfPath(), "PDF storage path must be populated");
        assertEquals(seniorTech, saved.getApprovedBy(), "Approver must be recorded");
    }

    @Test
    @DisplayName("Should reject report generation if result is not in APPROVED status")
    void testGenerateAndSaveReportFailsIfNotApproved() {
        TestResult draftResult = createSampleTestResult(ResultStatus.DRAFT);
        User seniorTech = draftResult.getVerifiedBy();

        assertThrows(IllegalStateException.class, () ->
                pdfReportService.generateAndSaveReport(draftResult, seniorTech)
        );
    }

    private TestResult createSampleTestResult(ResultStatus status) {
        Patient patient = new Patient();
        patient.setId(101L);
        patient.setFullName("Sunil Perera");
        patient.setGender("MALE");
        patient.setDateOfBirth(LocalDate.of(1985, 5, 20));
        patient.setContactNumber("0771234567");
        patient.setReferringDoctor("Dr. Nimal Silva");

        TestOrder order = new TestOrder();
        order.setId(201L);
        order.setPatient(patient);
        order.setLabSlipBarcode("LS-2026-00042");
        order.setCreatedAt(LocalDateTime.now().minusHours(3));

        LabTest test = new LabTest();
        test.setId(301L);
        test.setName("Full Blood Count (FBC)");
        test.setCode("FBC");
        test.setCategory("Haematology");

        OrderTest orderTest = new OrderTest();
        orderTest.setId(401L);
        orderTest.setTestOrder(order);
        orderTest.setTest(test);
        orderTest.setTestSampleCode("TSC-00042-01");

        User labTech = new User();
        labTech.setId(1L);
        labTech.setUsername("labtech@gmail.com");
        labTech.setRole(Role.LAB_TECHNICIAN);

        User seniorTech = new User();
        seniorTech.setId(2L);
        seniorTech.setUsername("seniorlabtech@gmail.com");
        seniorTech.setRole(Role.SENIOR_LAB_TECHNICIAN);

        TestResult result = new TestResult();
        result.setId(501L);
        result.setOrderTest(orderTest);
        result.setEnteredBy(labTech);
        result.setVerifiedBy(seniorTech);
        result.setStatus(status);
        result.setNotes("Specimen processed on automated hematology analyzer Sysmex XN-550.");
        result.setPatientAgeDays(39 * 365);
        result.setPatientSex("MALE");
        result.setSubmittedAt(LocalDateTime.now().minusHours(2));
        result.setVerifiedAt(LocalDateTime.now().minusHours(1));

        // Normal parameter: Hemoglobin
        ResultValue rv1 = new ResultValue();
        rv1.setParameterName("Hemoglobin");
        rv1.setParameterUnit("g/dL");
        rv1.setNumericValue(new BigDecimal("14.5"));
        rv1.setRefLower(new BigDecimal("13.0"));
        rv1.setRefUpper(new BigDecimal("17.5"));
        rv1.setIsAbnormal(false);
        rv1.setIsCritical(false);
        result.addValue(rv1);

        // Abnormal parameter: Platelet count (Elevated)
        ResultValue rv2 = new ResultValue();
        rv2.setParameterName("Platelet Count");
        rv2.setParameterUnit("10^3/uL");
        rv2.setNumericValue(new BigDecimal("480.0"));
        rv2.setRefLower(new BigDecimal("150.0"));
        rv2.setRefUpper(new BigDecimal("450.0"));
        rv2.setIsAbnormal(true);
        rv2.setIsCritical(false);
        result.addValue(rv2);

        // Critical parameter: Total White Blood Cells (Critically high)
        ResultValue rv3 = new ResultValue();
        rv3.setParameterName("White Blood Cells (WBC)");
        rv3.setParameterUnit("10^3/uL");
        rv3.setNumericValue(new BigDecimal("32.4"));
        rv3.setRefLower(new BigDecimal("4.0"));
        rv3.setRefUpper(new BigDecimal("11.0"));
        rv3.setCriticalHigh(new BigDecimal("30.0"));
        rv3.setIsAbnormal(true);
        rv3.setIsCritical(true);
        result.addValue(rv3);

        return result;
    }
}
