package com.example.demo.repositories;

import com.example.demo.models.Company;
import com.example.demo.models.Item;
import com.example.demo.models.StockAddition;
import com.example.demo.models.Store;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface StockAdditionRepository extends JpaRepository<StockAddition, Integer> {
    // Allows the Admin to easily view all deliveries from a specific supplier
    List<StockAddition> findByCompany(Company company);

    List<StockAddition> findByStore(Store store);

    List<StockAddition> findByItem(Item item);

    List<StockAddition> findByDateAddedBetween(LocalDateTime start, LocalDateTime end);

    List<StockAddition> findByItemAndDateAddedBetween(Item item, LocalDateTime start, LocalDateTime end);
}