package com.example.demo.services;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
public class MpesaService {

    @Value("${mpesa.env:sandbox}")
    private String mpesaEnv;

    @Value("${mpesa.base-url-sandbox:https://sandbox.safaricom.co.ke}")
    private String baseUrlSandbox;

    @Value("${mpesa.base-url-production:https://api.safaricom.co.ke}")
    private String baseUrlProduction;

    @Value("${mpesa.consumer-key}")
    private String consumerKey;

    @Value("${mpesa.consumer-secret:b8rTvrns1ei6M3JIKHwIgiAtPDnWqBG3OPy6UI8RIv0Mlblmp0F0jHYSNAricQEw}")
    private String consumerSecret;

    @Value("${mpesa.shortcode}")
    private String shortcode;

    @Value("${mpesa.passkey}")
    private String passkey;

    @Value("${mpesa.callback-url}")
    private String callbackUrl;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public MpesaService(RestTemplate restTemplate, ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    private String getBaseUrl() {
        return "production".equalsIgnoreCase(mpesaEnv) ? baseUrlProduction : baseUrlSandbox;
    }

    public String getTimestamp() {
        LocalDateTime now = LocalDateTime.now();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
        return now.format(formatter);
    }

    public String buildPassword(String timestamp) {
        String raw = shortcode + passkey + timestamp;
        return Base64.getEncoder().encodeToString(raw.getBytes());
    }


    public String normalizePhone(String phone) {
        String digits = phone.replaceAll("[^0-9]", "");
        if (digits.startsWith("0")) {
            return "254" + digits.substring(1);
        }
        if (digits.startsWith("254")) {
            return digits;
        }
        return digits;
    }


    public String getAccessToken() {
        log.info("========== OAUTH TOKEN REQUEST ==========");

        if (consumerKey == null || consumerKey.trim().isEmpty()) {
            throw new RuntimeException("consumerKey not configured");
        }
        if (consumerSecret == null || consumerSecret.trim().isEmpty()) {
            throw new RuntimeException("consumerSecret not configured");
        }

        String credentials = consumerKey.trim() + ":" + consumerSecret.trim();
        String encodedCredentials = Base64.getEncoder().encodeToString(credentials.getBytes());

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Basic " + encodedCredentials);
        headers.set("Content-Type", "application/json");

        HttpEntity<String> entity = new HttpEntity<>(headers);

        String url = getBaseUrl() + "/oauth/v1/generate?grant_type=client_credentials";
        log.info("OAuth URL: {}", url);

        try {
            log.info("Sending OAuth request...");
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, entity, String.class);

            log.info("OAuth Response Status: {}", response.getStatusCode());
            log.debug("OAuth Response Body: {}", response.getBody());

            if (!response.getStatusCode().is2xxSuccessful()) {
                log.error("Response: {}", response.getBody());
                throw new RuntimeException("M-Pesa OAuth HTTP failed: " + response.getStatusCode() + " | " + response.getBody());
            }

            String responseBody = response.getBody();
            if (responseBody == null || responseBody.isEmpty()) {
                throw new RuntimeException("Empty OAuth response");
            }

            JsonNode jsonNode = objectMapper.readTree(responseBody);

            if (jsonNode.has("error")) {
                String error = jsonNode.get("error").asText();
                throw new RuntimeException("M-Pesa OAuth error: " + error);
            }

            if (!jsonNode.has("access_token")) {
                log.error("Response keys: {}", jsonNode.fieldNames());
                throw new RuntimeException("No access_token in OAuth response");
            }

            String accessToken = jsonNode.get("access_token").asText();
            int expiresIn = jsonNode.has("expires_in") ? jsonNode.get("expires_in").asInt() : 3600;

            log.info("Token length: {} characters | Expires in: {} seconds", accessToken.length(), expiresIn);

            return accessToken;

        } catch (Exception e) {
            log.error("Exception: {}", e.getClass().getName());
            log.error("Message: {}", e.getMessage());
            log.error("Stack trace: ", e);
            throw new RuntimeException("Failed to get M-Pesa access token: " + e.getMessage(), e);
        }
    }

    public Map<String, Object> initiateSTKPush(String phone, long amount, String accountRef, String description)
            throws Exception {
        String token = getAccessToken();
        String timestamp = getTimestamp();

        Map<String, Object> body = new HashMap<>();
        body.put("BusinessShortCode", shortcode);
        body.put("Password", buildPassword(timestamp));
        body.put("Timestamp", timestamp);
        body.put("TransactionType", "CustomerPayBillOnline");
        body.put("Amount", amount);
        body.put("PartyA", normalizePhone(phone));
        body.put("PartyB", shortcode);
        body.put("PhoneNumber", normalizePhone(phone));
        body.put("CallBackURL", callbackUrl);
        body.put("AccountReference", accountRef);
        body.put("TransactionDesc", description);

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + token);
        headers.set("Content-Type", "application/json");

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
        String url = getBaseUrl() + "/mpesa/stkpush/v1/processrequest";

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);

            if (!response.getStatusCode().is2xxSuccessful()) {
                throw new RuntimeException("STK push request failed: " + response.getBody());
            }

            Map<String, Object> responseData = objectMapper.readValue(response.getBody(), Map.class);

            String responseCode = responseData.get("ResponseCode").toString();
            if (!"0".equals(responseCode)) {
                String errorMsg = responseData.getOrDefault("ResponseDescription", "STK push failed").toString();
                throw new RuntimeException(errorMsg);
            }

            return responseData;
        } catch (Exception e) {
            log.error("Error initiating STK push: {}", e.getMessage());
            throw e;
        }
    }


    public Map<String, Object> querySTKPushStatus(String checkoutRequestId) throws Exception {
        String token = getAccessToken();
        String timestamp = getTimestamp();

        Map<String, Object> body = new HashMap<>();
        body.put("BusinessShortCode", shortcode);
        body.put("Password", buildPassword(timestamp));
        body.put("Timestamp", timestamp);
        body.put("CheckoutRequestID", checkoutRequestId);

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + token);
        headers.set("Content-Type", "application/json");

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
        String url = getBaseUrl() + "/mpesa/stkpushquery/v1/query";

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);
            return objectMapper.readValue(response.getBody(), Map.class);
        } catch (Exception e) {
            log.error("Error querying STK push status: {}", e.getMessage());
            throw e;
        }
    }


    public Map<String, Object> initiateSandboxReversal(String mpesaReceiptNumber, long amount) throws Exception {
        String token = getAccessToken();
        String timestamp = getTimestamp();

        Map<String, Object> body = new HashMap<>();
        body.put("Initiator", "testapi"); // Global Sandbox Initiator Name
        body.put("SecurityCredential", "sandbox_security_credential");
        body.put("CommandID", "TransactionReversal");
        body.put("TransactionID", mpesaReceiptNumber);
        body.put("Amount", amount);
        body.put("ReceiverParty", shortcode);
        body.put("ReceiverIdentifierType", "11"); // Business Paybill/Till Number
        body.put("ResultURL", callbackUrl);
        body.put("QueueTimeOutURL", callbackUrl);
        body.put("Remarks", "Automated Sandbox Testing Refund");
        body.put("Occasion", "TestCleanup");

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + token);
        headers.set("Content-Type", "application/json");

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
        String url = getBaseUrl() + "/mpesa/reversal/v1/request";

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);
            return objectMapper.readValue(response.getBody(), Map.class);
        } catch (Exception e) {
            log.error("Error initiating sandbox reversal: {}", e.getMessage());
            throw e;
        }
    }
}
