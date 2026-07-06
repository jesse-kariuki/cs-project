package com.example.demo.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor; /**
 * Response after initiating M-Pesa STK push.
 * Contains the checkoutRequestId that customer uses to authorize payment.
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class MpesaPaymentResponse {
    private Integer saleId;
    private String checkoutRequestId;
    private String message;
    private String status; // "initiated"
    private Long timestamp;
}
