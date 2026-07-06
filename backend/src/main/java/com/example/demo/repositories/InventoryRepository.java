package com.example.demo.repositories;

import com.example.demo.models.Inventory;
import com.example.demo.models.Item;
import com.example.demo.models.Store;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InventoryRepository extends JpaRepository<Inventory, Integer> {
    // Find all items stocked in a specific branch
    List<Inventory> findByStore(Store store);

    // Find a specific item in a specific branch
    Optional<Inventory> findByStoreAndItem(Store store, Item item);
}