package com.example.demo.services;

import com.example.demo.models.Customer;
import com.example.demo.repositories.CustomerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

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