package com.example.demo.services;

import com.example.demo.models.Store;
import com.example.demo.repositories.StoreRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class StoreService {

    @Autowired
    private StoreRepository storeRepository;

    public List<Store> getAllStores() {
        return storeRepository.findAll();
    }

    public Store createStore(Store store) {
        if (store.getLocation() == null || store.getLocation().trim().isEmpty()) {
            throw new IllegalArgumentException("Store location cannot be empty.");
        }

        // Capitalize the first letter for clean data (e.g., "lebu" -> "Lebu")
        String formattedLocation = store.getLocation().substring(0, 1).toUpperCase() +
                store.getLocation().substring(1).toLowerCase();
        store.setLocation(formattedLocation);

        if (storeRepository.existsByLocation(store.getLocation())) {
            throw new IllegalArgumentException("A store at this location already exists.");
        }

        return storeRepository.save(store);
    }
}