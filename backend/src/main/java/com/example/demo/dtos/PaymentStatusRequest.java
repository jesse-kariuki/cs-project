package com.example.demo.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor; /**
 * Request to check payment status of a sale.
 * Useful for polling if callback is missed or for UI status checks.
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PaymentStatusRequest {
    private Integer saleId;
}
