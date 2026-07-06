package com.example.demo.models;

import jakarta.persistence.*;

@Entity
@Table(name = "item") // Standard lowercase table name
public class Item {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    // Hibernate converts camelCase to snake_case automatically (part_number)
    @Column(unique = true, nullable = false, length = 30)
    private String partNumber;

    @Column(length = 20)
    private String brand;

    @Column(length = 20)
    private String type;

    // Default Constructor
    public Item() {}

    public Item(String partNumber, String brand, String type) {
        this.partNumber = partNumber;
        this.brand = brand;
        this.type = type;
    }

    // Getters and Setters
    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public String getPartNumber() { return partNumber; }
    public void setPartNumber(String partNumber) { this.partNumber = partNumber; }

    public String getBrand() { return brand; }
    public void setBrand(String brand) { this.brand = brand; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
}