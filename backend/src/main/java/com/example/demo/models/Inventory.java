package com.example.demo.models;

import jakarta.persistence.*;

@Entity
@Table(name = "inventory")
public class Inventory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    // Links this inventory record to a specific Store
    @ManyToOne
    @JoinColumn(name = "store_id", nullable = false)
    private Store store;

    // Links this inventory record to a specific Item
    @ManyToOne
    @JoinColumn(name = "item_id", nullable = false)
    private Item item;

    @Column(nullable = false)
    private Integer quantity = 0;

    public Inventory() {}

    public Inventory(Store store, Item item, Integer quantity) {
        this.store = store;
        this.item = item;
        this.quantity = quantity;
    }

    // Getters and Setters
    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public Store getStore() { return store; }
    public void setStore(Store store) { this.store = store; }

    public Item getItem() { return item; }
    public void setItem(Item item) { this.item = item; }

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
}