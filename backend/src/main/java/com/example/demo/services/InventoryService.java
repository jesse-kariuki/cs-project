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

    // Add or update stock levels (Receiving stock from a supplier)
    public Inventory addStock(Integer storeId, Integer itemId, Integer quantityToAdd) {
        if (quantityToAdd <= 0) {
            throw new IllegalArgumentException("Quantity to add must be greater than zero.");
        }

        Store store = storeRepository.findById(storeId)
                .orElseThrow(() -> new IllegalArgumentException("Store not found."));
        Item item = itemRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("Item not found."));

        // Check if the item is already tracked at this store; if not, initialize at 0
        Inventory inventory = inventoryRepository.findByStoreAndItem(store, item)
                .orElse(new Inventory(store, item, 0));

        // Add the new stock to the existing count
        inventory.setQuantity(inventory.getQuantity() + quantityToAdd);

        return inventoryRepository.save(inventory);
    }

    // Move stock between branches safely
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

        // 1. Verify Origin Stock Exists
        Inventory originInventory = inventoryRepository.findByStoreAndItem(fromStore, item)
                .orElseThrow(() -> new IllegalArgumentException("Item not stocked at the origin store."));

        // 2. Verify Origin has Enough Stock
        if (originInventory.getQuantity() < quantityToTransfer) {
            throw new IllegalArgumentException("Insufficient stock at origin store for this transfer.");
        }

        // 3. Deduct from Origin
        originInventory.setQuantity(originInventory.getQuantity() - quantityToTransfer);
        inventoryRepository.save(originInventory);

        // 4. Add to Destination (Creates new record if it's the first time storing this item there)
        Inventory destinationInventory = inventoryRepository.findByStoreAndItem(toStore, item)
                .orElse(new Inventory(toStore, item, 0));

        destinationInventory.setQuantity(destinationInventory.getQuantity() + quantityToTransfer);
        inventoryRepository.save(destinationInventory);

        // 5. Create and save the permanent audit trail
        StockTransfer transferLog = new StockTransfer(item, fromStore, toStore, quantityToTransfer);
        return stockTransferRepository.save(transferLog);
    }
}