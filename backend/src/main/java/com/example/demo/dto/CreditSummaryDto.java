package com.example.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data @Builder @AllArgsConstructor @NoArgsConstructor
public class CreditSummaryDto {
    private Integer customerId;
    private String customerName;
    private String phone;
    private Double creditLimit;
    private Double outstandingBalance;
    private Double availableCredit;
    private List<UnpaidSaleDto> unpaidSales;

    @Data @Builder @AllArgsConstructor @NoArgsConstructor
    public static class UnpaidSaleDto {
        private Integer saleId;
        private LocalDateTime saleDate;
        private Double totalAmount;
        private Double amountPaid;
        private Double balance;
    }
}