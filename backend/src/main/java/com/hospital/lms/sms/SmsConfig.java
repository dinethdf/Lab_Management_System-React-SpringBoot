package com.hospital.lms.sms;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * SmsConfig loads SMS gateway configuration settings from application.properties.
 *
 * Properties mapped with prefix "lms.sms":
 * - lms.sms.enabled: whether real SMS sending is activated (true/false)
 * - lms.sms.api-url: text.lk v3 endpoint (https://app.text.lk/api/v3/sms/send)
 * - lms.sms.api-token: Bearer Token obtained from text.lk developer portal
 * - lms.sms.sender-id: Approved Sender ID (e.g., "CityDiagLab", up to 11 chars)
 * - lms.sms.report-base-url: Base URL of frontend (e.g. "http://localhost:3000")
 */
@Configuration
@ConfigurationProperties(prefix = "lms.sms")
public class SmsConfig {

    /**
     * Whether SMS sending is enabled. Defaults to false for safe development.
     */
    private boolean enabled = false;

    /**
     * The text.lk API v3 URL for sending plain SMS.
     */
    private String apiUrl = "https://app.text.lk/api/v3/sms/send";

    /**
     * Secret API Token from text.lk dashboard.
     */
    private String apiToken = "";

    /**
     * Approved Alphanumeric Sender ID registered with text.lk.
     */
    private String senderId = "";

    /**
     * Frontend application base URL used to construct clickable report links.
     */
    private String reportBaseUrl = "http://localhost:3000";

    public SmsConfig() {
    }

    // =========================================================================
    // GETTERS & SETTERS (Required by Spring Boot Configuration Binding)
    // =========================================================================

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public String getApiUrl() {
        return apiUrl;
    }

    public void setApiUrl(String apiUrl) {
        this.apiUrl = apiUrl;
    }

    public String getApiToken() {
        return apiToken;
    }

    public void setApiToken(String apiToken) {
        this.apiToken = apiToken;
    }

    public String getSenderId() {
        return senderId;
    }

    public void setSenderId(String senderId) {
        this.senderId = senderId;
    }

    public String getReportBaseUrl() {
        return reportBaseUrl;
    }

    public void setReportBaseUrl(String reportBaseUrl) {
        this.reportBaseUrl = reportBaseUrl;
    }
}
