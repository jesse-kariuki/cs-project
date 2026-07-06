package com.example.demo.controllers;

import com.example.demo.dtos.CustomerPaymentRequest;
import com.example.demo.models.CompanyPayment;
import com.example.demo.models.Customer;
import com.example.demo.models.CustomerPayment;
import com.example.demo.models.PaymentMethod;
import com.example.demo.repositories.CustomerRepository;
import com.example.demo.repositories.PaymentMethodRepository;
import com.example.demo.services.LedgerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/ledger")
public class LedgerController {

    @Autowired
    private LedgerService ledgerService;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private PaymentMethodRepository paymentMethodRepository;

    // POST: /api/ledger/customer
    @PostMapping("/customer")
    public ResponseEntity<?> receiveCustomerPayment(@RequestBody CustomerPaymentRequest request) {
        try {
            Customer customer = customerRepository.findById(request.getCustomerId())
                    .orElseThrow(() -> new IllegalArgumentException("Customer not found."));
            PaymentMethod method = paymentMethodRepository.findById(request.getPaymentMethodId())
                    .orElseThrow(() -> new IllegalArgumentException("Payment method not found."));

            CustomerPayment payment = new CustomerPayment();
            payment.setCustomer(customer);
            payment.setPaymentMethod(method);
            payment.setAmount(request.getAmount());

            return ResponseEntity.ok(ledgerService.logCustomerPayment(payment));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/customer/{customerId}/history")
    public ResponseEntity<?> getCustomerHistory(@PathVariable Integer customerId) {
        try {
            Customer customer = customerRepository.findById(customerId)
                    .orElseThrow(() -> new IllegalArgumentException("Customer not found."));
            return ResponseEntity.ok(ledgerService.getCustomerHistory(customer));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}