package com.example.demo.controllers;

import com.example.demo.models.Inventory;
import com.example.demo.models.StockTransfer;
import com.example.demo.services.InventoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/inventory")
public class InventoryController {

    @Autowired
    private InventoryService inventoryService;

    // GET: /api/inventory
    @GetMapping
    public ResponseEntity<List<Inventory>> getAllInventory() {
        return ResponseEntity.ok(inventoryService.getAllInventory());
    }

    // GET: /api/inventory/store/1
    @GetMapping("/store/{storeId}")
    public ResponseEntity<?> getStoreInventory(@PathVariable Integer storeId) {
        try {
            return ResponseEntity.ok(inventoryService.getInventoryByStore(storeId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // POST: /api/inventory/add?storeId=1&itemId=5&quantity=20
    @PostMapping("/add")
    public ResponseEntity<?> addStock(
            @RequestParam Integer storeId,
            @RequestParam Integer itemId,
            @RequestParam Integer quantity) {
        try {
            Inventory updatedInventory = inventoryService.addStock(storeId, itemId, quantity);
            return ResponseEntity.ok(updatedInventory);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // POST: /api/inventory/transfer?fromStoreId=1&toStoreId=2&itemId=5&quantity=10
    @PostMapping("/transfer")
    public ResponseEntity<?> transferStock(
            @RequestParam Integer fromStoreId,
            @RequestParam Integer toStoreId,
            @RequestParam Integer itemId,
            @RequestParam Integer quantity) {
        try {
            StockTransfer transferReceipt = inventoryService.transferStock(fromStoreId, toStoreId, itemId, quantity);
            return ResponseEntity.ok(transferReceipt);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            // Failsafe for unexpected server/database errors
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("An unexpected error occurred during the transfer.");
        }
    }
}