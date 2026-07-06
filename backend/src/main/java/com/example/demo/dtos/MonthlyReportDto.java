package com.example.demo.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MonthlyReportDto {
    private String month;                              // e.g., "January 2026"
    private double totalRevenue;                       // Total sales revenue for the month
    private double totalCost;                          // Total product cost for the month
    private double netProfit;                          // Revenue - Cost
    private double overallMargin;                      // (Profit / Revenue) * 100
    private List<ProductProfitDto> productBreakdown;   // Per-product metrics
    private List<ProductProfitDto> topPerformers;      // Top 5 profitable products
    private List<ProductProfitDto> lossMakers;         // Products with negative profit
}

