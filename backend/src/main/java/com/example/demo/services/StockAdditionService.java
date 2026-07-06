package com.example.demo.services;

import com.example.demo.models.Inventory;
import com.example.demo.models.StockAddition;
import com.example.demo.repositories.InventoryRepository;
import com.example.demo.repositories.StockAdditionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class StockAdditionService {

    @Autowired private StockAdditionRepository stockAdditionRepository;
    @Autowired private InventoryRepository inventoryRepository;

    public List<StockAddition> getAllDeliveries() {
        return stockAdditionRepository.findAll();
    }

    @Transactional
    public StockAddition receiveStockFromSupplier(StockAddition delivery) {
        if (delivery.getQuantity() <= 0) {
            throw new IllegalArgumentException("Quantity received must be greater than zero.");
        }
        if (delivery.getBasePrice() < 0) {
            throw new IllegalArgumentException("Base price cannot be negative.");
        }

        // Set the exact time the delivery was processed
        delivery.setDateAdded(LocalDateTime.now());

        // 1. Check if the store already has a shelf/record for this item.
        // If not, automatically create a new inventory record starting at 0.
        Inventory stock = inventoryRepository.findByStoreAndItem(delivery.getStore(), delivery.getItem())
                .orElse(new Inventory(delivery.getStore(), delivery.getItem(), 0));

        // 2. Add the newly delivered parts to the shelf
        stock.setQuantity(stock.getQuantity() + delivery.getQuantity());
        inventoryRepository.save(stock);

        // 3. Save the official supplier invoice
        return stockAdditionRepository.save(delivery);
    }
}