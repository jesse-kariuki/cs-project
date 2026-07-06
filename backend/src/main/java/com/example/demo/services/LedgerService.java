package com.example.demo.services;

import com.example.demo.models.*;
import com.example.demo.repositories.CompanyPaymentRepository;
import com.example.demo.repositories.CreditAllocationRepository;
import com.example.demo.repositories.CustomerPaymentRepository;
import com.example.demo.repositories.SaleRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class LedgerService {

    @Autowired private CustomerPaymentRepository customerPaymentRepository;
    @Autowired private CompanyPaymentRepository companyPaymentRepository;

    @Autowired private CreditAllocationRepository creditAllocationRepository;
    @Autowired private SaleRepository saleRepository;


    @Transactional
    public CustomerPayment logCustomerPayment(CustomerPayment payment) {
        if (payment.getAmount() == null || payment.getAmount() <= 0) {
            throw new IllegalArgumentException("Payment amount must be greater than zero.");
        }
        Customer customer = payment.getCustomer();
        if (customer == null) {
            throw new IllegalArgumentException("Customer is required.");
        }

        List<Sale> unpaidSales = saleRepository
                .findByCustomerAndPaymentMethod_NameIgnoreCaseAndStatusOrderBySaleDateAsc(
                        customer, "credit", com.example.demo.enumeration.SaleStatus.CREDIT);

        double totalOwed = unpaidSales.stream()
                .mapToDouble(s -> s.getTotalAmount() - (s.getAmountPaid() == null ? 0.0 : s.getAmountPaid()))
                .sum();

        if (payment.getAmount() > totalOwed + 0.01) {
            throw new IllegalArgumentException(String.format(
                    "Payment (%.2f) exceeds outstanding credit balance (%.2f) for %s.",
                    payment.getAmount(), totalOwed, customer.getName()));
        }

        payment.setPaymentDate(LocalDateTime.now());
        CustomerPayment savedPayment = customerPaymentRepository.save(payment);

        double remaining = payment.getAmount();
        for (Sale sale : unpaidSales) {
            if (remaining <= 0.0) break;
            double saleBalance = sale.getTotalAmount() - (sale.getAmountPaid() == null ? 0.0 : sale.getAmountPaid());
            if (saleBalance <= 0.0) continue;

            double applied = Math.min(remaining, saleBalance);
            sale.setAmountPaid((sale.getAmountPaid() == null ? 0.0 : sale.getAmountPaid()) + applied);
            if (sale.getAmountPaid() >= sale.getTotalAmount() - 0.01) {
                sale.setStatus(com.example.demo.enumeration.SaleStatus.PAID);
            }
            saleRepository.save(sale);

            CreditAllocation allocation = new CreditAllocation();
            allocation.setPayment(savedPayment);
            allocation.setSale(sale);
            allocation.setAmountApplied(applied);
            allocation.setAllocatedAt(LocalDateTime.now());
            creditAllocationRepository.save(allocation);

            remaining -= applied;
        }

        return savedPayment;
    }

    public List<CustomerPayment> getCustomerHistory(com.example.demo.models.Customer customer) {
        return customerPaymentRepository.findByCustomer(customer);
    }

    public CompanyPayment logCompanyPayment(CompanyPayment payment) {
        if (payment.getAmount() <= 0) {
            throw new IllegalArgumentException("Payment amount must be greater than zero.");
        }
        payment.setPaymentDate(LocalDateTime.now());
        return companyPaymentRepository.save(payment);
    }

    public List<CompanyPayment> getCompanyHistory(com.example.demo.models.Company company) {
        return companyPaymentRepository.findByCompany(company);
    }
}