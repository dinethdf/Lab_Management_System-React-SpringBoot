package com.hospital.lms.result.services;

import com.hospital.lms.auth.models.User;
import com.hospital.lms.order.models.OrderTest;
import com.hospital.lms.order.models.TestOrder;
import com.hospital.lms.patient.models.Patient;
import com.hospital.lms.result.models.Report;
import com.hospital.lms.result.models.ResultValue;
import com.hospital.lms.result.models.TestResult;
import com.hospital.lms.result.repositories.ReportRepository;
import com.lowagie.text.*;
import com.lowagie.text.Font;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.format.DateTimeFormatter;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

/**
 * PdfReportService — Generates standardized, professional clinical laboratory
 * report documents in PDF format using OpenPDF built-in Helvetica fonts.
 */
@Service
public class PdfReportService {

    private static final Logger log = LoggerFactory.getLogger(PdfReportService.class);

    private final ReportRepository reportRepository;

    @Value("${lms.reports.storage-dir:storage/reports}")
    private String storageDir = "storage/reports";

    // Standard clinical branding colors
    private static final Color COLOR_PRIMARY = new Color(24, 76, 120);     // Deep medical blue
    private static final Color COLOR_DARK = new Color(33, 37, 41);          // Slate text
    private static final Color COLOR_MUTED = new Color(108, 117, 125);      // Muted gray
    private static final Color COLOR_BG_LIGHT = new Color(248, 249, 250);   // Subtle panel tint
    private static final Color COLOR_HEADER_BG = new Color(230, 238, 248);  // Table header blue
    private static final Color COLOR_NORMAL = new Color(22, 101, 52);       // Forest green
    private static final Color COLOR_ABNORMAL = new Color(180, 83, 9);      // Amber / orange
    private static final Color COLOR_CRITICAL = new Color(220, 38, 38);     // Crimson red
    private static final Color COLOR_CRITICAL_BG = new Color(254, 242, 242);// Light red tint

    // Formatter
    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    public PdfReportService(ReportRepository reportRepository) {
        this.reportRepository = reportRepository;
    }

    /**
     * Generates a complete diagnostic report PDF byte stream for an approved TestResult.
     */
    public byte[] generateReportPdf(TestResult testResult) {
        if (testResult == null) {
            throw new IllegalArgumentException("TestResult cannot be null.");
        }

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4, 36, 36, 36, 36);

