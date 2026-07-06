package com.example.demo.models;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "stock_transfer")
public class StockTransfer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "item_id", nullable = false)
    private Item item;

    @ManyToOne
    @JoinColumn(name = "from_store_id", nullable = false)
    private Store fromStore;

    @ManyToOne
    @JoinColumn(name = "to_store_id", nullable = false)
    private Store toStore;

    @Column(nullable = false)
    private Integer quantity;

    @Column(nullable = false)
    private LocalDateTime transferDate = LocalDateTime.now();

    public StockTransfer() {}

    public StockTransfer(Item item, Store fromStore, Store toStore, Integer quantity) {
        this.item = item;
        this.fromStore = fromStore;
        this.toStore = toStore;
        this.quantity = quantity;
    }

    // Standard Getters and Setters here...
}