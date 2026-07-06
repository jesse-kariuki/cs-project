package com.example.demo.models;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@Entity
@Data
@Table(name = "item") // Standard lowercase table name
public class Item {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column
    private String partName;

    @Column(nullable = false, unique = true)
    private String code;

    @Column(unique = true, nullable = false, length = 30)
    private String partNumber;

    @Column(length = 20)
    private String brand;

    @Column(length = 20)
    private String type;

    @Column
    private Double buyingPrice;

    @Column
    private Double sellingPrice;

    // Default Constructor

}