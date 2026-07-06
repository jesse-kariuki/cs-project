package com.example.demo.controllers;

import com.example.demo.models.CompanyPayment;
import com.example.demo.models.CustomerPayment;
import com.example.demo.services.LedgerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ledger")
public class LedgerController {

    @Autowired
    private LedgerService ledgerService;

    // POST: /api/ledger/customer
    @PostMapping("/customer")
    public ResponseEntity<?> receiveCustomerPayment(@RequestBody CustomerPayment payment) {
        try {
            return ResponseEntity.ok(ledgerService.logCustomerPayment(payment));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // POST: /api/ledger/company
    @PostMapping("/company")
    public ResponseEntity<?> paySupplier(@RequestBody CompanyPayment payment) {
        try {
            return ResponseEntity.ok(ledgerService.logCompanyPayment(payment));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}