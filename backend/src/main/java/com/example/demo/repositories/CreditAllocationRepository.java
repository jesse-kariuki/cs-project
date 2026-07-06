package com.example.demo.repositories;

import com.example.demo.models.CreditAllocation;
import com.example.demo.models.Sale;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CreditAllocationRepository extends JpaRepository<CreditAllocation, Integer> {
    List<CreditAllocation> findBySale(Sale sale);
}