package com.example.demo.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor; /**
 * ProductProfitDto
 * Profit analysis for a single product over a time period
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductProfitDto {
    private Integer productId;
    private String productName;
    private String productCode;

    private double totalCost;              // Sum of all purchases in period
    private double totalRevenue;           // Sum of all sales in period
    private double profit;                 // Revenue - Cost
    private double marginPercent;          // (Profit / Revenue) * 100

    private double totalBought;            // Total units purchased
    private String buyingUnit;             // e.g., "units", "kg", "cartons"
    private double totalSold;              // Total units sold
    private String sellingUnit;            // e.g., "pcs", "kg"

    private boolean isLossMaking;          // True if profit < 0
}
