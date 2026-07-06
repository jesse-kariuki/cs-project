package com.example.demo.models;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "credit_allocation")
public class CreditAllocation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "payment_id", nullable = false)
    private CustomerPayment payment;

    @ManyToOne
    @JoinColumn(name = "sale_id", nullable = false)
    private Sale sale;

    @Column(nullable = false)
    private Double amountApplied;

    private LocalDateTime allocatedAt;

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public CustomerPayment getPayment() { return payment; }
    public void setPayment(CustomerPayment payment) { this.payment = payment; }
    public Sale getSale() { return sale; }
    public void setSale(Sale sale) { this.sale = sale; }
    public Double getAmountApplied() { return amountApplied; }
    public void setAmountApplied(Double amountApplied) { this.amountApplied = amountApplied; }
    public LocalDateTime getAllocatedAt() { return allocatedAt; }
    public void setAllocatedAt(LocalDateTime allocatedAt) { this.allocatedAt = allocatedAt; }
}