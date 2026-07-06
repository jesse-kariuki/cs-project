package com.example.demo.repositories;

import com.example.demo.models.Company;
import com.example.demo.models.StockAddition;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StockAdditionRepository extends JpaRepository<StockAddition, Integer> {
    // Allows the Admin to easily view all deliveries from a specific supplier
    List<StockAddition> findByCompany(Company company);
}