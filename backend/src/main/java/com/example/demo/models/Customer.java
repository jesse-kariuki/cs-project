package com.example.demo.models;

import jakarta.persistence.*;

@Entity
@Table(name = "customer") // Lowercase, standard SQL convention
public class Customer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    // Hibernate will automatically name this column 'name'
    @Column(unique = true, nullable = false, length = 50)
    private String name;

    // Hibernate will automatically name this column 'phone'
    @Column(unique = true, nullable = false, length = 15)
    private String phone;

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