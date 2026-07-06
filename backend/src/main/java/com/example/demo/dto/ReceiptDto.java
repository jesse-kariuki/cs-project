package com.example.demo.dto;

import lombok.*;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReceiptDto {

    private ReceiptHeaderDto header;
    private List<ReceiptLineItemDto> lineItems;
    private Double totalAmount;  // Sum of all line items
    private Integer totalItems;  // Count of line items
}