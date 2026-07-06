package com.example.demo.dto;

import lombok.*;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReceiptLineItemDto {

    private LocalDate dateOfCredit;
    private String partNumber;  // e.g., "MB-ENG-2023"
    private String brand;  // e.g., "Bosch"
    private Integer quantity;  // How many they bought
    private Double unitPrice;  // Cost per item
    private Double total;  // Quantity × Unit Price
    private String unit;  // "pcs" or "kg" depending on type
}