package com.example.demo.models;

import jakarta.persistence.*;

@Entity
@Table(name = "customer") // Lowercase, standard SQL convention
public class Customer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(unique = true, nullable = false, length = 50)
    private String name;

    @Column(unique = true, nullable = false, length = 15)
    private String phone;

    @Column(name = "credit_limit")
    private Double creditLimit = 0.0;

    public Double getCreditLimit() { return creditLimit; }
    public void setCreditLimit(Double creditLimit) { this.creditLimit = creditLimit; }

    // Default Constructor required by JPA
    public Customer() {}

    public Customer(String name, String phone) {
        this.name = name;
        this.phone = phone;
    }

    // Getters and Setters
    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
}