        try {
            PdfWriter writer = PdfWriter.getInstance(document, baos);

            // Watermark event for background security stamp
            writer.setPageEvent(new WatermarkPageEvent());

            document.open();

            // 1. Hospital Letterhead Header
            addHospitalHeader(document);

            // 2. Patient Demographics & Order Metadata Box
            addPatientAndOrderSection(document, testResult);

            // 3. Test Banner
            addTestBanner(document, testResult);

            // 4. Test Parameters & Results Table
            addResultsTable(document, testResult);

            // 5. Clinical Remarks (if any)
            addClinicalRemarks(document, testResult);

            // 6. Senior Lab Technician Verification Sign-Off Footer
            addVerificationFooter(document, testResult);

            document.close();
            return baos.toByteArray();

        } catch (Exception e) {
            log.error("Failed to generate PDF diagnostic report for result ID: {}", testResult.getId(), e);
            throw new RuntimeException("Could not render diagnostic PDF report: " + e.getMessage(), e);
        }
    }

    /**
     * Generates the PDF, saves the binary file to the storage directory,
     * and persists the Report audit record in the database.
     */
    @Transactional
    public Report generateAndSaveReport(TestResult testResult, User approver) {
        // Ensure result is approved
        if (testResult.getStatus() != TestResult.ResultStatus.APPROVED) {
            throw new IllegalStateException("Cannot generate official report for result that is not APPROVED.");
        }

        byte[] pdfBytes = generateReportPdf(testResult);

        // Ensure storage directory exists
        try {
            Path storagePath = Paths.get(storageDir);
            if (!Files.exists(storagePath)) {
                Files.createDirectories(storagePath);
            }

            String sampleCode = testResult.getOrderTest().getTestSampleCode();
            String filename = "report-" + sampleCode + "-" + System.currentTimeMillis() + ".pdf";
            Path targetFile = storagePath.resolve(filename);

            try (FileOutputStream fos = new FileOutputStream(targetFile.toFile())) {
                fos.write(pdfBytes);
            }

            // Generate report number e.g. RPT-2026-00001
            String reportNumber = "RPT-" + String.format("%04d", testResult.getOrderTest().getTestOrder().getId())
                    + "-" + String.format("%02d", testResult.getId());

            // Check if report record already exists (e.g. re-generating)
            Optional<Report> existingOpt = reportRepository.findByTestResult_Id(testResult.getId());
            Report report = existingOpt.orElse(new Report());

            report.setTestResult(testResult);
            report.setReportNumber(reportNumber);
            report.setPdfPath(targetFile.toString());
            report.setApprovedBy(approver);
            report.setGeneratedAt(testResult.getVerifiedAt() != null ? testResult.getVerifiedAt() : java.time.LocalDateTime.now());

            // Assign unique random token for secure patient web link access
            if (report.getShareToken() == null) {
                report.setShareToken(UUID.randomUUID().toString().replace("-", ""));
                report.setShareTokenGeneratedAt(LocalDateTime.now());
            }

            Report saved = reportRepository.save(report);
            log.info("Official diagnostic report generated: {} at {}", reportNumber, targetFile);
            return saved;

        } catch (Exception e) {
            log.error("Error saving PDF report file to disk for result ID: {}", testResult.getId(), e);
            throw new RuntimeException("Failed to save report document: " + e.getMessage(), e);
        }
    }

    // =========================================================================
    // SECTION BUILDERS
    // =========================================================================

    private void addHospitalHeader(Document document) throws DocumentException {
        Font titleFont = new Font(Font.HELVETICA, 16, Font.BOLD, COLOR_PRIMARY);
        Font subtitleFont = new Font(Font.HELVETICA, 9, Font.ITALIC, COLOR_DARK);
        Font detailFont = new Font(Font.HELVETICA, 8, Font.NORMAL, COLOR_MUTED);

        Paragraph title = new Paragraph("HOSPITAL DIAGNOSTIC LABORATORY", titleFont);
        title.setAlignment(Element.ALIGN_CENTER);
        document.add(title);

        Paragraph sub = new Paragraph("Department of Clinical Pathology & Diagnostic Services", subtitleFont);
        sub.setAlignment(Element.ALIGN_CENTER);
        document.add(sub);

        Paragraph details = new Paragraph(
                "ISO 15189:2022 Certified • License No: MOH-LAB-2026-042\n" +
                "123 Healthcare Boulevard, Medical Zone, Colombo 05 • Tel: +94 11 234 5678 • reports@medilab.lk",
                detailFont
        );
        details.setAlignment(Element.ALIGN_CENTER);
        details.setSpacingAfter(6);
        document.add(details);

        // Solid accent divider line
        PdfPTable divider = new PdfPTable(1);
        divider.setWidthPercentage(100);
        PdfPCell cell = new PdfPCell();
        cell.setBackgroundColor(COLOR_PRIMARY);
        cell.setFixedHeight(3f);
        cell.setBorder(Rectangle.NO_BORDER);
        divider.addCell(cell);
        divider.setSpacingAfter(10);
        document.add(divider);
    }

    private void addPatientAndOrderSection(Document document, TestResult testResult) throws DocumentException {
        OrderTest orderTest = testResult.getOrderTest();
        TestOrder order = orderTest.getTestOrder();
        Patient patient = order.getPatient();

        Font labelFont = new Font(Font.HELVETICA, 8, Font.BOLD, COLOR_MUTED);
        Font valFont = new Font(Font.HELVETICA, 9, Font.NORMAL, COLOR_DARK);
        Font boldValFont = new Font(Font.HELVETICA, 9, Font.BOLD, COLOR_DARK);

        PdfPTable table = new PdfPTable(4);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{22, 28, 22, 28});

        // Row 1: Patient Name & Lab Slip Barcode
        table.addCell(createCell("PATIENT NAME:", labelFont, COLOR_BG_LIGHT));
        table.addCell(createCell(patient.getFullName(), boldValFont, COLOR_BG_LIGHT));
        table.addCell(createCell("LAB SLIP BARCODE:", labelFont, COLOR_BG_LIGHT));
        table.addCell(createCell(order.getLabSlipBarcode(), boldValFont, COLOR_BG_LIGHT));

        // Row 2: Patient ID & Test Sample Code
        table.addCell(createCell("PATIENT ID:", labelFont, Color.WHITE));
        table.addCell(createCell("P-" + String.format("%04d", patient.getId()), valFont, Color.WHITE));
        table.addCell(createCell("SAMPLE CODE:", labelFont, Color.WHITE));
        table.addCell(createCell(orderTest.getTestSampleCode(), boldValFont, Color.WHITE));

        // Row 3: Age & Sex & Order Date
        String ageSex = (testResult.getPatientAgeDays() != null ? (testResult.getPatientAgeDays() / 365) + " Yrs" : "-")
                + " / " + (testResult.getPatientSex() != null ? testResult.getPatientSex() : "-");
        table.addCell(createCell("AGE / GENDER:", labelFont, COLOR_BG_LIGHT));
        table.addCell(createCell(ageSex, valFont, COLOR_BG_LIGHT));
        table.addCell(createCell("ORDER DATE:", labelFont, COLOR_BG_LIGHT));
        String orderDate = order.getCreatedAt() != null ? order.getCreatedAt().format(DATE_FORMATTER) : "-";
        table.addCell(createCell(orderDate, valFont, COLOR_BG_LIGHT));

        // Row 4: Contact & Referring Doctor
        table.addCell(createCell("CONTACT NUMBER:", labelFont, Color.WHITE));
        table.addCell(createCell(patient.getContactNumber() != null ? patient.getContactNumber() : "-", valFont, Color.WHITE));
        table.addCell(createCell("REFERRING DOCTOR:", labelFont, Color.WHITE));
        table.addCell(createCell(patient.getReferringDoctor() != null ? patient.getReferringDoctor() : "Self / Walk-in", valFont, Color.WHITE));

        table.setSpacingAfter(10);
        document.add(table);
    }

    private void addTestBanner(Document document, TestResult testResult) throws DocumentException {
        OrderTest orderTest = testResult.getOrderTest();
        String testTitle = orderTest.getTest().getName();
        String category = orderTest.getTest().getCategory();

        Font bannerFont = new Font(Font.HELVETICA, 10, Font.BOLD, Color.WHITE);
        Font catFont = new Font(Font.HELVETICA, 8, Font.NORMAL, Color.WHITE);

        PdfPTable banner = new PdfPTable(2);
        banner.setWidthPercentage(100);
        banner.setWidths(new float[]{70, 30});

        PdfPCell leftCell = new PdfPCell(new Phrase("INVESTIGATION: " + testTitle.toUpperCase(), bannerFont));
        leftCell.setBackgroundColor(COLOR_PRIMARY);
        leftCell.setPadding(6);
        leftCell.setBorder(Rectangle.NO_BORDER);

        PdfPCell rightCell = new PdfPCell(new Phrase("CATEGORY: " + (category != null ? category.toUpperCase() : "GENERAL"), catFont));
        rightCell.setBackgroundColor(COLOR_PRIMARY);
        rightCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        rightCell.setPadding(6);
        rightCell.setBorder(Rectangle.NO_BORDER);

        banner.addCell(leftCell);
        banner.addCell(rightCell);
        banner.setSpacingAfter(6);
        document.add(banner);
    }

    private void addResultsTable(Document document, TestResult testResult) throws DocumentException {
        Font headerFont = new Font(Font.HELVETICA, 8, Font.BOLD, COLOR_DARK);
        Font dataFont = new Font(Font.HELVETICA, 8, Font.NORMAL, COLOR_DARK);
        Font boldDataFont = new Font(Font.HELVETICA, 8, Font.BOLD, COLOR_DARK);

        PdfPTable table = new PdfPTable(5);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{34, 18, 14, 20, 14});

        // Header Row
        table.addCell(createHeaderCell("TEST PARAMETER", headerFont));
        table.addCell(createHeaderCell("OBSERVED VALUE", headerFont));
        table.addCell(createHeaderCell("UNIT", headerFont));
        table.addCell(createHeaderCell("REFERENCE RANGE", headerFont));
        table.addCell(createHeaderCell("STATUS", headerFont));

        boolean alternate = false;
        for (ResultValue rv : testResult.getValues()) {
            Color rowBg = alternate ? COLOR_BG_LIGHT : Color.WHITE;
            if (Boolean.TRUE.equals(rv.getIsCritical())) {
                rowBg = COLOR_CRITICAL_BG;
            }

            // 1. Parameter Name
            PdfPCell cParam = new PdfPCell(new Phrase(rv.getParameterName(), dataFont));
            cParam.setBackgroundColor(rowBg);
            cParam.setPadding(5);
            cParam.setBorderColor(new Color(220, 224, 230));
            table.addCell(cParam);

            // 2. Observed Value
            String valStr = "-";
            if (rv.getNumericValue() != null) {
                valStr = rv.getNumericValue().toPlainString();
            } else if (rv.getChoiceValue() != null && !rv.getChoiceValue().trim().isEmpty()) {
                valStr = rv.getChoiceValue();
            } else if (rv.getTextValue() != null && !rv.getTextValue().trim().isEmpty()) {
                valStr = rv.getTextValue();
            }

            Font valFontToUse = Boolean.TRUE.equals(rv.getIsAbnormal()) || Boolean.TRUE.equals(rv.getIsCritical())
                    ? boldDataFont : dataFont;
            PdfPCell cVal = new PdfPCell(new Phrase(valStr, valFontToUse));
            cVal.setBackgroundColor(rowBg);
            cVal.setPadding(5);
            cVal.setBorderColor(new Color(220, 224, 230));
            table.addCell(cVal);

            // 3. Unit
            PdfPCell cUnit = new PdfPCell(new Phrase(rv.getParameterUnit() != null ? rv.getParameterUnit() : "-", dataFont));
            cUnit.setBackgroundColor(rowBg);
            cUnit.setPadding(5);
            cUnit.setBorderColor(new Color(220, 224, 230));
            table.addCell(cUnit);

            // 4. Biological Reference Range
            String refRange = "-";
            if (rv.getRefLower() != null || rv.getRefUpper() != null) {
                refRange = (rv.getRefLower() != null ? rv.getRefLower().toPlainString() : "") +
                        " - " + (rv.getRefUpper() != null ? rv.getRefUpper().toPlainString() : "");
            }
            PdfPCell cRange = new PdfPCell(new Phrase(refRange, dataFont));
            cRange.setBackgroundColor(rowBg);
            cRange.setPadding(5);
            cRange.setBorderColor(new Color(220, 224, 230));
            table.addCell(cRange);

            // 5. Clinical Flag
            Phrase flagPhrase;
            if (Boolean.TRUE.equals(rv.getIsCritical())) {
                Font critFont = new Font(Font.HELVETICA, 8, Font.BOLD, COLOR_CRITICAL);
                flagPhrase = new Phrase("CRITICAL", critFont);
            } else if (Boolean.TRUE.equals(rv.getIsAbnormal())) {
                Font abnFont = new Font(Font.HELVETICA, 8, Font.BOLD, COLOR_ABNORMAL);
                flagPhrase = new Phrase("ABNORMAL", abnFont);
            } else {
                Font normFont = new Font(Font.HELVETICA, 8, Font.NORMAL, COLOR_NORMAL);
                flagPhrase = new Phrase("NORMAL", normFont);
            }

            PdfPCell cFlag = new PdfPCell(flagPhrase);
            cFlag.setBackgroundColor(rowBg);
            cFlag.setPadding(5);
            cFlag.setBorderColor(new Color(220, 224, 230));
            table.addCell(cFlag);

            alternate = !alternate;
        }

        table.setSpacingAfter(10);
        document.add(table);
    }

    private void addClinicalRemarks(Document document, TestResult testResult) throws DocumentException {
        if (testResult.getNotes() != null && !testResult.getNotes().trim().isEmpty()) {
            Font remarkHeader = new Font(Font.HELVETICA, 8, Font.BOLD, COLOR_DARK);
            Font remarkBody = new Font(Font.HELVETICA, 8, Font.NORMAL, COLOR_DARK);

            PdfPTable table = new PdfPTable(1);
            table.setWidthPercentage(100);

            PdfPCell cell = new PdfPCell();
            cell.setBackgroundColor(COLOR_BG_LIGHT);
            cell.setPadding(6);
            cell.setBorderColor(new Color(200, 210, 220));

            Paragraph p = new Paragraph("CLINICAL REMARKS & INTERPRETATION:\n", remarkHeader);
            p.add(new Chunk(testResult.getNotes().trim(), remarkBody));
            cell.addElement(p);

            table.addCell(cell);
            table.setSpacingAfter(10);
            document.add(table);
        }
    }

    private void addVerificationFooter(Document document, TestResult testResult) throws DocumentException {
        Font signTitleFont = new Font(Font.HELVETICA, 8, Font.BOLD, COLOR_DARK);
        Font signValFont = new Font(Font.HELVETICA, 8, Font.NORMAL, COLOR_DARK);
        Font noticeFont = new Font(Font.HELVETICA, 7, Font.ITALIC, COLOR_MUTED);

        PdfPTable footerTable = new PdfPTable(2);
        footerTable.setWidthPercentage(100);
        footerTable.setWidths(new float[]{60, 40});

        // Left box: Verification statement
        PdfPCell leftCell = new PdfPCell();
        leftCell.setBorder(Rectangle.NO_BORDER);
        leftCell.addElement(new Paragraph("CLINICAL VALIDATION & AUTHENTICITY NOTICE:", signTitleFont));
        leftCell.addElement(new Paragraph(
                "This computerized diagnostic test report has been reviewed, cross-referenced, and officially authorized " +
                "by an accredited Senior Medical Laboratory Technologist in accordance with medical laboratory regulatory standards.",
                noticeFont
        ));
        leftCell.addElement(new Paragraph(
                "Any reproduction without official electronic sign-off is invalid. Stamped electronically.",
                noticeFont
        ));
        footerTable.addCell(leftCell);

        // Right box: Sign-off block
        PdfPCell rightCell = new PdfPCell();
        rightCell.setBackgroundColor(COLOR_BG_LIGHT);
        rightCell.setPadding(8);
        rightCell.setBorderColor(new Color(200, 210, 220));

        String verifier = testResult.getVerifiedBy() != null ? testResult.getVerifiedBy().getUsername() : "Authorized Senior Tech";
        String verTime = testResult.getVerifiedAt() != null ? testResult.getVerifiedAt().format(DATE_TIME_FORMATTER) : "-";

        Paragraph signBlock = new Paragraph();
        signBlock.add(new Chunk("AUTHORIZED VERIFIER:\n", signTitleFont));
        signBlock.add(new Chunk(verifier + "\n", signValFont));
        signBlock.add(new Chunk("Senior Medical Technologist\n\n", noticeFont));
        signBlock.add(new Chunk("VERIFIED AT: ", signTitleFont));
        signBlock.add(new Chunk(verTime + "\n", signValFont));
        signBlock.add(new Chunk("STATUS: CLINICALLY RELEASED", new Font(Font.HELVETICA, 8, Font.BOLD, COLOR_NORMAL)));

        rightCell.addElement(signBlock);
        footerTable.addCell(rightCell);

        document.add(footerTable);
    }

    // =========================================================================
    // HELPER METHODS
    // =========================================================================

    private PdfPCell createCell(String text, Font font, Color bgColor) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setBackgroundColor(bgColor);
        cell.setPadding(4);
        cell.setBorderColor(new Color(220, 224, 230));
        return cell;
    }

    private PdfPCell createHeaderCell(String text, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setBackgroundColor(COLOR_HEADER_BG);
        cell.setPadding(5);
        cell.setBorderColor(new Color(180, 200, 225));
        return cell;
    }

    /**
     * Watermark event adding semi-transparent "VERIFIED DIAGNOSTIC REPORT"
     * diagonally across the page background.
     */
    private static class WatermarkPageEvent extends PdfPageEventHelper {
        @Override
        public void onEndPage(PdfWriter writer, Document document) {
            try {
                PdfContentByte canvas = writer.getDirectContentUnder();
                PdfGState gState = new PdfGState();
                gState.setFillOpacity(0.08f);

                canvas.saveState();
                canvas.setGState(gState);

                Font font = new Font(Font.HELVETICA, 36, Font.BOLD, Color.GRAY);
                Phrase watermark = new Phrase("VERIFIED DIAGNOSTIC REPORT", font);

                float x = (document.right() + document.left()) / 2;
                float y = (document.top() + document.bottom()) / 2;

                ColumnText.showTextAligned(canvas, Element.ALIGN_CENTER, watermark, x, y, 45);
                canvas.restoreState();
            } catch (Exception e) {
                log.warn("Could not draw watermark: {}", e.getMessage());
            }
        }
    }
}
