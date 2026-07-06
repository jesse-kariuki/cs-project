package com.example.demo.controllers;

import com.example.demo.models.PaymentMethod;
import com.example.demo.services.PaymentMethodService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/payments")
public class PaymentMethodController {

    @Autowired
    private PaymentMethodService paymentMethodService;

    @GetMapping
    public ResponseEntity<List<PaymentMethod>> getAllPayments() {
        return ResponseEntity.ok(paymentMethodService.getAllPaymentMethods());
    }

    // GET: /api/payments/active
    @GetMapping("/active")
    public ResponseEntity<List<PaymentMethod>> getActivePayments() {
        return ResponseEntity.ok(paymentMethodService.getActivePaymentMethods());
    }

    // POST: /api/payments
    @PostMapping
    public ResponseEntity<?> addPaymentMethod(@RequestBody PaymentMethod method) {
        try {
            PaymentMethod savedMethod = paymentMethodService.addPaymentMethod(method);
            return ResponseEntity.ok(savedMethod);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}/toggle")
    public ResponseEntity<?> togglePaymentStatus(@PathVariable Integer id, @RequestParam boolean status) {
        try {
            PaymentMethod updatedMethod = paymentMethodService.toggleActiveStatus(id, status);
            return ResponseEntity.ok(updatedMethod);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}