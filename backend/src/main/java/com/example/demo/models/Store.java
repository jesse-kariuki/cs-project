package com.example.demo.models;

import jakarta.persistence.*;

@Entity
@Table(name = "store") // Standard lowercase
public class Store {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    // Removed the explicit name="Location", kept the constraints
    @Column(length = 20, unique = true, nullable = false)
    private String location;

    // Default Constructor
    public Store() {}

    // Getters and Setters
    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
}