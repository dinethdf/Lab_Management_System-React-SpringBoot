package com.hospital.lms.result.controllers;

import com.hospital.lms.catalog.models.TestParameter;
import com.hospital.lms.common.dtos.MessageResponse;
import com.hospital.lms.order.models.OrderTest;
import com.hospital.lms.patient.models.Patient;
import com.hospital.lms.result.models.Report;
import com.hospital.lms.result.models.ReportAccessSession;
import com.hospital.lms.result.models.ResultValue;
import com.hospital.lms.result.models.TestResult;
import com.hospital.lms.result.repositories.ReportAccessSessionRepository;
import com.hospital.lms.result.repositories.ReportRepository;
import com.hospital.lms.result.services.PdfReportService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.nio.file.Files;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;

/**
 * PatientReportPortalController — Public, unauthenticated endpoints for patient self-service.
 *
 * Allows patients who receive a shared web link (e.g., http://localhost:3000/report/{shareToken})
 * to:
 * 1. View masked preview metadata (test name, report date, masked mobile number).
 * 2. Authenticate securely by entering the last 4 digits of their registered mobile number.
 * 3. Receive a temporary 30-minute access session token.
 * 4. Stream or download their official clinical diagnostic PDF report.
 *
 * Beginner-Friendly Note: These endpoints are whitelisted under /public/** and /api/public/**
 * so patients do not need staff login accounts.
 */
@RestController
@RequestMapping({"/api/public/report", "/public/report"})
public class PatientReportPortalController {

    private static final Logger log = LoggerFactory.getLogger(PatientReportPortalController.class);
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd MMMM yyyy");

    private final ReportRepository reportRepository;
    private final ReportAccessSessionRepository accessSessionRepository;
    private final PdfReportService pdfReportService;

    @Autowired
    public PatientReportPortalController(ReportRepository reportRepository,
                                         ReportAccessSessionRepository accessSessionRepository,
                                         PdfReportService pdfReportService) {
        this.reportRepository = reportRepository;
        this.accessSessionRepository = accessSessionRepository;
        this.pdfReportService = pdfReportService;
    }

    /**
     * Step 1: Preview report metadata before authentication.
     * Returns masked information so the patient knows which test it is and which mobile number to use.
     * No personal identifying information (full name, results) is exposed in this endpoint.
     */
    @GetMapping("/{shareToken}")
    public ResponseEntity<?> getPublicReportInfo(@PathVariable String shareToken) {
        if (shareToken == null || shareToken.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(new MessageResponse("Share token is required."));
        }

        Optional<Report> reportOpt = reportRepository.findByShareToken(shareToken.trim());
        if (reportOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new MessageResponse("Report link not found or has expired. Please check the link or contact the laboratory."));
        }

        Report report = reportOpt.get();
        Patient patient = extractPatient(report);

        // Compute masked mobile (e.g. "****4567")
        String contactNumber = patient != null ? patient.getContactNumber() : null;
        String maskedMobile = maskContactNumber(contactNumber);

        String testName = "Diagnostic Test";
        String testCode = "";
        if (report.getTestResult() != null && report.getTestResult().getOrderTest() != null && report.getTestResult().getOrderTest().getTest() != null) {
            testName = report.getTestResult().getOrderTest().getTest().getName();
            testCode = report.getTestResult().getOrderTest().getTest().getCode();
        }

        String formattedDate = report.getGeneratedAt() != null
                ? report.getGeneratedAt().format(DATE_FORMATTER)
                : LocalDateTime.now().format(DATE_FORMATTER);

        Map<String, Object> response = new HashMap<>();
        response.put("reportNumber", report.getReportNumber());
        response.put("testName", testName);
        response.put("testCode", testCode);
        response.put("reportDate", formattedDate);
        response.put("hospitalName", "City Diagnostic Laboratory");
        response.put("maskedMobile", maskedMobile);

