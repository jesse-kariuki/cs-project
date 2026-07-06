package com.example.demo.repositories;

import com.example.demo.models.Item;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ItemRepository extends JpaRepository<Item, Integer> {
    Optional<Item> findByPartNumber(String partNumber);
    boolean existsByPartNumber(String partNumber);
}