package com.hospital.lms.result.controllers;

import com.hospital.lms.common.dtos.MessageResponse;
import com.hospital.lms.order.models.OrderTest;
import com.hospital.lms.patient.models.Patient;
import com.hospital.lms.result.dtos.ReportSummaryDTO;
import com.hospital.lms.result.models.Report;
import com.hospital.lms.result.models.ResultValue;
import com.hospital.lms.result.models.TestResult;
import com.hospital.lms.result.repositories.ReportRepository;
import com.hospital.lms.result.repositories.TestResultRepository;
import com.hospital.lms.result.services.PdfReportService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.nio.file.Files;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * ReportController — Exposes REST endpoints for streaming finalized diagnostic
 * laboratory report PDFs and querying approved reports by counter barcode.
 */
@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final ReportRepository reportRepository;
    private final TestResultRepository testResultRepository;
    private final PdfReportService pdfReportService;

    public ReportController(ReportRepository reportRepository,
                            TestResultRepository testResultRepository,
                            PdfReportService pdfReportService) {
        this.reportRepository = reportRepository;
        this.testResultRepository = testResultRepository;
        this.pdfReportService = pdfReportService;
    }

    /**
     * Streams the official PDF report by Report ID.
     */
    @GetMapping("/{id}/pdf")
    @PreAuthorize("hasAnyRole('ADMIN', 'SENIOR_LAB_TECHNICIAN', 'LAB_TECHNICIAN', 'RECEPTIONIST')")
    public ResponseEntity<?> downloadReportPdfById(@PathVariable Long id) {
        Optional<Report> reportOpt = reportRepository.findById(id);
        if (reportOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new MessageResponse("Report not found with ID: " + id));
        }

        Report report = reportOpt.get();
        return streamReportPdf(report.getTestResult(), report.getReportNumber(), report.getPdfPath());
    }

    /**
     * Streams the official PDF report directly by TestResult ID.
     */
    @GetMapping("/result/{resultId}/pdf")
    @PreAuthorize("hasAnyRole('ADMIN', 'SENIOR_LAB_TECHNICIAN', 'LAB_TECHNICIAN', 'RECEPTIONIST')")
    public ResponseEntity<?> downloadReportPdfByResultId(@PathVariable Long resultId) {
        Optional<TestResult> resultOpt = testResultRepository.findById(resultId);
        if (resultOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new MessageResponse("Test result not found with ID: " + resultId));
        }

        TestResult testResult = resultOpt.get();
        if (testResult.getStatus() != TestResult.ResultStatus.APPROVED) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new MessageResponse("Official PDF report is only available for APPROVED test results. Current status: " + testResult.getStatus()));
        }

        Optional<Report> reportOpt = reportRepository.findByTestResult_Id(resultId);
        String reportNumber = reportOpt.map(Report::getReportNumber)
                .orElse("RPT-" + testResult.getOrderTest().getTestSampleCode());
        String pdfPath = reportOpt.map(Report::getPdfPath).orElse(null);

        return streamReportPdf(testResult, reportNumber, pdfPath);
    }

    /**
     * FR-7.4: In-Person report counter lookup by barcode.
     * Accepts:
     * - Lab Slip barcode (LS-2026-XXXXX)
     * - Test Sample Code (TSC-XXXXX-XX)
     * - Specimen container code (SCXXXXX)
     */
    @GetMapping("/by-barcode/{code}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SENIOR_LAB_TECHNICIAN', 'LAB_TECHNICIAN', 'RECEPTIONIST')")
    public ResponseEntity<?> getReportsByBarcode(@PathVariable String code) {
        if (code == null || code.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(new MessageResponse("Barcode code cannot be empty."));
        }

        String query = code.trim();
        String normalizedQuery = query.toUpperCase().startsWith("PS-")
                ? "LS-" + query.substring(3)
                : query;
        List<Report> reports = new ArrayList<>(reportRepository.findByOrderOrSampleBarcode(query));
        if (reports.isEmpty() && !normalizedQuery.equals(query)) {
            reports.addAll(reportRepository.findByOrderOrSampleBarcode(normalizedQuery));
        }

        // If none found by order/sample barcode, try container code
        if (reports.isEmpty()) {
            reports = reportRepository.findByContainerCode(query);
        }

        // If still empty, check if there is an approved test result that doesn't have a report entity yet
        if (reports.isEmpty()) {
            Optional<TestResult> trOpt = testResultRepository.findByOrderTest_TestSampleCode(query);
            if (trOpt.isPresent() && trOpt.get().getStatus() == TestResult.ResultStatus.APPROVED) {
                Report rep = pdfReportService.generateAndSaveReport(trOpt.get(), trOpt.get().getVerifiedBy());
                reports.add(rep);
            } else {
                List<TestResult> orderResults = testResultRepository.findByOrderTest_TestOrder_LabSlipBarcode(normalizedQuery);
                for (TestResult tr : orderResults) {
                    if (tr.getStatus() == TestResult.ResultStatus.APPROVED) {
                        Report rep = pdfReportService.generateAndSaveReport(tr, tr.getVerifiedBy());
                        reports.add(rep);
                    }
                }
            }
        }

        if (reports.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new MessageResponse("No verified diagnostic reports found for barcode: " + query));
        }

        List<ReportSummaryDTO> dtos = reports.stream()
                .map(this::mapToSummaryDTO)
                .collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
    }

    /**
     * Retrieves the 20 most recently approved diagnostic reports.
     */
    @GetMapping("/recent")
    @PreAuthorize("hasAnyRole('ADMIN', 'SENIOR_LAB_TECHNICIAN', 'LAB_TECHNICIAN', 'RECEPTIONIST')")
    public ResponseEntity<List<ReportSummaryDTO>> getRecentReports() {
        List<Report> reports = reportRepository.findTop20ByOrderByGeneratedAtDesc();
        List<ReportSummaryDTO> dtos = reports.stream()
                .map(this::mapToSummaryDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    // =========================================================================
    // HELPER METHODS
    // =========================================================================

    private ResponseEntity<?> streamReportPdf(TestResult testResult, String reportNumber, String pdfPath) {
        try {
            byte[] pdfBytes = null;

            // Try reading from disk first
            if (pdfPath != null) {
                File file = new File(pdfPath);
                if (file.exists() && file.isFile()) {
                    pdfBytes = Files.readAllBytes(file.toPath());
                }
            }

            // Fallback: generate dynamically if not cached on disk
            if (pdfBytes == null) {
                pdfBytes = pdfReportService.generateReportPdf(testResult);
            }

            String filename = reportNumber + ".pdf";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("inline", filename);
            headers.setContentLength(pdfBytes.length);

            return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Error streaming report PDF: " + e.getMessage()));
        }
    }

    private ReportSummaryDTO mapToSummaryDTO(Report r) {
        ReportSummaryDTO dto = new ReportSummaryDTO();
        dto.setId(r.getId());
        dto.setReportNumber(r.getReportNumber());
        dto.setGeneratedAt(r.getGeneratedAt());

        // Ensure shareToken is present (auto-heal older records if needed)
        if (r.getShareToken() == null) {
            r.setShareToken(java.util.UUID.randomUUID().toString().replace("-", ""));
            r.setShareTokenGeneratedAt(LocalDateTime.now());
            try {
                reportRepository.save(r);
            } catch (Exception ignored) {}
        }
        dto.setShareToken(r.getShareToken());
        dto.setShareLink("http://localhost:3000/report/" + r.getShareToken());

        if (r.getApprovedBy() != null) {
            dto.setApprovedById(r.getApprovedBy().getId());
            dto.setApprovedByUsername(r.getApprovedBy().getUsername());
        }

        TestResult tr = r.getTestResult();
        if (tr != null) {
            dto.setTestResultId(tr.getId());

            OrderTest ot = tr.getOrderTest();
            if (ot != null) {
                dto.setOrderTestId(ot.getId());
                dto.setTestSampleCode(ot.getTestSampleCode());

                if (ot.getTest() != null) {
                    dto.setTestId(ot.getTest().getId());
                    dto.setTestName(ot.getTest().getName());
                    dto.setTestCode(ot.getTest().getCode());
                    dto.setTestCategory(ot.getTest().getCategory());
                }

                if (ot.getTestOrder() != null) {
                    dto.setLabSlipBarcode(ot.getTestOrder().getLabSlipBarcode());
                    Patient p = ot.getTestOrder().getPatient();
                    if (p != null) {
                        dto.setPatientId(p.getId());
                        dto.setPatientName(p.getFullName());
                        dto.setPatientSex(p.getGender());
                        dto.setPatientContact(p.getContactNumber());
                        if (p.getDateOfBirth() != null) {
                            dto.setPatientAgeYears((int) ChronoUnit.YEARS.between(p.getDateOfBirth(), LocalDate.now()));
                        }
                    }
                }
            }

            int abn = 0;
            int crit = 0;
            if (tr.getValues() != null) {
                for (ResultValue rv : tr.getValues()) {
                    if (Boolean.TRUE.equals(rv.getIsAbnormal())) abn++;
                    if (Boolean.TRUE.equals(rv.getIsCritical())) crit++;
                }
            }
            dto.setAbnormalCount(abn);
            dto.setCriticalCount(crit);
            dto.setPdfDownloadUrl("/api/reports/result/" + tr.getId() + "/pdf");
        }

        return dto;
    }
}