        return ResponseEntity.ok(response);
    }

    /**
     * Step 2: Patient identity verification using the last 4 digits of their mobile number.
     * If valid, generates and returns a 30-minute access session token.
     */
    @PostMapping("/{shareToken}/verify")
    @Transactional
    public ResponseEntity<?> verifyPatientPin(@PathVariable String shareToken,
                                              @RequestBody Map<String, String> request) {
        if (shareToken == null || shareToken.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(new MessageResponse("Share token is required."));
        }

        String submittedPin = request.get("pin");
        if (submittedPin == null || submittedPin.trim().length() != 4) {
            return ResponseEntity.badRequest().body(new MessageResponse("Please enter a valid 4-digit PIN."));
        }

        Optional<Report> reportOpt = reportRepository.findByShareToken(shareToken.trim());
        if (reportOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new MessageResponse("Report link not found or has expired."));
        }

        Report report = reportOpt.get();
        Patient patient = extractPatient(report);
        if (patient == null || patient.getContactNumber() == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new MessageResponse("Patient contact information is unavailable for verification. Please contact lab desk."));
        }

        // Clean both phone numbers to only digits for reliable comparison
        String cleanPhone = patient.getContactNumber().replaceAll("[^0-9]", "");
        String cleanPin = submittedPin.trim().replaceAll("[^0-9]", "");

        if (cleanPhone.length() < 4 || !cleanPhone.endsWith(cleanPin)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new MessageResponse("Incorrect PIN. Please enter the last 4 digits of your registered mobile number."));
        }

        // Housekeeping: clean up expired sessions
        try {
            accessSessionRepository.deleteByExpiresAtBefore(LocalDateTime.now());
        } catch (Exception e) {
            log.warn("Failed to delete expired access sessions: {}", e.getMessage());
        }

        // Create a new 30-minute access session
        ReportAccessSession session = new ReportAccessSession();
        session.setReport(report);
        session.setSessionToken(UUID.randomUUID().toString().replace("-", ""));
        session.setCreatedAt(LocalDateTime.now());
        session.setExpiresAt(LocalDateTime.now().plusMinutes(30));
        accessSessionRepository.save(session);

        // Build full clinical report details for direct browser viewing
        Map<String, Object> response = buildFullReportDetailsMap(report, session);
        return ResponseEntity.ok(response);
    }

    /**
     * Step 2.1: Fetch verified report details using active session token.
     * Allows restoring report view on page refresh if session is still valid.
     */
    @GetMapping("/{shareToken}/details")
    public ResponseEntity<?> getVerifiedReportDetails(@PathVariable String shareToken,
                                                      @RequestHeader(value = "X-Session-Token", required = false) String headerToken,
                                                      @RequestParam(value = "sessionToken", required = false) String paramToken) {

        String token = headerToken != null && !headerToken.trim().isEmpty() ? headerToken.trim() : paramToken;
        if (token == null || token.trim().isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new MessageResponse("Session token is required. Please verify your PIN."));
        }

        Optional<ReportAccessSession> sessionOpt = accessSessionRepository.findBySessionToken(token.trim());
        if (sessionOpt.isEmpty() || sessionOpt.get().isExpired()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new MessageResponse("Your viewing session has expired. Please verify your PIN again."));
        }

        ReportAccessSession session = sessionOpt.get();
        if (!session.getReport().getShareToken().equalsIgnoreCase(shareToken.trim())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new MessageResponse("Session does not match requested report."));
        }

        Map<String, Object> details = buildFullReportDetailsMap(session.getReport(), session);
        return ResponseEntity.ok(details);
    }

    /**
     * Step 3: Stream official diagnostic PDF report.
     * Requires valid session token either in X-Session-Token header or sessionToken query parameter.
     */
    @GetMapping("/{shareToken}/pdf")
    public ResponseEntity<?> streamReportPdf(@PathVariable String shareToken,
                                             @RequestHeader(value = "X-Session-Token", required = false) String headerToken,
                                             @RequestParam(value = "sessionToken", required = false) String paramToken) {

        String token = headerToken != null && !headerToken.trim().isEmpty() ? headerToken.trim() : paramToken;
        if (token == null || token.trim().isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new MessageResponse("Session token is required to view report. Please verify your PIN."));
        }

        Optional<ReportAccessSession> sessionOpt = accessSessionRepository.findBySessionToken(token.trim());
        if (sessionOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new MessageResponse("Invalid session token. Please verify your PIN again."));
        }

        ReportAccessSession session = sessionOpt.get();
        if (session.isExpired()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new MessageResponse("Your viewing session has expired (30 minute limit). Please verify your PIN again."));
        }

        // Validate that this session matches the requested shareToken
        if (!session.getReport().getShareToken().equalsIgnoreCase(shareToken.trim())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new MessageResponse("Session token does not match requested report."));
        }

        Report report = session.getReport();
        TestResult testResult = report.getTestResult();

        try {
            byte[] pdfBytes = null;
            if (report.getPdfPath() != null) {
                File file = new File(report.getPdfPath());
                if (file.exists() && file.isFile()) {
                    pdfBytes = Files.readAllBytes(file.toPath());
                }
            }

            // Fallback generation if file not found on disk
            if (pdfBytes == null && testResult != null) {
                pdfBytes = pdfReportService.generateReportPdf(testResult);
            }

            if (pdfBytes == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(new MessageResponse("PDF file content could not be found or generated."));
            }

            String filename = report.getReportNumber() + ".pdf";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("inline", filename);
            headers.setContentLength(pdfBytes.length);

            return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);

        } catch (Exception e) {
            log.error("Error streaming public report PDF for token {}: {}", shareToken, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Error streaming report PDF: " + e.getMessage()));
        }
    }

    // =========================================================================
    // HELPER METHODS
    // =========================================================================

    /**
     * Safely retrieves the patient entity from a Report object.
     */
    private Patient extractPatient(Report report) {
        if (report != null && report.getTestResult() != null
                && report.getTestResult().getOrderTest() != null
                && report.getTestResult().getOrderTest().getTestOrder() != null) {
            return report.getTestResult().getOrderTest().getTestOrder().getPatient();
        }
        return null;
    }

    /**
     * Masks all but the last 4 digits of a contact number, e.g. "0771234567" -> "****4567".
     */
    private String maskContactNumber(String contactNumber) {
        if (contactNumber == null || contactNumber.trim().isEmpty()) {
            return "****";
        }
        String clean = contactNumber.replaceAll("[^0-9]", "");
        if (clean.length() <= 4) {
            return "****" + clean;
        }
        String last4 = clean.substring(clean.length() - 4);
        return "****" + last4;
    }

    /**
     * Constructs a comprehensive, structured clinical report DTO map
     * for direct visual rendering in the patient's web browser.
     */
    private Map<String, Object> buildFullReportDetailsMap(Report report, ReportAccessSession session) {
        Patient patient = extractPatient(report);
        TestResult testResult = report.getTestResult();
        OrderTest orderTest = testResult != null ? testResult.getOrderTest() : null;

        Map<String, Object> response = new HashMap<>();
        response.put("sessionToken", session.getSessionToken());
        response.put("expiresInMinutes", 30);
        response.put("reportNumber", report.getReportNumber());
        response.put("reportDate", report.getGeneratedAt() != null ? report.getGeneratedAt().format(DATE_FORMATTER) : "");
        response.put("hospitalName", "City Diagnostic Laboratory");

        if (patient != null) {
            response.put("patientName", patient.getFullName());
            response.put("patientGender", patient.getGender() != null ? patient.getGender() : "Not specified");
            response.put("patientId", "P-" + String.format("%04d", patient.getId()));
            if (patient.getDateOfBirth() != null) {
                long ageYears = ChronoUnit.YEARS.between(patient.getDateOfBirth(), LocalDate.now());
                response.put("patientAge", ageYears + " years");
            } else {
                response.put("patientAge", "-");
            }
        }

        if (orderTest != null) {
            response.put("testSampleCode", orderTest.getTestSampleCode());
            if (orderTest.getTest() != null) {
                response.put("testName", orderTest.getTest().getName());
                response.put("testCode", orderTest.getTest().getCode());
                response.put("testCategory", orderTest.getTest().getCategory());
            }
            if (orderTest.getTestOrder() != null) {
                response.put("labSlipBarcode", orderTest.getTestOrder().getLabSlipBarcode());
            }
        }

        if (report.getApprovedBy() != null) {
            response.put("verifiedBy", report.getApprovedBy().getUsername());
        } else {
            response.put("verifiedBy", "Senior Lab Officer");
        }

        if (testResult != null) {
            response.put("clinicalNotes", testResult.getNotes());

            List<Map<String, Object>> paramList = new ArrayList<>();
            if (testResult.getValues() != null) {
                for (ResultValue rv : testResult.getValues()) {
                    Map<String, Object> pMap = new HashMap<>();
                    pMap.put("parameterName", rv.getParameterName());
                    pMap.put("unit", rv.getParameterUnit() != null ? rv.getParameterUnit() : "");
                    pMap.put("resultType", rv.getResultType() != null ? rv.getResultType().name() : "NUMBER");

                    String displayValue = "-";
                    if (rv.getResultType() == TestParameter.ResultType.NUMBER && rv.getNumericValue() != null) {
                        displayValue = rv.getNumericValue().stripTrailingZeros().toPlainString();
                    } else if (rv.getResultType() == TestParameter.ResultType.CHOICE && rv.getChoiceValue() != null) {
                        displayValue = rv.getChoiceValue();
                    } else if (rv.getTextValue() != null) {
                        displayValue = rv.getTextValue();
                    }
                    pMap.put("value", displayValue);

                    String refRange = "-";
                    if (rv.getRefLower() != null && rv.getRefUpper() != null) {
                        refRange = rv.getRefLower().stripTrailingZeros().toPlainString() + " - " + rv.getRefUpper().stripTrailingZeros().toPlainString();
                    } else if (rv.getRefLower() != null) {
                        refRange = "≥ " + rv.getRefLower().stripTrailingZeros().toPlainString();
                    } else if (rv.getRefUpper() != null) {
                        refRange = "≤ " + rv.getRefUpper().stripTrailingZeros().toPlainString();
                    }
                    pMap.put("referenceRange", refRange);

                    pMap.put("isAbnormal", Boolean.TRUE.equals(rv.getIsAbnormal()));
                    pMap.put("isCritical", Boolean.TRUE.equals(rv.getIsCritical()));

                    String flag = "NORMAL";
                    if (Boolean.TRUE.equals(rv.getIsCritical())) {
                        flag = "CRITICAL";
                    } else if (Boolean.TRUE.equals(rv.getIsAbnormal())) {
                        flag = "ABNORMAL";
                    }
                    pMap.put("flag", flag);

                    paramList.add(pMap);
                }
            }
            response.put("results", paramList);
        }

        return response;
    }
}
