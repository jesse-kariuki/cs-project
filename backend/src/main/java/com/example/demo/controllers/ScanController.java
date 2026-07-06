package com.example.demo.controllers;

import com.example.demo.dtos.CartItemDto;
import com.example.demo.services.ScanService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * Scan Controller for barcode scanning operations.
 *
 * Endpoints:
 * - POST /api/scan - Scan a barcode (FIXED or WEIGHED)
 * - POST /api/scan/generate-weighed - Generate a weighed barcode
 * - GET /api/scan/validate - Validate barcode format
 *
 * Security:
 * - Requires CASHIER or ADMIN role
 *
 * Supports two barcode types:
 * 1. FIXED items: Standard barcode (quantity = 1)
 * 2. WEIGHED items: 13-digit barcode (20PPPPPWWWWW format, calculates weight)
 */
@RestController
@RequestMapping("/api/scan")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('CASHIER', 'ADMIN')")
public class ScanController {

    private final ScanService scanService;

    /**
     * Scan a barcode and return product details for cart.
     *
     * Supports:
     * 1. FIXED items: Standard barcode
     *    Example: POST /api/scan?barcode=BP-2023
     *    Returns: CartItemDto with quantity=1
     *
     * 2. WEIGHED items: 13-digit barcode (20PPPPPWWWWW)
     *    Example: POST /api/scan?barcode=2012345000550
     *    Returns: CartItemDto with calculated weight
     *
     * @param barcode The scanned barcode string
     * @return CartItemDto with product details
     * @throws IllegalArgumentException if barcode format invalid
     */
    @PostMapping
    public ResponseEntity<?> scan(@RequestParam String barcode) {
        try {
            // Validate input
            if (barcode == null || barcode.trim().isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(new ErrorResponse(
                                false,
                                "Invalid barcode",
                                "Barcode cannot be empty"
                        ));
            }

            // Scan the barcode
            CartItemDto item = scanService.handleScan(barcode);
            return ResponseEntity.ok(item);

        } catch (IllegalArgumentException e) {
            // Invalid barcode format
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse(
                            false,
                            "Invalid barcode format",
                            e.getMessage()
                    ));

        } catch (Exception e) {
            // Product not found or other error
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ErrorResponse(
                            false,
                            "Product not found",
                            e.getMessage()
                    ));
        }
    }

    /**
     * Generate a weighed barcode for printing.
     *
     * Useful for scale labels in a garage/retail environment.
     * Generates a 13-digit barcode that encodes:
     * - Product PLU (5 digits)
     * - Total weight and price
     *
     * Example Request:
     * POST /api/scan/generate-weighed
     * {
     *   "plu": "12345",
     *   "weight": 2.5,
     *   "pricePerKg": 150.00
     * }
     *
     * Response: { "barcode": "2012345037500" }
     *
     * @param request Contains plu, weight, pricePerKg
     * @return Generated barcode
     */
    @PostMapping("/generate-weighed")
    public ResponseEntity<?> generateWeighedBarcode(
            @RequestBody WeighedBarcodeRequest request) {

        try {
            // Validate request
            if (request.getPlu() == null || request.getPlu().length() != 5) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(new ErrorResponse(
                                false,
                                "Invalid PLU",
                                "PLU must be exactly 5 digits"
                        ));
            }

            if (request.getWeight() == null || request.getWeight() <= 0) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(new ErrorResponse(
                                false,
                                "Invalid weight",
                                "Weight must be greater than 0"
                        ));
            }

            if (request.getPricePerKg() == null || request.getPricePerKg() <= 0) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(new ErrorResponse(
                                false,
                                "Invalid price",
                                "Price per kg must be greater than 0"
                        ));
            }

            // Generate barcode
            String barcode = scanService.generateWeighedBarcode(
                    request.getPlu(),
                    request.getWeight(),
                    request.getPricePerKg()
            );

            return ResponseEntity.ok(new BarcodeResponse(barcode));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse(
                            false,
                            "Invalid input",
                            e.getMessage()
                    ));
        }
    }

    /**
     * Validate a barcode format without scanning.
     *
     * Useful for frontend validation before submitting.
     *
     * GET /api/scan/validate?barcode=2012345000550
     * Response: { "valid": true, "type": "WEIGHED" }
     *
     * @param barcode Barcode to validate
     * @return Validation result with type
     */
    @GetMapping("/validate")
    public ResponseEntity<?> validateBarcode(@RequestParam String barcode) {
        try {
            if (barcode == null || barcode.trim().isEmpty()) {
                return ResponseEntity.ok(new ValidationResponse(false, "UNKNOWN"));
            }

            boolean isValid = scanService.isValidBarcodeFormat(barcode);

            String type = "UNKNOWN";
            if (barcode.length() == 13 && barcode.startsWith("20")) {
                type = "WEIGHED";
            } else if (isValid) {
                type = "FIXED";
            }

            return ResponseEntity.ok(new ValidationResponse(isValid, type));

        } catch (Exception e) {
            return ResponseEntity.ok(new ValidationResponse(false, "UNKNOWN"));
        }
    }

    // ========================================================================
    // Response DTOs
    // ========================================================================

    /**
     * Error response.
     */
    @lombok.Data
    @lombok.AllArgsConstructor
    public static class ErrorResponse {
        private boolean success;
        private String error;
        private String message;
    }

    /**
     * Barcode generation response.
     */
    @lombok.Data
    @lombok.AllArgsConstructor
    public static class BarcodeResponse {
        private String barcode;
    }

    /**
     * Barcode validation response.
     */
    @lombok.Data
    @lombok.AllArgsConstructor
    public static class ValidationResponse {
        private boolean valid;
        private String type;  // FIXED, WEIGHED, or UNKNOWN
    }

    /**
     * Request for generating weighed barcode.
     */
    @lombok.Data
    @lombok.AllArgsConstructor
    @lombok.NoArgsConstructor
    public static class WeighedBarcodeRequest {
        private String plu;           // 5-digit PLU code
        private Double weight;        // Weight in kg
        private Double pricePerKg;    // Price per kilogram
    }
}