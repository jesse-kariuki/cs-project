package com.example.demo.controllers;

import com.example.demo.dtos.MpesaCallbackPayload;
import com.example.demo.services.PaymentService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.CompletableFuture;


@Slf4j
@RestController
@RequestMapping("/sale/mpesa")  // Base path
public class MpesaCallbackController {

    @Autowired
    private PaymentService paymentService;


    @PostMapping("/callback")
    public ResponseEntity<Map<String, Object>> handleMpesaCallback(
            @RequestBody MpesaCallbackPayload payload) {

        log.info(" M-Pesa callback received at /api/sales/mpesa/callback");

        if (payload.getBody() != null && payload.getBody().getStkCallback() != null) {
            var stkCallback = payload.getBody().getStkCallback();
            log.info("Callback: CheckoutRequestID={}, ResultCode={}, ResultDesc={}",
                    stkCallback.getCheckoutRequestID(),
                    stkCallback.getResultCode(),
                    stkCallback.getResultDesc());
        }

        // Send immediate response to Safaricom
        Map<String, Object> response = new HashMap<>();
        response.put("ResultCode", 0);
        response.put("ResultDesc", "Accepted");

        // Process callback asynchronously
        CompletableFuture.runAsync(() -> {
            try {
                paymentService.processCallback(payload);
                log.info("✅ Callback processed successfully");
            } catch (Exception e) {
                log.error("❌ Failed to process callback: {}", e.getMessage(), e);
            }
        });

        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/sales/mpesa/callback
     *
     * For testing purposes
     */
    @GetMapping("/callback")
    public ResponseEntity<Map<String, Object>> handleCallbackGet() {
        log.info("📞 M-Pesa callback GET received (likely test)");

        Map<String, Object> response = new HashMap<>();
        response.put("ResultCode", 0);
        response.put("ResultDesc", "Accepted");

        return ResponseEntity.ok(response);
    }
}