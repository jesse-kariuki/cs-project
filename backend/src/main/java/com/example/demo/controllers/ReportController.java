package com.example.demo.controllers;

import com.example.demo.dtos.*;

import com.example.demo.dto.*;
import com.example.demo.services.ReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@RestController
@RequestMapping("/reports")
public class ReportController {

    @Autowired
    private ReportService reportService;

    /**
     * GET: /api/reports/dashboard
     * Quick dashboard summary with total revenue, transactions, and low stock alerts
     */
    @GetMapping("/dashboard")
    public ResponseEntity<DashboardSummary> getDashboardSummary() {
        try {
            DashboardSummary summary = reportService.generateDashboardSummary();
            return ResponseEntity.ok(summary);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * GET: /api/reports/monthly?year=2026&month=3
     * Detailed monthly report with revenue, cost, profit breakdown per product
     *
     * @param year - Year (defaults to current year)
     * @param month - Month 1-12 (defaults to current month)
     * @return MonthlyReportDto with summary and per-product breakdown
     */
    @GetMapping("/monthly")
    public ResponseEntity<MonthlyReportDto> getMonthlyReport(
            @RequestParam(defaultValue = "0") int year,
            @RequestParam(defaultValue = "0") int month) {
        try {
            if (year == 0) year = LocalDate.now().getYear();
            if (month == 0) month = LocalDate.now().getMonthValue();

            MonthlyReportDto report = reportService.getMonthlyReport(year, month);
            return ResponseEntity.ok(report);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(null);
        }
    }

    /**
     * GET: /api/reports/profit
     * All-time profit analysis per product
     * Sorted by profit amount (highest first)
     *
     * @return List of ProductProfitDto sorted by profit descending
     */
    @GetMapping("/profit")
    public ResponseEntity<List<ProductProfitDto>> getAllTimeProfit() {
        try {
            List<ProductProfitDto> profits = reportService.getAllTimeProfit();
            return ResponseEntity.ok(profits);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(null);
        }
    }

    /**
     * GET: /api/reports/receipt/{saleId}
     * Get a single receipt by sale ID
     * Returns receipt with header and line items
     *
     * @param saleId - The sale transaction ID
     * @return ReceiptDto with complete receipt details
     */
    @GetMapping("/receipt/{saleId}")
    public ResponseEntity<ReceiptDto> getReceiptBySaleId(@PathVariable Integer saleId) {
        try {
            ReceiptDto receipt = reportService.getReceiptBySaleId(saleId);
            return ResponseEntity.ok(receipt);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * GET: /api/reports/receipts?startDate=2026-06-01&endDate=2026-06-29
     * Get multiple receipts for a date range
     * Returns list of receipts with all line items
     *
     * @param startDate - Start date (format: yyyy-MM-dd)
     * @param endDate - End date (format: yyyy-MM-dd)
     * @return List of ReceiptDto for the date range
     */
    @GetMapping("/receipts")
    public ResponseEntity<List<ReceiptDto>> getReceiptsByDateRange(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        try {
            // Default to current day if not specified
            LocalDate start = startDate != null ? LocalDate.parse(startDate) : LocalDate.now();
            LocalDate end = endDate != null ? LocalDate.parse(endDate) : LocalDate.now();

            LocalDateTime startDateTime = start.atStartOfDay();
            LocalDateTime endDateTime = end.atTime(LocalTime.MAX);

            List<ReceiptDto> receipts = reportService.getReceiptsByDateRange(startDateTime, endDateTime);
            return ResponseEntity.ok(receipts);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}