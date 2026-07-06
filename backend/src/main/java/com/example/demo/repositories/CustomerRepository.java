package com.example.demo.repositories;

import com.example.demo.models.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Integer> {
    // Custom query methods (Spring implements these automatically based on the name)
    Optional<Customer> findByName(String name);
    Optional<Customer> findByPhone(String phone);
}