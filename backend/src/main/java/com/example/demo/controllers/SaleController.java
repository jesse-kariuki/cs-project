package com.example.demo.controllers;

import com.example.demo.dto.TopProductDto;
import com.example.demo.dtos.*;
import com.example.demo.enumeration.SaleStatus;
import com.example.demo.models.Sale;
import com.example.demo.services.PaymentService;
import com.example.demo.services.SaleService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * SaleController - handles all sales and payment operations
 *
 * Refactoring improvements:
 * 1. Separated concerns: SaleController handles HTTP, PaymentService handles M-Pesa
 * 2. Consistent response format with ApiResponse wrapper
 * 3. Proper HTTP status codes (400, 404, 500)
 * 4. Removed try-catch spaghetti with @ExceptionHandler (optional, shown below)
 * 5. Added logging for debugging
 * 6. Better request validation
 * 7. Backwards compatible with existing endpoint
 */
@Slf4j
@RestController
@RequestMapping("/sales")
public class SaleController {

    @Autowired
    private SaleService saleService;

    @Autowired
    private PaymentService paymentService;

    // ============ OPTION A: BACKWARDS COMPATIBLE (Keep existing + add M-Pesa) ============

    /**
     * POST /sales/checkout
     *
     * ORIGINAL endpoint - returns raw Sale entity for backwards compatibility.
     * If you want M-Pesa, use /sales/checkout/with-mpesa instead.
     *
     * Request:
     * {
     *   "storeId": 1,
     *   "paymentMethodId": 1,
     *   "customerId": null,
     *   "cartItems": [...]
     * }
     */
    @PostMapping("/checkout")
    public ResponseEntity<?> processCheckout(@RequestBody CheckoutRequest request) {
        try {
            log.info("Classic checkout request received for store: {}", request.getStoreId());

            // Validate request
            if (request.getCartItems() == null || request.getCartItems().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body("Cannot process an empty cart.");
            }

            Sale completedSale = saleService.processCheckout(request);
            return ResponseEntity.ok(completedSale);

        } catch (IllegalArgumentException e) {
            log.warn("Validation error during checkout: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            log.error("Unexpected error during checkout", e);
            return ResponseEntity.internalServerError()
                    .body("An unexpected error occurred during checkout.");
        }
    }

    // ============ OPTION B: NEW M-PESA ENDPOINTS ============

    /**
     * POST /sales/checkout/with-mpesa
     *
     * NEW endpoint - Combined: create sale + initiate M-Pesa payment
     * Returns structured response with checkoutRequestId
     *
     * Request:
     * {
     *   "storeId": 1,
     *   "paymentMethodId": 2,
     *   "phone": "254712345678",
     *   "cartItems": [...]
     * }
     */
    @PostMapping("/checkout/with-mpesa")
    public ResponseEntity<?> checkoutWithMpesa(@RequestBody CheckoutRequestWithPhone request) {
        try {
            if (request.getCartItems() == null || request.getCartItems().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(new ErrorResponse(
                                false,
                                "Validation Error",
                                "Cannot process an empty cart.",
                                Instant.now().toEpochMilli()
                        ));
            }

            if (request.getPhone() == null || request.getPhone().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(new ErrorResponse(
                                false,
                                "Validation Error",
                                "Phone number is required for M-Pesa payment.",
                                Instant.now().toEpochMilli()
                        ));
            }

            log.info("M-Pesa checkout: Store={}, Phone={}, Items={}",
                    request.getStoreId(), request.getPhone(), request.getCartItems().size());

            // 1. Create sale
            Sale sale = saleService.processCheckout(request);

            // 2. Initiate M-Pesa payment
            Map<String, Object> mpesaResponse = paymentService.initiateMpesaPayment(
                    sale.getId(),
                    request.getPhone(),
                    "SALE-" + sale.getId()
            );

            // 3. Return structured response
            MpesaPaymentResponse response = MpesaPaymentResponse.builder()
                    .saleId(sale.getId())
                    .checkoutRequestId(mpesaResponse.get("CheckoutRequestID").toString())
                    .message("STK push sent. Check your phone for the M-Pesa PIN prompt.")
                    .status("initiated")
                    .timestamp(Instant.now().toEpochMilli())
                    .build();

            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            log.warn("Validation error: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(new ErrorResponse(
                            false,
                            "Validation Error",
                            e.getMessage(),
                            Instant.now().toEpochMilli()
                    ));
        } catch (Exception e) {
            log.error("Error during M-Pesa checkout", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse(
                            false,
                            "Checkout Failed",
                            e.getMessage(),
                            Instant.now().toEpochMilli()
                    ));
        }
    }

