package com.example.demo.controllers;

import com.example.demo.dto.CreditSummaryDto;
import com.example.demo.dto.SetCreditLimitRequest;
import com.example.demo.models.Customer;
import com.example.demo.services.CustomerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/customers")
public class CustomerController {

    @Autowired
    private CustomerService customerService;

    @GetMapping("/credit")
    public ResponseEntity<List<CreditSummaryDto>> getAllCreditSummaries() {
        return ResponseEntity.ok(customerService.getAllCreditSummaries());
    }

    @GetMapping
    public ResponseEntity<List<Customer>> getAllCustomers() {
        return ResponseEntity.ok(customerService.getAllCustomers());
    }

    @PostMapping
    public ResponseEntity<?> createCustomer(@RequestBody Customer customer) {
        try {
            return ResponseEntity.ok(customerService.createCustomer(customer));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getCustomer(@PathVariable Integer id) {
        return customerService.getCustomerById(id)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/credit-limit")
    public ResponseEntity<?> setCreditLimit(@PathVariable Integer id, @RequestBody SetCreditLimitRequest request) {
        try {
            return ResponseEntity.ok(customerService.setCreditLimit(id, request.getCreditLimit()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/{id}/credit")
    public ResponseEntity<?> getCreditSummary(@PathVariable Integer id) {
        try {
            return ResponseEntity.ok(customerService.getCreditSummary(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}