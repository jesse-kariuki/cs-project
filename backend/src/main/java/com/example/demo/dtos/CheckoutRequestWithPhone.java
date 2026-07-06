package com.example.demo.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Extended checkout request that includes phone number for M-Pesa payment.
 *
 * This DTO is used by the SalesController /api/sales/checkout endpoint
 * to create a sale and immediately initiate M-Pesa payment in one request.
 *
 * Structure:
 * {
 *   "storeId": 1,
 *   "customerId": null,
 *   "paymentMethodId": 2,  // M-Pesa payment method ID
 *   "phone": "254712345678",  // Customer's phone for M-Pesa STK push
 *   "cartItems": [
 *     { "itemId": 5, "quantity": 2, "unitPrice": 1000 },
 *     { "itemId": 10, "quantity": 1, "unitPrice": 5000 }
 *   ]
 * }
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CheckoutRequestWithPhone {
    private Integer storeId;
    private Integer customerId;
    private Integer paymentMethodId;
    private List<CartItem> cartItems;

    /**
     * Customer's phone number for M-Pesa STK push.
     * Format: 254XXXXXXXXX, 0XXXXXXXXX, or +254XXXXXXXXX
     * Will be normalized by MpesaService.normalizePhone()
     */
    private String phone;

    /**
     * Cart item structure (same as in CheckoutRequest)
     */
    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class CartItem {
        private Integer itemId;
        private Integer quantity;
        private Double unitPrice;
    }
}