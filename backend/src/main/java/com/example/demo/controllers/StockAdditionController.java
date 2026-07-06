package com.example.demo.controllers;

import com.example.demo.models.StockAddition;
import com.example.demo.services.StockAdditionService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/**
 * Stock Addition / Purchase Controller
 *
 * Endpoints for:
 * - Receiving stock from suppliers
 * - Querying purchase history
 * - Analyzing purchase costs
 * - Managing purchase records
 *
 * Base URL: /api/supplies
 */
@RestController
@RequestMapping("/supplies")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'CASHIER')")
public class StockAdditionController {

    private final StockAdditionService stockAdditionService;

    // ========================================================================
    // RECEIVE STOCK (Main Operation)
    // ========================================================================

    /**
     * Receive stock delivery from supplier.
     *
     * POST /api/supplies/receive
     * Body: {
     *   "company": { "id": 1 },
     *   "store": { "id": 1 },
     *   "item": { "id": 5 },
     *   "quantity": 100,
     *   "basePrice": 50.0
     * }
     */
    @PostMapping("/receive")
    public ResponseEntity<?> receiveDelivery(@RequestBody StockAddition delivery) {
        try {
            StockAddition savedDelivery = stockAdditionService.receiveStockFromSupplier(delivery);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedDelivery);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ErrorResponse(
                    false,
                    "Invalid delivery data",
                    e.getMessage()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ErrorResponse(
                    false,
                    "Error processing delivery",
                    e.getMessage()
            ));
        }
    }

    // ========================================================================
    // RETRIEVE PURCHASES
    // ========================================================================

    /**
     * Get all stock additions/purchases.
     * GET /api/supplies
     */
    @GetMapping
    public ResponseEntity<List<StockAddition>> getSupplyHistory() {
        return ResponseEntity.ok(stockAdditionService.getAllDeliveries());
    }

    /**
     * Get purchase by ID.
     * GET /api/supplies/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getPurchaseById(@PathVariable Integer id) {
        try {
            return ResponseEntity.ok(stockAdditionService.getPurchaseById(id));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ErrorResponse(
                    false,
                    "Purchase not found",
                    e.getMessage()
            ));
        }
    }

    // ========================================================================
    // FILTER PURCHASES
    // ========================================================================

    /**
     * Get all purchases from a specific supplier.
     * GET /api/supplies/company/{companyId}
     */
    @GetMapping("/company/{companyId}")
    public ResponseEntity<?> getPurchasesByCompany(@PathVariable Integer companyId) {
        try {
            return ResponseEntity.ok(stockAdditionService.getPurchasesByCompany(companyId));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ErrorResponse(
                    false,
                    "Company not found",
                    e.getMessage()
            ));
        }
    }

    /**
     * Get all purchases received at a specific store.
     * GET /api/supplies/store/{storeId}
     */
    @GetMapping("/store/{storeId}")
    public ResponseEntity<?> getPurchasesByStore(@PathVariable Integer storeId) {
        try {
            return ResponseEntity.ok(stockAdditionService.getPurchasesByStore(storeId));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ErrorResponse(
                    false,
                    "Store not found",
                    e.getMessage()
            ));
        }
    }

    /**
     * Get all purchases of a specific item.
     * GET /api/supplies/item/{itemId}
     */
    @GetMapping("/item/{itemId}")
    public ResponseEntity<?> getPurchasesByItem(@PathVariable Integer itemId) {
        try {
            return ResponseEntity.ok(stockAdditionService.getPurchasesByItem(itemId));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ErrorResponse(
                    false,
                    "Item not found",
                    e.getMessage()
            ));
        }
    }

    /**
     * Get purchases within a date range.
     * GET /api/supplies/by-date?startDate=2024-01-01&endDate=2024-12-31
     */
    @GetMapping("/by-date")
    public ResponseEntity<List<StockAddition>> getPurchasesByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(stockAdditionService.getPurchasesByDateRange(startDate, endDate));
    }

    /**
     * Get purchases for a specific month.
     * GET /api/supplies/month/{year}/{month}
     * Example: /api/supplies/month/2024/3  (March 2024)
     */
    @GetMapping("/month/{year}/{month}")
    public ResponseEntity<List<StockAddition>> getPurchasesByMonth(
            @PathVariable int year,
            @PathVariable int month) {
        return ResponseEntity.ok(stockAdditionService.getPurchasesByMonth(year, month));
    }

    // ========================================================================
    // COST ANALYSIS
    // ========================================================================

    /**
     * Get total purchase cost from a supplier.
     * GET /api/supplies/company/{companyId}/total-cost
     */
    @GetMapping("/company/{companyId}/total-cost")
    public ResponseEntity<?> getTotalPurchaseCost(@PathVariable Integer companyId) {
        try {
            Double totalCost = stockAdditionService.getTotalPurchaseCost(companyId);
            return ResponseEntity.ok(new CostResponse(totalCost));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ErrorResponse(
                    false,
                    "Company not found",
                    e.getMessage()
            ));
        }
    }

    /**
     * Get total purchase cost for a date range.
     * GET /api/supplies/cost/by-date?startDate=2024-01-01&endDate=2024-12-31
     */
    @GetMapping("/cost/by-date")
    public ResponseEntity<CostResponse> getTotalCostByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        Double totalCost = stockAdditionService.getTotalPurchaseCost(startDate, endDate);
        return ResponseEntity.ok(new CostResponse(totalCost));
    }

    /**
     * Get average purchase cost per unit for an item.
     * GET /api/supplies/item/{itemId}/average-cost
     */
    @GetMapping("/item/{itemId}/average-cost")
    public ResponseEntity<?> getAveragePurchaseCost(@PathVariable Integer itemId) {
        try {
            Double avgCost = stockAdditionService.getAveragePurchaseCost(itemId);
            return ResponseEntity.ok(new CostResponse(avgCost));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ErrorResponse(
                    false,
                    "Item not found",
                    e.getMessage()
            ));
        }
    }

    // ========================================================================
    // STATISTICS
    // ========================================================================

    /**
     * Get purchase count from a supplier.
     * GET /api/supplies/company/{companyId}/count
     */
    @GetMapping("/company/{companyId}/count")
    public ResponseEntity<?> getPurchaseCount(@PathVariable Integer companyId) {
        try {
            Long count = stockAdditionService.getPurchaseCount(companyId);
            return ResponseEntity.ok(new CountResponse(count));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ErrorResponse(
                    false,
                    "Company not found",
                    e.getMessage()
            ));
        }
    }

    /**
     * Get total quantity purchased from a supplier.
     * GET /api/supplies/company/{companyId}/quantity
     */
    @GetMapping("/company/{companyId}/quantity")
    public ResponseEntity<?> getTotalQuantityPurchased(@PathVariable Integer companyId) {
        try {
            Integer totalQty = stockAdditionService.getTotalQuantityPurchased(companyId);
            return ResponseEntity.ok(new QuantityResponse(totalQty));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ErrorResponse(
                    false,
                    "Company not found",
                    e.getMessage()
            ));
        }
    }

    /**
     * Get last purchase date for an item.
     * GET /api/supplies/item/{itemId}/last-purchase
     */
    @GetMapping("/item/{itemId}/last-purchase")
    public ResponseEntity<?> getLastPurchaseDate(@PathVariable Integer itemId) {
        try {
            var lastDate = stockAdditionService.getLastPurchaseDate(itemId);
            return ResponseEntity.ok(new LastPurchaseDateResponse(lastDate));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ErrorResponse(
                    false,
                    "Item not found",
                    e.getMessage()
            ));
        }
    }

    // ========================================================================
    // MANAGEMENT
    // ========================================================================

    /**
     * Delete a purchase (recent only - within 24 hours).
     * DELETE /api/supplies/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePurchase(@PathVariable Integer id) {
        try {
            stockAdditionService.deletePurchase(id);
            return ResponseEntity.ok(new SuccessResponse(true, "Purchase deleted successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ErrorResponse(
                    false,
                    "Cannot delete purchase",
                    e.getMessage()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ErrorResponse(
                    false,
                    "Error deleting purchase",
                    e.getMessage()
            ));
        }
    }

    /**
     * Reverse a purchase (creates audit trail).
     * POST /api/supplies/{id}/reverse
     */
    @PostMapping("/{id}/reverse")
    public ResponseEntity<?> reversePurchase(@PathVariable Integer id) {
        try {
            StockAddition reversal = stockAdditionService.reversePurchase(id);
            return ResponseEntity.ok(reversal);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ErrorResponse(
                    false,
                    "Error reversing purchase",
                    e.getMessage()
            ));
        }
    }

    // ========================================================================
    // Response DTOs
    // ========================================================================

    @lombok.Data
    @lombok.AllArgsConstructor
    public static class ErrorResponse {
        private boolean success;
        private String error;
        private String message;
    }

    @lombok.Data
    @lombok.AllArgsConstructor
    public static class SuccessResponse {
        private boolean success;
        private String message;
    }

    @lombok.Data
    @lombok.AllArgsConstructor
    public static class CostResponse {
        private Double totalCost;
    }

    @lombok.Data
    @lombok.AllArgsConstructor
    public static class CountResponse {
        private Long count;
    }

    @lombok.Data
    @lombok.AllArgsConstructor
    public static class QuantityResponse {
        private Integer totalQuantity;
    }

    @lombok.Data
    @lombok.AllArgsConstructor
    public static class LastPurchaseDateResponse {
        private Object lastPurchaseDate;
    }
}