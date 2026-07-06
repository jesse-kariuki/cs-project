package com.example.demo.services;

import com.example.demo.dtos.MpesaCallbackPayload;
import com.example.demo.enumeration.SaleStatus;
import com.example.demo.models.Sale;
import com.example.demo.repositories.SaleRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * PaymentService handles all payment-related operations for sales.
 * Currently focused on M-Pesa integration, but can be extended for other payment methods.
 *
 * Workflow:
 * 1. initiateMpesaPayment() - Start STK push to customer phone
 * 2. processCallback() - Handle Safaricom's payment confirmation/failure
 * 3. verifyPaymentStatus() - Poll payment status if needed
 */
@Slf4j
@Service
public class PaymentService {

    @Autowired
    private SaleRepository saleRepository;

    @Autowired
    private MpesaService mpesaService;

    /**
     * Step 1: Initiate M-Pesa STK Push for a sale.
     *
     * Prerequisites:
     * - Sale must exist with all items and total calculated
     * - Customer must be associated with the sale
     * - Phone number must be valid and in correct format
     *
     * Flow:
     * 1. Validate sale exists and is in valid state
     * 2. Call MpesaService.initiateSTKPush()
     * 3. Store CheckoutRequestID and phone in sale for callback matching
     * 4. Return checkoutRequestId to frontend
     *
     * Frontend then shows: "Check your phone for M-Pesa PIN prompt"
     * Customer enters PIN within 60 seconds, payment either succeeds or fails.
     * Safaricom calls our /api/mpesa/callback endpoint with result.
     */
    @Transactional
    public Map<String, Object> initiateMpesaPayment(Integer saleId, String phone, String accountRef)
            throws Exception {

        Sale sale = saleRepository.findById(saleId)
                .orElseThrow(() -> new IllegalArgumentException("Sale ID " + saleId + " not found."));

        if (sale.getStatus() == SaleStatus.PAID) {
            throw new IllegalArgumentException("Sale is already paid.");
        }

        if (phone == null || phone.trim().isEmpty()) {
            throw new IllegalArgumentException("Phone number is required for M-Pesa payment.");
        }

        String normalizedPhone = mpesaService.normalizePhone(phone);
        log.info("Processing M-Pesa payment for Sale ID: {} | Phone: {}", saleId, normalizedPhone);

        long amount = sale.getTotalAmount().longValue();
        String description = "Sale Payment - Sale ID: " + saleId;
        String ref = accountRef != null && !accountRef.isEmpty()
                ? "PRINCESS-HAPPY"
                : "PRINCESS-HAPPY" + saleId;

        try {
            Map<String, Object> mpesaResponse = mpesaService.initiateSTKPush(
                    normalizedPhone,
                    amount,
                    ref,
                    description
            );

            String checkoutRequestId = mpesaResponse.get("CheckoutRequestID").toString();

            sale.setMpesaCheckoutRequestId(checkoutRequestId);
            sale.setMpesaPhone(normalizedPhone);
            sale.setMpesaInitiatedAt(LocalDateTime.now());
            saleRepository.save(sale);

            log.info("STK Push initiated for Sale ID: {} | CheckoutRequestID: {}", saleId, checkoutRequestId);

            // 8. Return the response (includes CheckoutRequestID)
            return mpesaResponse;

        } catch (Exception e) {
            log.error("Failed to initiate M-Pesa payment for Sale ID: {}", saleId, e);
            throw new RuntimeException("Failed to initiate M-Pesa payment: " + e.getMessage(), e);
        }
    }

