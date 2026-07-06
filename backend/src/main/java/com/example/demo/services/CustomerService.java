package com.example.demo.services;

import com.example.demo.dto.CreditSummaryDto;
import com.example.demo.models.Customer;
import com.example.demo.repositories.CustomerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class CustomerService {

    @Autowired
    private CustomerRepository customerRepository;

    public List<Customer> getAllCustomers() {
        return customerRepository.findAll();
    }

    public Optional<Customer> getCustomerById(Integer id) {
        return customerRepository.findById(id);
    }

    @Autowired private SaleService saleService;

    public Customer setCreditLimit(Integer customerId, Double limit) {
        if (limit == null || limit < 0) {
            throw new IllegalArgumentException("Credit limit cannot be negative.");
        }
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new IllegalArgumentException("Customer not found."));
        customer.setCreditLimit(limit);
        return customerRepository.save(customer);
    }

    public CreditSummaryDto getCreditSummary(Integer customerId) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new IllegalArgumentException("Customer not found."));
        return buildSummary(customer);
    }

    public List<CreditSummaryDto> getAllCreditSummaries() {
        return customerRepository.findAll().stream()
                .map(this::buildSummary)
//                .filter(s -> s.getOutstandingBalance() > 0 || (s.getCreditLimit() != null && s.getCreditLimit() > 0))
                .collect(Collectors.toList());
    }

    private CreditSummaryDto buildSummary(Customer customer) {
        List<com.example.demo.models.Sale> unpaid = saleService.getUnpaidCreditSales(customer);
        double outstanding = unpaid.stream()
                .mapToDouble(s -> s.getTotalAmount() - (s.getAmountPaid() == null ? 0.0 : s.getAmountPaid()))
                .sum();
        double limit = customer.getCreditLimit() == null ? 0.0 : customer.getCreditLimit();

        return CreditSummaryDto.builder()
                .customerId(customer.getId())
                .customerName(customer.getName())
                .phone(customer.getPhone())
                .creditLimit(limit)
                .outstandingBalance(outstanding)
                .availableCredit(Math.max(0, limit - outstanding))
                .unpaidSales(unpaid.stream().map(s -> CreditSummaryDto.UnpaidSaleDto.builder()
                                .saleId(s.getId())
                                .saleDate(s.getSaleDate())
                                .totalAmount(s.getTotalAmount())
                                .amountPaid(s.getAmountPaid() == null ? 0.0 : s.getAmountPaid())
                                .balance(s.getTotalAmount() - (s.getAmountPaid() == null ? 0.0 : s.getAmountPaid()))
                                .build())
                        .collect(Collectors.toList()))
                .build();
    }

    public Customer createCustomer(Customer customer) {
        // Business logic to check for existing unique constraints
        if (customerRepository.findByName(customer.getName()).isPresent()) {
            throw new IllegalArgumentException("A customer with the name '" + customer.getName() + "' already exists.");
        }
        if (customerRepository.findByPhone(customer.getPhone()).isPresent()) {
            throw new IllegalArgumentException("A customer with the phone number '" + customer.getPhone() + "' already exists.");
        }

        return customerRepository.save(customer);
    }
}