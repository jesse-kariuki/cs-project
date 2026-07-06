package com.example.demo.services;

import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.models.Item;
import com.example.demo.models.User;
import com.example.demo.repositories.ItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ItemService {

    @Autowired
    private ItemRepository itemRepository;

    public List<Item> getAllItems() {
        return itemRepository.findAll();
    }

    public Optional<Item> getItemById(Integer id) {
        return itemRepository.findById(id);
    }

    public Item createItem(Item item, User user) {
        if (item.getPartNumber() != null) {
            item.setPartNumber(item.getPartNumber().toUpperCase().trim());
        } else {
            throw new IllegalArgumentException("Part number cannot be empty.");
        }

        if (itemRepository.existsByPartNumber(item.getPartNumber())) {
            throw new IllegalArgumentException("An item with Part Number '" + item.getPartNumber() + "' already exists in the catalog.");
        }

        return itemRepository.save(item);
    }

    public Item updateItem(Integer id, Item itemDetails) {
        Item item = itemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Item not found with id: " + id
                ));

        // Update fields
        if (itemDetails.getPartName() != null && !itemDetails.getPartName().isEmpty()) {
            item.setPartName(itemDetails.getPartName());
        }

        if (itemDetails.getBrand() != null && !itemDetails.getBrand().isEmpty()) {
            item.setBrand(itemDetails.getBrand());
        }

        if (itemDetails.getType() != null && !itemDetails.getType().isEmpty()) {
            item.setType(itemDetails.getType());
        }

        return itemRepository.save(item);
    }
    public void deleteItem(Integer id) {
        Item item = itemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Item not found with id: " + id
                ));

        // Optional: Check if item is in use
        // if (inventoryRepository.existsByItem(item)) {
        //     throw new IllegalArgumentException(
        //         "Cannot delete item in use. Remove from inventory first."
        //     );
        // }

        itemRepository.delete(item);
    }

    public List<Item> getItemsByType(String type) {
        return itemRepository.findByTypeIgnoreCase(type);
    }

    /**
     * Get items by brand.
     */
    public List<Item> getItemsByBrand(String brand) {
        return itemRepository.findByBrandIgnoreCase(brand);
    }


    public List<Item> searchByKeyword(String keyword){

        return itemRepository.searchByKeyword(keyword);
    }

    public long getItemCount() {
        return itemRepository.count();
    }
}