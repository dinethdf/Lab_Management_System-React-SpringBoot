package com.hospital.lms.sms;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.http.HttpEntity;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class SmsServiceTest {

    private SmsConfig smsConfig;
    private RestTemplate restTemplate;
    private SmsService smsService;

    @BeforeEach
    void setUp() {
        smsConfig = new SmsConfig();
        smsConfig.setApiUrl("https://app.text.lk/api/v3/sms/send");
        smsConfig.setApiToken("test_token_12345");
        smsConfig.setSenderId("CityDiagLab");
        smsConfig.setReportBaseUrl("http://localhost:3000");

        restTemplate = Mockito.mock(RestTemplate.class);
        smsService = new SmsService(smsConfig, restTemplate);
    }

    @Test
    @DisplayName("Should convert various Sri Lankan phone number formats to standard 94XXXXXXXXX")
    void testPhoneNumberFormatting() {
        assertEquals("94771234567", smsService.convertToInternationalFormat("0771234567"));
        assertEquals("94771234567", smsService.convertToInternationalFormat("+94771234567"));
        assertEquals("94771234567", smsService.convertToInternationalFormat("94771234567"));
        assertEquals("94771234567", smsService.convertToInternationalFormat("077-123 4567"));
        assertEquals("94771234567", smsService.convertToInternationalFormat("771234567"));
        assertEquals("", smsService.convertToInternationalFormat(null));
    }

    @Test
    @DisplayName("Should gracefully skip sending when SMS is disabled")
    void testSmsDisabledSkipsSending() {
        smsConfig.setEnabled(false);

        boolean result = smsService.sendReportReadySms(
                "0771234567",
                "Dineth Perera",
                "Full Blood Count",
                "tok_abc123"
        );

        assertFalse(result, "Expected false when SMS gateway is disabled");
        verifyNoInteractions(restTemplate);
    }

    @Test
    @DisplayName("Should return false when patient contact number is null or empty")
    void testMissingContactNumberReturnsFalse() {
        smsConfig.setEnabled(true);

        assertFalse(smsService.sendReportReadySms(null, "John Doe", "Lipid Profile", "tok_abc"));
        assertFalse(smsService.sendReportReadySms("   ", "John Doe", "Lipid Profile", "tok_abc"));
        verifyNoInteractions(restTemplate);
    }

    @Test
    @DisplayName("Should dispatch SMS and return true when gateway call succeeds")
    void testSuccessfulSmsDispatch() {
        smsConfig.setEnabled(true);

        when(restTemplate.postForObject(eq("https://app.text.lk/api/v3/sms/send"), any(HttpEntity.class), eq(String.class)))
                .thenReturn("{\"status\":\"success\",\"message\":\"Message sent\"}");

        boolean result = smsService.sendReportReadySms(
                "0771234567",
                "Dineth Perera",
                "Full Blood Count",
                "tok_xyz987"
        );

        assertTrue(result, "Expected true when SMS gateway succeeds");
        verify(restTemplate, times(1)).postForObject(eq("https://app.text.lk/api/v3/sms/send"), any(HttpEntity.class), eq(String.class));
    }

    @Test
    @DisplayName("Should safely handle gateway exception without crashing")
    void testGatewayErrorHandlesSafely() {
        smsConfig.setEnabled(true);

        when(restTemplate.postForObject(anyString(), any(HttpEntity.class), eq(String.class)))
                .thenThrow(new RestClientException("Connection timeout"));

        boolean result = smsService.sendReportReadySms(
                "0771234567",
                "Dineth Perera",
                "Full Blood Count",
                "tok_xyz987"
        );

        assertFalse(result, "Expected false when gateway encounters an error");
    }
}
