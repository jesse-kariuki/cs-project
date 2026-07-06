package com.example.demo.services;

import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.models.*;
import com.example.demo.repositories.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Stock Addition / Purchase Service
 *
 * Handles supplier purchases and stock replenishment.
 * Tracks:
 * - Cost of goods (COGS)
 * - Inventory levels by store
 * - Supplier purchase history
 * - Low stock alerts
 *
 * This service is used for:
 * - Receiving stock from suppliers
 * - Tracking purchase costs for profit calculation
 * - Querying purchase history
 * - Managing inventory across stores
 */
@Service
@RequiredArgsConstructor
public class StockAdditionService {

    @Autowired private StockAdditionRepository stockAdditionRepository;
    @Autowired private InventoryRepository inventoryRepository;
    @Autowired private StoreRepository storeRepository;
    @Autowired private ItemRepository itemRepository;
    @Autowired private CompanyRepository companyRepository;

    private static final int LOW_STOCK_THRESHOLD = 5;

    // ========================================================================
    // PURCHASE RECEIPT / STOCK ADDITION
    // ========================================================================

    /**
     * Receive stock from supplier.
     *
     * Flow:
     * 1. Validate quantity and price
     * 2. Find or create inventory record for this store/item
     * 3. Add received quantity to inventory
     * 4. Record the purchase for cost tracking
     * 5. Alert if low stock
     *
     * @param delivery StockAddition with company, store, item, quantity, basePrice
     * @return Saved purchase record
     */
    @Transactional
    public StockAddition receiveStockFromSupplier(StockAddition delivery) {
        // Validate inputs
        if (delivery.getQuantity() <= 0) {
            throw new IllegalArgumentException("Quantity received must be greater than zero.");
        }
        if (delivery.getBasePrice() == null || delivery.getBasePrice() < 0) {
            throw new IllegalArgumentException("Base price cannot be negative.");
        }
        if (delivery.getCompany() == null) {
            throw new IllegalArgumentException("Supplier company is required.");
        }
        if (delivery.getStore() == null) {
            throw new IllegalArgumentException("Store is required.");
        }
        if (delivery.getItem() == null) {
            throw new IllegalArgumentException("Item is required.");
        }

        // Set timestamp
        delivery.setDateAdded(LocalDateTime.now());

        // Find or create inventory for this store/item combination
        Inventory stock = inventoryRepository.findByStoreAndItem(delivery.getStore(), delivery.getItem())
                .orElse(new Inventory(delivery.getStore(), delivery.getItem(), 0));

        // Add received quantity to inventory
        stock.setQuantity(stock.getQuantity() + delivery.getQuantity());
        inventoryRepository.save(stock);

        // Save the purchase record (for cost tracking)
        StockAddition savedDelivery = stockAdditionRepository.save(delivery);

        // Alert if stock is low
        checkLowStockAlert(stock);

        return savedDelivery;
    }

    // ========================================================================
    // BASIC QUERIES
    // ========================================================================

    /**
     * Get all purchases/deliveries.
     */
    public List<StockAddition> getAllDeliveries() {
        return stockAdditionRepository.findAll();
    }

