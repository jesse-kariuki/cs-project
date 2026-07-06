package com.example.demo.services;

import com.example.demo.dtos.*;

import com.example.demo.dto.*;
import com.example.demo.models.*;
import com.example.demo.repositories.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ReportService {

    @Autowired
    private SaleRepository saleRepository;

    @Autowired
    private InventoryRepository inventoryRepository;

    @Autowired
    private ItemRepository productRepository;
    @Autowired
    private StockAdditionRepository stockAdditionRepository;


    private static final int LOW_STOCK_THRESHOLD = 5;

    /**
     * Generate quick dashboard summary
     * Used for the main dashboard display
     */
    public DashboardSummary generateDashboardSummary() {
        DashboardSummary summary = new DashboardSummary();

        List<Sale> allSales = saleRepository.findAll();
        double totalRevenue = 0.0;

        for (Sale sale : allSales) {
            if (sale.getTotalAmount() != null) {
                totalRevenue += sale.getTotalAmount();
            }
        }

        summary.setTotalRevenue(totalRevenue);
        summary.setTotalSalesTransactions((long) allSales.size());

        // Count Active Low Stock Alerts across all branches
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

    /**
     * Get detailed monthly report with revenue, cost, and profit breakdown per product
     *
     * @param year Month year
     * @param month Month number (1-12)
     * @return MonthlyReportDto with summary and per-product breakdown
     */
    public MonthlyReportDto getMonthlyReport(int year, int month) {
        LocalDateTime start = LocalDate.of(year, month, 1).atStartOfDay();
        LocalDateTime end = start.plusMonths(1).minusSeconds(1);

        // Get all products
        List<Item> products = productRepository.findAll();

        // Build profit breakdown per product for the month
        List<ProductProfitDto> breakdown = products.stream()
                .map(product -> buildProductProfit(product, start, end))
                .filter(dto -> dto.getTotalCost() > 0 || dto.getTotalRevenue() > 0)
                .sorted(Comparator.comparingDouble(ProductProfitDto::getProfit).reversed())
                .collect(Collectors.toList());

        double totalRevenue = breakdown.stream().mapToDouble(ProductProfitDto::getTotalRevenue).sum();
        double totalCost = breakdown.stream().mapToDouble(ProductProfitDto::getTotalCost).sum();
        double netProfit = totalRevenue - totalCost;
        double overallMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

        List<ProductProfitDto> topPerformers = breakdown.stream()
                .filter(p -> p.getProfit() > 0)
                .limit(5)
                .collect(Collectors.toList());

        List<ProductProfitDto> lossMakers = breakdown.stream()
                .filter(ProductProfitDto::isLossMaking)
                .collect(Collectors.toList());

        String monthLabel = LocalDate.of(year, month, 1)
                .format(DateTimeFormatter.ofPattern("MMMM yyyy"));

        return MonthlyReportDto.builder()
                .month(monthLabel)
                .totalRevenue(totalRevenue)
                .totalCost(totalCost)
                .netProfit(netProfit)
                .overallMargin(overallMargin)
                .productBreakdown(breakdown)
                .topPerformers(topPerformers)
                .lossMakers(lossMakers)
                .build();
    }

    /**
     * Get all-time profit analysis per product
     * Sorted by profit amount (highest first)
     *
     * @return List of ProductProfitDto for all products across all time
     */
    public List<ProductProfitDto> getAllTimeProfit() {
        LocalDateTime start = LocalDateTime.of(2000, 1, 1, 0, 0);
        LocalDateTime end = LocalDateTime.now();

        return productRepository.findAll().stream()
                .map(product -> buildProductProfit(product, start, end))
                .filter(dto -> dto.getTotalCost() > 0 || dto.getTotalRevenue() > 0)
                .sorted(Comparator.comparingDouble(ProductProfitDto::getProfit).reversed())
                .collect(Collectors.toList());
    }

    /**
     * Core profit calculation per product for a date range
     *
     * @param product The product to analyze
     * @param start Start date
     * @param end End date
     * @return ProductProfitDto with profit, margin, and volume metrics
     */
    private ProductProfitDto buildProductProfit(Item product, LocalDateTime start, LocalDateTime end) {
        double totalRevenue = saleRepository.sumRevenueByProductAndDateRange(product, start, end);
        double totalSold = saleRepository.sumQuantitySoldByProductAndDateRange(product, start, end);

        List<StockAddition> purchases = stockAdditionRepository.findByItemAndDateAddedBetween(product, start, end);
        double totalBought = purchases.stream().mapToDouble(StockAddition::getQuantity).sum();
        double totalPurchaseCost = purchases.stream()
                .mapToDouble(p -> p.getQuantity() * p.getBasePrice())
                .sum();

        // Cost of goods sold: prefer this period's actual average purchase cost;
        // fall back to the item's current buying price only if nothing was bought this period
        // (e.g. selling from pre-existing stock with no purchase record in range).
        double avgUnitCost = totalBought > 0
                ? totalPurchaseCost / totalBought
                : (product.getBuyingPrice() != null ? product.getBuyingPrice() : 0.0);

        double totalCost = totalSold * avgUnitCost;
        double profit = totalRevenue - totalCost;
        double margin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

        String unit = "WEIGHED".equals(product.getType()) ? "kg" : "pcs";

        return ProductProfitDto.builder()
                .productId(product.getId())
                .productName(product.getPartName())
                .productCode(product.getCode())
                .totalCost(totalCost)
                .totalRevenue(totalRevenue)
                .profit(profit)
                .marginPercent(margin)
                .totalBought(totalBought)
                .buyingUnit(unit)
                .totalSold(totalSold)
                .sellingUnit(unit)
                .isLossMaking(profit < 0)
                .build();
    }    /**
     * Get low stock alerts
     * Used for dashboard alerts
     */
    public List<Inventory> getLowStockAlerts() {
        return inventoryRepository.findAll().stream()
                .filter(inventory -> inventory.getQuantity() <= LOW_STOCK_THRESHOLD)
                .collect(Collectors.toList());
    }

    /**
     * Get sales for a specific date range
     */
    public double getSalesForDateRange(LocalDateTime start, LocalDateTime end) {
        return saleRepository
                .findBySaleDateBetween(start, end)
                .stream()
                .filter(sale -> "PAID".equals(sale.getStatus()))
                .mapToDouble(Sale::getTotalAmount)
                .sum();
    }

    /**
     * Get receipt by sale ID
     * Returns complete receipt with header and line items
     *
     * @param saleId The sale transaction ID
     * @return ReceiptDto with header and line items
     */
    public ReceiptDto getReceiptBySaleId(Integer saleId) {
        Sale sale = saleRepository.findById(saleId)
                .orElseThrow(() -> new RuntimeException("Sale not found with ID: " + saleId));

        ReceiptHeaderDto header = buildReceiptHeader(sale);
        List<ReceiptLineItemDto> lineItems = buildReceiptLineItems(sale);

        double totalAmount = lineItems.stream()
                .mapToDouble(ReceiptLineItemDto::getTotal)
                .sum();

        return ReceiptDto.builder()
                .header(header)
                .lineItems(lineItems)
                .totalAmount(totalAmount)
                .totalItems(lineItems.size())
                .build();
    }

    /**
     * Get receipts for a date range
     *
     * @param start Start date time
     * @param end End date time
     * @return List of ReceiptDto for the date range
     */
    public List<ReceiptDto> getReceiptsByDateRange(LocalDateTime start, LocalDateTime end) {
        return saleRepository.findBySaleDateBetween(start, end)
                .stream()
                .map(this::buildCompleteReceipt)
                .collect(Collectors.toList());
    }

    /**
     * Build complete receipt from sale
     */
    private ReceiptDto buildCompleteReceipt(Sale sale) {
        ReceiptHeaderDto header = buildReceiptHeader(sale);
        List<ReceiptLineItemDto> lineItems = buildReceiptLineItems(sale);

        double totalAmount = lineItems.stream()
                .mapToDouble(ReceiptLineItemDto::getTotal)
                .sum();

        return ReceiptDto.builder()
                .header(header)
                .lineItems(lineItems)
                .totalAmount(totalAmount)
                .totalItems(lineItems.size())
                .build();
    }

    /**
     * Build receipt header from sale transaction
     */
    private ReceiptHeaderDto buildReceiptHeader(Sale sale) {
        String printType = determinePrintType(sale);

        return ReceiptHeaderDto.builder()
                .printType(printType)
                .dateOfPurchase(sale.getSaleDate())
                .customerName(sale.getCustomer() != null ? sale.getCustomer().getName() : "N/A")
                .phoneNumber(sale.getCustomer() != null ? sale.getCustomer().getPhone() : "N/A")
                .allTotal(sale.getTotalAmount())
                .paid(sale.getStatus().equals("PAID") ? sale.getTotalAmount() : 0.0)
                .onCredit(sale.getStatus().equals("CREDIT") ? sale.getTotalAmount() : 0.0)
                .build();
    }

    /**
     * Build line items from sale items
     */
    private List<ReceiptLineItemDto> buildReceiptLineItems(Sale sale) {
        return sale.getSaleItems().stream()
                .map(saleItem -> buildReceiptLineItem(saleItem, sale.getSaleDate()))
                .collect(Collectors.toList());
    }

    /**
     * Build individual receipt line item from sale item
     */
    private ReceiptLineItemDto buildReceiptLineItem(SaleItem saleItem, LocalDateTime saleDate) {
        Item product = saleItem.getItem();
        String unit = "WEIGHED".equals(product.getType()) ? "kg" : "pcs";
        double total = saleItem.getQuantity() * saleItem.getUnitPrice();

        return ReceiptLineItemDto.builder()
                .dateOfCredit(saleDate.toLocalDate())
                .partNumber(product.getCode())
                .brand(product.getBrand() != null ? product.getBrand() : "N/A")
                .quantity(saleItem.getQuantity())
                .unitPrice(saleItem.getUnitPrice())
                .total(total)
                .unit(unit)
                .build();
    }

    /**
     * Determine print type based on sale status and frequency
     */
    private String determinePrintType(Sale sale) {
        if ("PAID".equals(sale.getStatus())) {
            return "Original Receipt";
        } else if ("CREDIT".equals(sale.getStatus())) {
            return "Invoice";
        } else {
            return "Duplicate";
        }
    }
}