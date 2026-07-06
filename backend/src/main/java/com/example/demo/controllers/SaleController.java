package com.example.demo.controllers;

import com.example.demo.dtos.CheckoutRequest;
import com.example.demo.models.Sale;
import com.example.demo.services.SaleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/sales")
public class SaleController {

    @Autowired
    private SaleService saleService;

    // POST: /api/sales/checkout
    @PostMapping("/checkout")
    public ResponseEntity<?> processCheckout(@RequestBody CheckoutRequest request) {
        try {
            Sale completedSale = saleService.processCheckout(request);
            return ResponseEntity.ok(completedSale);
        } catch (IllegalArgumentException e) {
            // Returns 400 Bad Request with the exact reason (e.g., "Insufficient stock")
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("An unexpected error occurred during checkout.");
        }
    }
}