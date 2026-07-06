package com.example.demo.services;

import com.example.demo.models.CompanyPayment;
import com.example.demo.models.CustomerPayment;
import com.example.demo.repositories.CompanyPaymentRepository;
import com.example.demo.repositories.CustomerPaymentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class LedgerService {

    @Autowired private CustomerPaymentRepository customerPaymentRepository;
    @Autowired private CompanyPaymentRepository companyPaymentRepository;

    public CustomerPayment logCustomerPayment(CustomerPayment payment) {
        if (payment.getAmount() <= 0) {
            throw new IllegalArgumentException("Payment amount must be greater than zero.");
        }
        payment.setPaymentDate(LocalDateTime.now());
        return customerPaymentRepository.save(payment);
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