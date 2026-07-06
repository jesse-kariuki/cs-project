package com.example.demo.repositories;

import com.example.demo.models.Inventory;
import com.example.demo.models.Item;
import com.example.demo.models.Store;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InventoryRepository extends JpaRepository<Inventory, Integer> {

    List<Inventory> findByStore(Store store);

    Optional<Inventory> findByStoreAndItem(Store store, Item item);

    // Find all items with low stock
    @Query("SELECT i FROM Inventory i WHERE i.quantity <= :threshold")
    List<Inventory> findLowStockItems(@Param("threshold") int threshold);

    // Find low stock items for a specific store
    @Query("SELECT i FROM Inventory i WHERE i.store = :store AND i.quantity <= :threshold")
    List<Inventory> findLowStockItemsByStore(
            @Param("store") Store store,
            @Param("threshold") int threshold
    );

    // Count total items in inventory
    @Query("SELECT COUNT(i) FROM Inventory i")
    long countTotalItems();


}