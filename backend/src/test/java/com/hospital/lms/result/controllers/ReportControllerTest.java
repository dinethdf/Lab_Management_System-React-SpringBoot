package com.hospital.lms.result.controllers;

import com.hospital.lms.common.dtos.MessageResponse;
import com.hospital.lms.order.models.OrderTest;
import com.hospital.lms.order.models.TestOrder;
import com.hospital.lms.patient.models.Patient;
import com.hospital.lms.result.dtos.ReportSummaryDTO;
import com.hospital.lms.result.models.Report;
import com.hospital.lms.result.models.TestResult;
import com.hospital.lms.result.models.TestResult.ResultStatus;
import com.hospital.lms.result.repositories.ReportRepository;
import com.hospital.lms.result.repositories.TestResultRepository;
import com.hospital.lms.result.services.PdfReportService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

class ReportControllerTest {

    private ReportRepository reportRepository;
    private TestResultRepository testResultRepository;
    private PdfReportService pdfReportService;
    private ReportController reportController;

    @BeforeEach
    void setUp() {
        reportRepository = Mockito.mock(ReportRepository.class);
        testResultRepository = Mockito.mock(TestResultRepository.class);
        pdfReportService = Mockito.mock(PdfReportService.class);

        reportController = new ReportController(
                reportRepository,
                testResultRepository,
                pdfReportService
        );
    }

    @Test
    @DisplayName("Should return 404 when downloading PDF for non-existent result ID")
    void testDownloadPdfResultNotFound() {
        when(testResultRepository.findById(999L)).thenReturn(Optional.empty());

        ResponseEntity<?> response = reportController.downloadReportPdfByResultId(999L);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertTrue(response.getBody() instanceof MessageResponse);
        MessageResponse msg = (MessageResponse) response.getBody();
        assertTrue(msg.getMessage().contains("not found"));
    }

    @Test
    @DisplayName("Should return 400 when downloading PDF for result that is not yet APPROVED")
    void testDownloadPdfNotApproved() {
        TestResult draftResult = new TestResult();
        draftResult.setId(100L);
        draftResult.setStatus(ResultStatus.DRAFT);

        when(testResultRepository.findById(100L)).thenReturn(Optional.of(draftResult));

        ResponseEntity<?> response = reportController.downloadReportPdfByResultId(100L);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        MessageResponse msg = (MessageResponse) response.getBody();
        assertTrue(msg.getMessage().contains("only available for APPROVED"));
    }

    @Test
    @DisplayName("Should return PDF bytes with application/pdf header when result is APPROVED")
    void testDownloadPdfSuccess() {
        TestResult approvedResult = new TestResult();
        approvedResult.setId(200L);
        approvedResult.setStatus(ResultStatus.APPROVED);

        OrderTest ot = new OrderTest();
        ot.setTestSampleCode("TSC-2026-001");
        approvedResult.setOrderTest(ot);

        byte[] samplePdf = "%PDF-1.4 sample content".getBytes();
        when(testResultRepository.findById(200L)).thenReturn(Optional.of(approvedResult));
        when(reportRepository.findByTestResult_Id(200L)).thenReturn(Optional.empty());
        when(pdfReportService.generateReportPdf(approvedResult)).thenReturn(samplePdf);

        ResponseEntity<?> response = reportController.downloadReportPdfByResultId(200L);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(MediaType.APPLICATION_PDF, response.getHeaders().getContentType());
        assertArrayEquals(samplePdf, (byte[]) response.getBody());
    }

    @Test
    @DisplayName("Should return 400 when looking up reports with blank barcode")
    void testBarcodeLookupBlank() {
        ResponseEntity<?> response = reportController.getReportsByBarcode("   ");

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
    }

    @Test
    @DisplayName("Should return 404 when barcode query matches no approved reports")
    void testBarcodeLookupNotFound() {
        when(reportRepository.findByOrderOrSampleBarcode("LS-UNKNOWN")).thenReturn(Collections.emptyList());
        when(reportRepository.findByContainerCode("LS-UNKNOWN")).thenReturn(Collections.emptyList());
        when(testResultRepository.findByOrderTest_TestSampleCode("LS-UNKNOWN")).thenReturn(Optional.empty());

        ResponseEntity<?> response = reportController.getReportsByBarcode("LS-UNKNOWN");

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
    }

    @Test
    @DisplayName("FR-7.4: Should return report DTO list when barcode matches an approved report")
    void testBarcodeLookupSuccess() {
        Patient patient = new Patient();
        patient.setId(1L);
        patient.setFullName("Kamal Perera");
        patient.setDateOfBirth(LocalDate.of(1990, 1, 1));
        patient.setGender("MALE");

        TestOrder order = new TestOrder();
        order.setPatient(patient);
        order.setLabSlipBarcode("LS-2026-00001");

        OrderTest ot = new OrderTest();
        ot.setId(10L);
        ot.setTestSampleCode("TSC-00001-01");
        ot.setTestOrder(order);

        TestResult tr = new TestResult();
        tr.setId(50L);
        tr.setStatus(ResultStatus.APPROVED);
        tr.setOrderTest(ot);

        Report report = new Report();
        report.setId(1L);
        report.setReportNumber("RPT-TSC-00001-01");
        report.setTestResult(tr);
        report.setGeneratedAt(LocalDateTime.now());

        when(reportRepository.findByOrderOrSampleBarcode("LS-2026-00001")).thenReturn(List.of(report));

        ResponseEntity<?> response = reportController.getReportsByBarcode("LS-2026-00001");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody() instanceof List<?>);
        List<?> list = (List<?>) response.getBody();
        assertEquals(1, list.size());
        ReportSummaryDTO dto = (ReportSummaryDTO) list.get(0);
        assertEquals("RPT-TSC-00001-01", dto.getReportNumber());
        assertEquals("Kamal Perera", dto.getPatientName());
    }
}