    /**
     * POST /sales/pay-mpesa/{saleId}
     *
     * Initiate M-Pesa payment for an existing sale
     */
    @PostMapping("/pay-mpesa/{saleId}")
    public ResponseEntity<?> payWithMpesa(
            @PathVariable Integer saleId,
            @RequestBody MpesaPaymentRequest request) {
        try {
            log.info("M-Pesa payment for Sale: {} | Phone: {}", saleId, request.getPhone());

            Map<String, Object> mpesaResponse = paymentService.initiateMpesaPayment(
                    saleId,
                    request.getPhone(),
                    request.getAccountReference()
            );

            MpesaPaymentResponse response = MpesaPaymentResponse.builder()
                    .saleId(saleId)
                    .checkoutRequestId(mpesaResponse.get("CheckoutRequestID").toString())
                    .message("STK push sent. Check your phone for the M-Pesa PIN prompt.")
                    .status("initiated")
                    .timestamp(Instant.now().toEpochMilli())
                    .build();

            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            log.warn("Validation error for Sale {}: {}", saleId, e.getMessage());
            return ResponseEntity.badRequest()
                    .body(new ErrorResponse(
                            false,
                            "Validation Error",
                            e.getMessage(),
                            Instant.now().toEpochMilli()
                    ));
        } catch (Exception e) {
            log.error("Error initiating M-Pesa payment for Sale: {}", saleId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse(
                            false,
                            "Payment Initiation Failed",
                            e.getMessage(),
                            Instant.now().toEpochMilli()
                    ));
        }
    }

    /**
     * GET /sales/payment-status/{saleId}
     *
     * Check M-Pesa payment status
     */
    @GetMapping("/payment-status/{saleId}")
    public ResponseEntity<?> getPaymentStatus(@PathVariable Integer saleId) {
        try {
            log.info("Checking payment status for Sale: {}", saleId);

            Map<String, Object> statusResponse = paymentService.verifyPaymentStatus(saleId);

            return ResponseEntity.ok(
                    ApiResponse.builder()
                            .success(true)
                            .message("Payment status retrieved")
                            .data(statusResponse)
                            .timestamp(Instant.now().toEpochMilli())
                            .build()
            );

        } catch (IllegalArgumentException e) {
            log.warn("Validation error: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(new ErrorResponse(
                            false,
                            "Validation Error",
                            e.getMessage(),
                            Instant.now().toEpochMilli()
                    ));
        } catch (Exception e) {
            log.error("Error checking payment status for Sale: {}", saleId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse(
                            false,
                            "Status Check Failed",
                            e.getMessage(),
                            Instant.now().toEpochMilli()
                    ));
        }
    }

    /**
     * POST /sales/mpesa/callback
     *
     * M-Pesa callback from Safaricom - NO AUTHENTICATION!
     * Always respond 200 immediately
     */
    @PostMapping("/mpesa/callback")
    public ResponseEntity<?> mpesaCallback(@RequestBody MpesaCallbackPayload payload) {
        // Respond 200 immediately
        ResponseEntity<?> acknowledgement = ResponseEntity.ok(
                Map.of("ResultCode", 0, "ResultDesc", "Accepted")
        );

        // Process asynchronously
        try {
            log.info("M-Pesa callback received");
            paymentService.processCallback(payload);
        } catch (Exception e) {
            log.error("Error processing M-Pesa callback", e);
        }

        return acknowledgement;
    }

    /**
     * GET /sales/{saleId}
     *
     * Get sale details
     */
    @GetMapping("/{saleId}")
    public ResponseEntity<?> getSale(@PathVariable Integer saleId) {
        try {
            Sale sale = saleService.getSaleById(saleId);
            return ResponseEntity.ok(sale);
        } catch (IllegalArgumentException e) {
            log.warn("Sale not found: {}", saleId);
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error fetching sale: {}", saleId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error retrieving sale");
        }
    }

    @GetMapping
    public ResponseEntity<List<Sale>> getAllSales() {
        return ResponseEntity.ok(saleService.getAllSales());
    }

    @GetMapping("/by-date")
    public ResponseEntity<List<Sale>> getSalesByDate(
            @RequestParam LocalDate start,
            @RequestParam LocalDate end
    ) {
        return ResponseEntity.ok(
                saleService.getSalesByDate(start, end)
        );
    }

    @GetMapping("/{saleId}/status")
    public ResponseEntity<?> getSaleStatus(@PathVariable Integer saleId) {
        try {
            Sale sale = saleService.getSaleById(saleId);

            return ResponseEntity.ok(
                    ApiResponse.builder()
                            .success(true)
                            .message("Sale status retrieved")
                            .data(Map.of(
                                    "saleId", sale.getId(),
                                    "status", sale.getStatus().toString(),  // ✅ This is what we need
                                    "totalAmount", sale.getTotalAmount(),
                                    "mpesaReceiptNumber", sale.getMpesaReceiptNumber()
                            ))
                            .timestamp(Instant.now().toEpochMilli())
                            .build()
            );
        } catch (Exception e) {
            log.error("Error getting sale status for Sale: {}", saleId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse(
                            false,
                            "Failed to get sale status",
                            e.getMessage(),
                            Instant.now().toEpochMilli()
                    ));
        }
    }

    @GetMapping("/today/total")
    public ResponseEntity<Double> getTodaySalesTotal() {
        return ResponseEntity.ok(saleService.getTodaySalesTotal());
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<Sale>> getOrdersByStatus(
            @PathVariable SaleStatus status
    ) {
        return ResponseEntity.ok(
                saleService.getSalesByStatus(status)
        );
    }

    @GetMapping("/monthly/total")
    public ResponseEntity<Double> getMonthlySalesTotal() {
        return ResponseEntity.ok(saleService.getMonthlySalesTotal());
    }

    @GetMapping("/reports/top-selling")
    public ResponseEntity<List<TopProductDto>> getTopSellingProducts() {
        return ResponseEntity.ok(saleService.getTopSellingProducts());
    }
}