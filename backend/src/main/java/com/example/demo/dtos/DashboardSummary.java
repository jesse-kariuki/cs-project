package com.example.demo.dtos;

public class DashboardSummary {
    private Double totalRevenue;
    private Long totalSalesTransactions;
    private Long activeLowStockAlerts;

    // Getters and Setters
    public Double getTotalRevenue() { return totalRevenue != null ? totalRevenue : 0.0; }
    public void setTotalRevenue(Double totalRevenue) { this.totalRevenue = totalRevenue; }
    public Long getTotalSalesTransactions() { return totalSalesTransactions != null ? totalSalesTransactions : 0L; }
    public void setTotalSalesTransactions(Long totalSalesTransactions) { this.totalSalesTransactions = totalSalesTransactions; }
    public Long getActiveLowStockAlerts() { return activeLowStockAlerts != null ? activeLowStockAlerts : 0L; }
    public void setActiveLowStockAlerts(Long activeLowStockAlerts) { this.activeLowStockAlerts = activeLowStockAlerts; }
}