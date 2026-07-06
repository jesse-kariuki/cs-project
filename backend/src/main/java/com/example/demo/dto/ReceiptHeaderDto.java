package com.example.demo.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReceiptHeaderDto {

    private String printType;  // "Original Receipt", "Duplicate", or "Invoice"
    private LocalDateTime dateOfPurchase;
    private String customerName;
    private String phoneNumber;
    private Double allTotal;  // Total cost of the items
    private Double paid;  // Amount of cash customer handed over
    private Double onCredit;  // Amount of debt still owed
}