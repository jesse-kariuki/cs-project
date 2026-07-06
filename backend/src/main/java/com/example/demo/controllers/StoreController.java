package com.example.demo.controllers;

import com.example.demo.models.Store;
import com.example.demo.services.StoreService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("stores")
public class StoreController {

    @Autowired
    private StoreService storeService;

    @GetMapping
    public ResponseEntity<List<Store>> getAllStores() {
        return ResponseEntity.ok(storeService.getAllStores());
    }

    @PostMapping
    public ResponseEntity<?> createStore(@RequestBody Store store) {
        try {
            Store savedStore = storeService.createStore(store);
            return ResponseEntity.ok(savedStore);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}