package com.hospital.lms.sms;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

/**
 * SmsService handles sending SMS notifications via the text.lk SMS API v3.
 *
 * Core Responsibilities:
 * 1. Formats patient mobile numbers to Sri Lankan international standard (e.g. 947XXXXXXXX).
 * 2. Composes patient diagnostic report notification messages under 160 characters.
 * 3. Dispatches HTTP POST requests with Bearer Token authentication to text.lk.
 * 4. Fails safely without throwing exceptions — failure to send SMS never blocks clinical report approval.
 */
@Service
public class SmsService {

    private static final Logger log = LoggerFactory.getLogger(SmsService.class);

    private final SmsConfig smsConfig;
    private final RestTemplate restTemplate;

    @Autowired
    public SmsService(SmsConfig smsConfig) {
        this(smsConfig, new RestTemplate());
    }

    public SmsService(SmsConfig smsConfig, RestTemplate restTemplate) {
        this.smsConfig = smsConfig;
        this.restTemplate = restTemplate;
    }

    /**
     * Sends an SMS alert to a patient notifying them that their clinical diagnostic report is ready.
     *
     * @param contactNumber Patient's registered phone number (e.g. "0712345678")
     * @param patientName   Patient's full name (e.g. "Dineth Perera")
     * @param testName      Name of the diagnostic test (e.g. "Full Blood Count")
     * @param shareToken    Secure UUID token linking to patient portal
     * @return true if dispatch succeeded; false if disabled, invalid input, or network error
     */
    public boolean sendReportReadySms(String contactNumber, String patientName,
                                      String testName, String shareToken) {

        // 1. Guard check: Is SMS gateway feature enabled in application.properties?
        if (!smsConfig.isEnabled()) {
            log.info("SMS gateway is currently DISABLED (lms.sms.enabled=false). Skipping SMS for patient '{}'.", patientName);
            return false;
        }

        // 2. Guard check: Does patient have a valid phone number?
        if (contactNumber == null || contactNumber.trim().isEmpty()) {
            log.warn("Cannot send report SMS: Patient '{}' has no registered contact number.", patientName);
            return false;
        }

        // 3. Guard check: Do we have a valid share token?
        if (shareToken == null || shareToken.trim().isEmpty()) {
            log.warn("Cannot send report SMS: Report share token is empty for patient '{}'.", patientName);
            return false;
        }

        try {
            // 4. Format phone number to international 94XXXXXXXXX standard
            String internationalNumber = convertToInternationalFormat(contactNumber);

            // 5. Construct public patient report web link
            String baseUrl = smsConfig.getReportBaseUrl();
            if (baseUrl.endsWith("/")) {
                baseUrl = baseUrl.substring(0, baseUrl.length() - 1);
            }
            String reportUrl = baseUrl + "/report/" + shareToken.trim();

            // 6. Build concise SMS body (kept <= 160 characters for single SMS credit)
            String messageText = buildReportReadyMessage(patientName, testName, reportUrl);

            // 7. Prepare HTTP request headers for text.lk Bearer Token Auth
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Accept", "application/json");

            String token = smsConfig.getApiToken();
            if (token != null && !token.trim().isEmpty()) {
                headers.setBearerAuth(token.trim());
            }

            // 8. Build JSON payload conforming to text.lk API v3
            Map<String, String> requestBody = new HashMap<>();
            requestBody.put("recipient", internationalNumber);
            requestBody.put("sender_id", smsConfig.getSenderId());
            requestBody.put("type", "plain");
            requestBody.put("message", messageText);

            HttpEntity<Map<String, String>> entity = new HttpEntity<>(requestBody, headers);

            // 9. Dispatch POST request to text.lk
            log.info("Dispatching SMS via text.lk to {} (Sender: {})", internationalNumber, smsConfig.getSenderId());
            String response = restTemplate.postForObject(smsConfig.getApiUrl(), entity, String.class);

            log.info("SMS dispatched successfully to {}. Gateway Response: {}", internationalNumber, response);
            return true;

        } catch (Exception e) {
            // Safety guarantee: Lab workflow MUST NOT stop if SMS gateway experiences downtime
            log.error("Failed to send report SMS to '{}' via text.lk: {}", patientName, e.getMessage());
            return false;
        }
    }

    /**
     * Formats phone numbers into Sri Lankan international standard format (94XXXXXXXXX).
     *
     * Examples:
     * - "0771234567"  -> "94771234567"
     * - "+94771234567" -> "94771234567"
     * - "94771234567"  -> "94771234567"
     * - "771234567"   -> "94771234567"
     * - "077-123 4567"-> "94771234567"
     */
    public String convertToInternationalFormat(String rawPhone) {
        if (rawPhone == null) {
            return "";
        }

        // Remove all non-digit characters (+, -, spaces, etc.)
        String digitsOnly = rawPhone.replaceAll("[^0-9]", "");

        if (digitsOnly.startsWith("94")) {
            return digitsOnly;
        } else if (digitsOnly.startsWith("0")) {
            return "94" + digitsOnly.substring(1);
        } else {
            return "94" + digitsOnly;
        }
    }

    /**
     * Builds a friendly, concise message alerting patient about their report.
     * Uses patient's first name to save SMS character space.
     */
    public String buildReportReadyMessage(String patientName, String testName, String reportUrl) {
        String greetingName = "Patient";
        if (patientName != null && !patientName.trim().isEmpty()) {
            String[] parts = patientName.trim().split("\\s+");
            greetingName = parts[0];
        }

        String safeTest = (testName != null && !testName.trim().isEmpty()) ? testName.trim() : "Diagnostic";

        return "Dear " + greetingName + ", your " + safeTest + " report is ready. " +
                "View: " + reportUrl + " (Enter last 4 digits of mobile to access). - City Diagnostic Lab";
    }
}
