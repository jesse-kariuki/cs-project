package com.example.demo.services;

import com.example.demo.models.Item;
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

    public Item createItem(Item item) {
        // Data sanitization: Standardize part numbers to uppercase for easy searching
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
}