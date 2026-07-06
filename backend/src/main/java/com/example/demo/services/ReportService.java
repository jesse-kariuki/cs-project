package com.example.demo.services;

import com.example.demo.dtos.DashboardSummary;
import com.example.demo.models.Inventory;
import com.example.demo.models.Sale;
import com.example.demo.repositories.InventoryRepository;
import com.example.demo.repositories.SaleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ReportService {

    @Autowired
    private SaleRepository saleRepository;

    @Autowired
    private InventoryRepository inventoryRepository;

    private static final int LOW_STOCK_THRESHOLD = 5;

    public DashboardSummary generateDashboardSummary() {
        DashboardSummary summary = new DashboardSummary();

        // 1. Calculate Total Revenue & Transaction Count
        List<Sale> allSales = saleRepository.findAll();
        double totalRevenue = 0.0;

        for (Sale sale : allSales) {
            if (sale.getTotalAmount() != null) {
                totalRevenue += sale.getTotalAmount();
            }
        }

        summary.setTotalRevenue(totalRevenue);
        summary.setTotalSalesTransactions((long) allSales.size());

        // 2. Count Active Low Stock Alerts across all branches
        List<Inventory> allStock = inventoryRepository.findAll();
        long lowStockCount = 0;

        for (Inventory stock : allStock) {
            if (stock.getQuantity() <= LOW_STOCK_THRESHOLD) {
                lowStockCount++;
            }
        }
        summary.setActiveLowStockAlerts(lowStockCount);

        return summary;
    }
}