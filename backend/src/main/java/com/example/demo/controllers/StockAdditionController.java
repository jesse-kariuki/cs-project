package com.example.demo.controllers;

import com.example.demo.models.StockAddition;
import com.example.demo.services.StockAdditionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/supplies")
public class StockAdditionController {

    @Autowired
    private StockAdditionService stockAdditionService;

    // GET: /api/supplies
    @GetMapping
    public ResponseEntity<List<StockAddition>> getSupplyHistory() {
        return ResponseEntity.ok(stockAdditionService.getAllDeliveries());
    }

    // POST: /api/supplies/receive
    @PostMapping("/receive")
    public ResponseEntity<?> receiveDelivery(@RequestBody StockAddition delivery) {
        try {
            StockAddition savedDelivery = stockAdditionService.receiveStockFromSupplier(delivery);
            return ResponseEntity.ok(savedDelivery);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("An error occurred while processing the delivery.");
        }
    }
}