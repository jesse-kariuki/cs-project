package com.example.demo.services;

import com.example.demo.models.Inventory;
import com.example.demo.models.Item;
import com.example.demo.models.StockTransfer;
import com.example.demo.models.Store;
import com.example.demo.repositories.InventoryRepository;
import com.example.demo.repositories.ItemRepository;
import com.example.demo.repositories.StockTransferRepository;
import com.example.demo.repositories.StoreRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class InventoryService {

    @Autowired
    private InventoryRepository inventoryRepository;

    @Autowired
    private StoreRepository storeRepository;

    @Autowired
    private ItemRepository itemRepository;

    @Autowired
    private StockTransferRepository stockTransferRepository;

    // View absolute total of all stock across all branches
    public List<Inventory> getAllInventory() {
        return inventoryRepository.findAll();
    }

    // View all stock for a specific branch
    public List<Inventory> getInventoryByStore(Integer storeId) {
        Store store = storeRepository.findById(storeId)
                .orElseThrow(() -> new IllegalArgumentException("Store not found."));
        return inventoryRepository.findByStore(store);
    }

    public Inventory addStock(Integer storeId, Integer itemId, Integer quantityToAdd) {
        if (quantityToAdd <= 0) {
            throw new IllegalArgumentException("Quantity to add must be greater than zero.");
        }

        Store store = storeRepository.findById(storeId)
                .orElseThrow(() -> new IllegalArgumentException("Store not found."));
        Item item = itemRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("Item not found."));

        Inventory inventory = inventoryRepository.findByStoreAndItem(store, item)
                .orElse(new Inventory(store, item, 0));

        inventory.setQuantity(inventory.getQuantity() + quantityToAdd);

        return inventoryRepository.save(inventory);
    }

    @Transactional
    public StockTransfer transferStock(Integer fromStoreId, Integer toStoreId, Integer itemId, Integer quantityToTransfer) {
        if (fromStoreId.equals(toStoreId)) {
            throw new IllegalArgumentException("Source and destination branches cannot be the same.");
        }
        if (quantityToTransfer <= 0) {
            throw new IllegalArgumentException("Transfer quantity must be greater than zero.");
        }

        Store fromStore = storeRepository.findById(fromStoreId)
                .orElseThrow(() -> new IllegalArgumentException("Origin store not found."));
        Store toStore = storeRepository.findById(toStoreId)
                .orElseThrow(() -> new IllegalArgumentException("Destination store not found."));
        Item item = itemRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("Item not found in catalog."));

        Inventory originInventory = inventoryRepository.findByStoreAndItem(fromStore, item)
                .orElseThrow(() -> new IllegalArgumentException("Item not stocked at the origin store."));

        if (originInventory.getQuantity() < quantityToTransfer) {
            throw new IllegalArgumentException("Insufficient stock at origin store for this transfer.");
        }

        originInventory.setQuantity(originInventory.getQuantity() - quantityToTransfer);
        inventoryRepository.save(originInventory);

        Inventory destinationInventory = inventoryRepository.findByStoreAndItem(toStore, item)
                .orElse(new Inventory(toStore, item, 0));

        destinationInventory.setQuantity(destinationInventory.getQuantity() + quantityToTransfer);
        inventoryRepository.save(destinationInventory);

        StockTransfer transferLog = new StockTransfer(item, fromStore, toStore, quantityToTransfer);
        return stockTransferRepository.save(transferLog);
    }
}