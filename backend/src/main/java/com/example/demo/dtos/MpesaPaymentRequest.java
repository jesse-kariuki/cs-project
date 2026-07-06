package com.example.demo.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

// ============ REQUESTS ============

/**
 * Request to initiate M-Pesa payment for an existing sale.
 * The sale must already exist in PENDING or initial state before calling this.
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class MpesaPaymentRequest {
    /**
     * Sale ID to process payment for
     */
    private Integer saleId;

    /**
     * Customer's phone number for M-Pesa STK push.
     * Format: 254XXXXXXXXX, 0XXXXXXXXX, or +254XXXXXXXXX
     * Will be normalized to 254XXXXXXXXX
     */
    private String phone;

    /**
     * Optional: Store transaction reference (shows on M-Pesa statement)
     * If not provided, will default to "SALE-{saleId}"
     */
    private String accountReference;
}

// ============ RESPONSES ============

