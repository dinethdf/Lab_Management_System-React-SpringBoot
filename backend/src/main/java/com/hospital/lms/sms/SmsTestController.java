package com.hospital.lms.sms;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * SmsTestController provides lightweight diagnostic endpoints to test
 * the text.lk SMS gateway configuration and send live test SMS messages.
 *
 * Endpoints:
 * 1. GET /api/public/sms/status - View current SMS configuration
 * 2. GET /api/public/sms/test?phone=07XXXXXXXX - Send a live test SMS
 */
@RestController
@RequestMapping("/api/public/sms")
public class SmsTestController {

    private final SmsService smsService;
    private final SmsConfig smsConfig;

    public SmsTestController(SmsService smsService, SmsConfig smsConfig) {
        this.smsService = smsService;
        this.smsConfig = smsConfig;
    }

    /**
     * Checks current SMS gateway settings.
     * Accessible in browser: http://localhost:8080/api/public/sms/status
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getSmsStatus() {
        Map<String, Object> status = new HashMap<>();
        status.put("enabled", smsConfig.isEnabled());
        status.put("apiUrl", smsConfig.getApiUrl());
        status.put("senderId", smsConfig.getSenderId());
        status.put("hasApiToken", (smsConfig.getApiToken() != null && !smsConfig.getApiToken().isBlank()
                && !smsConfig.getApiToken().contains("YOUR_TEXT_LK")));
        status.put("reportBaseUrl", smsConfig.getReportBaseUrl());
        status.put("provider", "text.lk (API v3)");

        return ResponseEntity.ok(status);
    }

    /**
     * Sends a direct test SMS message to the provided phone number.
     * Accessible in browser: http://localhost:8080/api/public/sms/test?phone=07XXXXXXXX
     */
    @GetMapping("/test")
    public ResponseEntity<Map<String, Object>> sendTestSms(@RequestParam(required = false) String phone) {
        Map<String, Object> response = new HashMap<>();

        if (phone == null || phone.trim().isEmpty()) {
            response.put("success", false);
            response.put("message", "Please provide a 'phone' query parameter, e.g. /api/public/sms/test?phone=0771234567");
            return ResponseEntity.badRequest().body(response);
        }

        if (!smsConfig.isEnabled()) {
            response.put("success", false);
            response.put("message", "SMS is currently DISABLED in application.properties (lms.sms.enabled=false). Please set lms.sms.enabled=true to test.");
            response.put("configuredPhone", phone);
            return ResponseEntity.ok(response);
        }

        boolean sent = smsService.sendReportReadySms(
                phone,
                "Test Patient",
                "Full Blood Count",
                "demo-test-token"
        );

        if (sent) {
            response.put("success", true);
            response.put("message", "SMS successfully dispatched via text.lk to " + phone + "! Please check your phone.");
            response.put("targetPhone", phone);
            return ResponseEntity.ok(response);
        } else {
            response.put("success", false);
            response.put("message", "Failed to dispatch SMS. Please check the Spring Boot console log in IntelliJ for the error from text.lk.");
            response.put("targetPhone", phone);
            return ResponseEntity.status(500).body(response);
        }
    }
}
