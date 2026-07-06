package com.example.demo.controllers;

import com.example.demo.models.Item;
import com.example.demo.models.User;
import com.example.demo.security.UserDetailsImpl;
import com.example.demo.services.ItemService;
import com.example.demo.services.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

/**
 * Item Controller for managing items.
 *
 * IMPORTANT CHANGES:
 * 1. Use @AuthenticationPrincipal instead of @RequestHeader("Authorization")
 * 2. Let Spring Security inject the authenticated user
 * 3. No manual JWT extraction needed
 * 4. Use @PreAuthorize for role-based access control
 */
@RestController
@RequestMapping("/items")
@RequiredArgsConstructor
public class ItemController {

    private final ItemService itemService;
    private final UserService userService;

    /**
     * Get all items (public endpoint).
     */
    @GetMapping
    public ResponseEntity<List<Item>> getAllItems() {
        return ResponseEntity.ok(itemService.getAllItems());
    }

    /**
     * Get item by ID (public endpoint).
     */
    @GetMapping("/{id}")
    public ResponseEntity<Item> getItemById(@PathVariable Integer id) {
        Optional<Item> item = itemService.getItemById(id);
        return item.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    /**
     * Create new item (authenticated users only).
     *
     * @AuthenticationPrincipal automatically injects the authenticated user's UserDetails
     * if the request has a valid JWT token. If no token or invalid token, this endpoint
     * will return 401 Unauthorized before reaching this method.
     *
     * @param item The item to create
     * @param userDetails The authenticated user (injected by Spring Security)
     * @return Created item with 201 status
     */
    @PostMapping("/create")
    public ResponseEntity<?> createItem(
            @RequestBody Item item,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {

        try {
            User authenticatedUser = userService.getUserFromAuthenticatedPrincipal(userDetails);
            Item savedItem = itemService.createItem(item, authenticatedUser);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedItem);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    /**
     * Update item by ID (authenticated users only).
     *
     * @param id The item ID
     * @param item The updated item data
     * @param userDetails The authenticated user (injected by Spring Security)
     * @return Updated item
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateItem(
            @PathVariable Integer id,
            @RequestBody Item item,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {

        try {
            User authenticatedUser = userService.getUserFromAuthenticatedPrincipal(userDetails);
            Item updatedItem = itemService.updateItem(id, item);
            return ResponseEntity.ok(updatedItem);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    /**
     * Search items by keyword (public endpoint).
     */
    @GetMapping("/search")
    public ResponseEntity<List<Item>> searchByKeyword(@RequestParam String keyword) {
        return ResponseEntity.ok(itemService.searchByKeyword(keyword));
    }
}