    /**
     * Step 2: Process M-Pesa callback from Safaricom.
     *
     * IMPORTANT: Safaricom sends NO authentication (no JWT).
     * DO NOT validate JWT on this endpoint.
     * DO respond 200 immediately — long operations must happen AFTER response.
     *
     * Callback success/failure:
     * - ResultCode 0 = payment successful, extract MpesaReceiptNumber
     * - ResultCode non-zero = payment failed/cancelled
     *
     * After success:
     * - Update sale status to PAID
     * - Store mpesaReceiptNumber
     * - Set mpesaCompletedAt timestamp
     * - (Optional) Call initiateSandboxReversal() to return sandbox test funds
     *
     * After failure:
     * - Update sale status to FAILED
     * - Customer can retry payment
     */
    @Transactional
    public void processCallback(MpesaCallbackPayload callback) {
        try {
            MpesaCallbackPayload.StkCallback stkCallback = callback.getBody().getStkCallback();
            String checkoutRequestId = stkCallback.getCheckoutRequestID();
            int resultCode = stkCallback.getResultCode();
            boolean isSuccess = resultCode == 0;

            log.info("Processing M-Pesa callback: CheckoutRequestID={} | ResultCode={} | Success={}",
                    checkoutRequestId, resultCode, isSuccess);

            // Find the sale by CheckoutRequestID
            Sale sale = saleRepository.findByMpesaCheckoutRequestId(checkoutRequestId)
                    .orElseThrow(() -> new IllegalArgumentException(
                            "No sale found for CheckoutRequestID: " + checkoutRequestId));

            if (isSuccess) {
                // ===== PAYMENT SUCCEEDED =====

                // Extract metadata items (MpesaReceiptNumber, etc.)
                MpesaCallbackPayload.Item[] items = stkCallback.getCallbackMetadata().getItem();
                String mpesaReceiptNumber = extractMetadataValue(items, "MpesaReceiptNumber");

                if (mpesaReceiptNumber == null || mpesaReceiptNumber.isEmpty()) {
                    // Fallback: use CheckoutRequestID if receipt number not provided
                    mpesaReceiptNumber = checkoutRequestId;
                }

                // Update sale with payment details
                sale.setStatus(SaleStatus.PAID);
                sale.setMpesaReceiptNumber(mpesaReceiptNumber);
                sale.setMpesaCompletedAt(LocalDateTime.now());
                saleRepository.save(sale);

                log.info("Sale ID: {} marked as PAID | Receipt: {}", sale.getId(), mpesaReceiptNumber);


                if ("sandbox".equalsIgnoreCase(System.getenv("MPESA_ENV"))) {
                    try {
                        log.info("Initiating sandbox reversal for Sale ID: {} | Receipt: {}",
                                sale.getId(), mpesaReceiptNumber);
                        mpesaService.initiateSandboxReversal(mpesaReceiptNumber, sale.getTotalAmount().longValue());
                    } catch (Exception e) {
                        log.warn("Sandbox reversal failed (non-critical): {}", e.getMessage());
                    }
                }


            } else {
                sale.setStatus(SaleStatus.FAILED);
                saleRepository.save(sale);
                log.warn("Sale ID: {} payment failed | ResultCode: {} | Description: {}",
                        sale.getId(), resultCode, stkCallback.getResultDesc());
            }

        } catch (Exception e) {
            // Log but don't re-throw
            // Response already sent to Safaricom
            log.error("Error processing M-Pesa callback", e);
        }
    }


    @Transactional(readOnly = true)
    public Map<String, Object> verifyPaymentStatus(Integer saleId) throws Exception {
        Sale sale = saleRepository.findById(saleId)
                .orElseThrow(() -> new IllegalArgumentException("Sale ID " + saleId + " not found."));

        if (sale.getMpesaCheckoutRequestId() == null) {
            throw new IllegalArgumentException("Sale has no M-Pesa payment initiated yet.");
        }

        log.info("Querying M-Pesa status for Sale ID: {} | CheckoutRequestID: {}",
                saleId, sale.getMpesaCheckoutRequestId());

        try {
            return mpesaService.querySTKPushStatus(sale.getMpesaCheckoutRequestId());
        } catch (Exception e) {
            log.error("Failed to query payment status for Sale ID: {}", saleId, e);
            throw new RuntimeException("Failed to query payment status: " + e.getMessage(), e);
        }
    }

    /**
     * Helper: Extract a specific value from M-Pesa callback metadata items array.
     * Metadata comes as: Item: [{ Name: "MpesaReceiptNumber", Value: "xxx" }, ...]
     */
    private String extractMetadataValue(MpesaCallbackPayload.Item[] items, String name) {
        if (items == null) return null;
        for (MpesaCallbackPayload.Item item : items) {
            if (name.equals(item.getName())) {
                return item.getValue();
            }
        }
        return null;
    }
}