    /**
     * Get purchase by ID.
     */
    public StockAddition getPurchaseById(Integer id) {
        return stockAdditionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Purchase not found with id: " + id
                ));
    }

    // ========================================================================
    // FILTER BY ENTITY
    // ========================================================================

    /**
     * Get all purchases from a specific supplier (company).
     */
    public List<StockAddition> getPurchasesByCompany(Integer companyId) {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found"));
        return stockAdditionRepository.findByCompany(company);
    }

    /**
     * Get all purchases received at a specific store.
     */
    public List<StockAddition> getPurchasesByStore(Integer storeId) {
        Store store = storeRepository.findById(storeId)
                .orElseThrow(() -> new ResourceNotFoundException("Store not found"));
        return stockAdditionRepository.findByStore(store);
    }

    /**
     * Get all purchases of a specific item.
     */
    public List<StockAddition> getPurchasesByItem(Integer itemId) {
        Item item = itemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Item not found"));
        return stockAdditionRepository.findByItem(item);
    }

    // ========================================================================
    // FILTER BY DATE
    // ========================================================================

    /**
     * Get purchases within a date range.
     */
    public List<StockAddition> getPurchasesByDateRange(LocalDate startDate, LocalDate endDate) {
        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.atTime(23, 59, 59);
        return stockAdditionRepository.findByDateAddedBetween(start, end);
    }


    public List<StockAddition> getPurchasesByMonth(int year, int month) {
        LocalDate startOfMonth = LocalDate.of(year, month, 1);
        LocalDate endOfMonth = startOfMonth.plusMonths(1).minusDays(1);
        LocalDateTime start = startOfMonth.atStartOfDay();
        LocalDateTime end = endOfMonth.atTime(23, 59, 59);

        return stockAdditionRepository.findByDateAddedBetween(start, end);
    }

    // ========================================================================
    // COST CALCULATIONS
    // ========================================================================

    /**
     * Calculate total purchase cost from a specific supplier.
     *
     * Used for accounting/supplier reconciliation.
     *
     * @param companyId Supplier company ID
     * @return Total cost (sum of quantity × basePrice for all purchases)
     */
    public Double getTotalPurchaseCost(Integer companyId) {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found"));

        return stockAdditionRepository.findByCompany(company)
                .stream()
                .mapToDouble(purchase -> purchase.getBasePrice() * purchase.getQuantity())
                .sum();
    }

    public Double getTotalPurchaseCost(LocalDate startDate, LocalDate endDate) {
        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.atTime(23, 59, 59);

        return stockAdditionRepository.findByDateAddedBetween(start, end)
                .stream()
                .mapToDouble(purchase -> purchase.getBasePrice() * purchase.getQuantity())
                .sum();
    }

    /**
     * Calculate average purchase cost per unit for an item.
     *
     * @param itemId Item ID
     * @return Average unit cost from all purchases
     */
    public Double getAveragePurchaseCost(Integer itemId) {
        Item item = itemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Item not found"));

        List<StockAddition> purchases = stockAdditionRepository.findByItem(item);

        if (purchases.isEmpty()) {
            return 0.0;
        }

        double totalCost = purchases.stream()
                .mapToDouble(p -> p.getBasePrice() * p.getQuantity())
                .sum();

        int totalQuantity = purchases.stream()
                .mapToInt(StockAddition::getQuantity)
                .sum();

        return totalCost / totalQuantity;
    }

    // ========================================================================
    // STATISTICS
    // ========================================================================

    /**
     * Count purchases from a supplier.
     */
    public Long getPurchaseCount(Integer companyId) {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found"));
        return stockAdditionRepository.findByCompany(company).stream().count();
    }

    /**
     * Count total units purchased from a supplier.
     */
    public Integer getTotalQuantityPurchased(Integer companyId) {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found"));
        return stockAdditionRepository.findByCompany(company)
                .stream()
                .mapToInt(StockAddition::getQuantity)
                .sum();
    }

    /**
     * Get most recent purchase date for an item.
     */
    public LocalDateTime getLastPurchaseDate(Integer itemId) {
        Item item = itemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Item not found"));

        return stockAdditionRepository.findByItem(item)
                .stream()
                .map(StockAddition::getDateAdded)
                .max(LocalDateTime::compareTo)
                .orElse(null);
    }

    // ========================================================================
    // MANAGEMENT
    // ========================================================================

    /**
     * Delete a purchase record and reverse inventory.
     *
     * WARNING: Only for recent purchases (last 24 hours).
     * For older purchases, create a reversal instead.
     *
     * @param purchaseId Purchase ID
     */
    @Transactional
    public void deletePurchase(Integer purchaseId) {
        StockAddition purchase = getPurchaseById(purchaseId);

        // Check if purchased recently (last 24 hours)
        LocalDateTime purchaseTime = purchase.getDateAdded();
        LocalDateTime oneDayAgo = LocalDateTime.now().minusHours(24);

        if (purchaseTime.isBefore(oneDayAgo)) {
            throw new IllegalArgumentException(
                    "Cannot delete purchases older than 24 hours. Please create a reversal instead."
            );
        }

        // Reverse inventory
        Inventory inventory = inventoryRepository.findByStoreAndItem(purchase.getStore(), purchase.getItem())
                .orElseThrow(() -> new ResourceNotFoundException("Inventory not found"));

        int newQuantity = inventory.getQuantity() - purchase.getQuantity();
        if (newQuantity < 0) {
            throw new IllegalArgumentException(
                    "Cannot reverse: would result in negative inventory"
            );
        }

        inventory.setQuantity(newQuantity);
        inventoryRepository.save(inventory);

        // Delete purchase record
        stockAdditionRepository.delete(purchase);
    }

    /**
     * Create a reversal for an older purchase (after 24 hours).
     *
     * This creates a negative purchase record rather than deleting.
     * Better for audit trail and accounting.
     *
     * @param originalPurchaseId Original purchase to reverse
     * @return New reversal purchase record
     */
    @Transactional
    public StockAddition reversePurchase(Integer originalPurchaseId) {
        StockAddition original = getPurchaseById(originalPurchaseId);

        // Create reversal with negative quantity
        StockAddition reversal = new StockAddition();
        reversal.setCompany(original.getCompany());
        reversal.setStore(original.getStore());
        reversal.setItem(original.getItem());
        reversal.setQuantity(-original.getQuantity());  // Negative = reversal
        reversal.setBasePrice(original.getBasePrice());
        reversal.setDateAdded(LocalDateTime.now());

        // Reverse inventory
        Inventory inventory = inventoryRepository.findByStoreAndItem(original.getStore(), original.getItem())
                .orElseThrow(() -> new ResourceNotFoundException("Inventory not found"));

        inventory.setQuantity(inventory.getQuantity() - original.getQuantity());
        inventoryRepository.save(inventory);

        // Save reversal record
        return stockAdditionRepository.save(reversal);
    }

    // ========================================================================
    // HELPERS
    // ========================================================================

    /**
     * Check if stock level is low and alert.
     */
    private void checkLowStockAlert(Inventory stock) {
        if (stock.getQuantity() <= LOW_STOCK_THRESHOLD) {
            String message = String.format(
                    "⚠️ LOW STOCK ALERT: %s at %s has dropped to %d units",
                    stock.getItem().getPartName(),
                    stock.getStore().getLocation(),
                    stock.getQuantity()
            );
            System.out.println(message);
            // TODO: Send email/notification to admin
        }
    }
}