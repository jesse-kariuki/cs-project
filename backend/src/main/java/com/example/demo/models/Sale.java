package com.example.demo.models;

import com.example.demo.enumeration.SaleStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "sale")
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class Sale {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "store_id", nullable = false)
    private Store store;

    @ManyToOne
    @JoinColumn(name = "customer_id")
    private Customer customer;

    @ManyToOne
    @JoinColumn(name = "payment_method_id", nullable = false)
    private PaymentMethod paymentMethod;

    @Column(name = "amount_paid")
    private Double amountPaid = 0.0;

    private Double totalAmount;

    private LocalDateTime saleDate;

    @Column
    @Enumerated(EnumType.STRING)
    private SaleStatus status;

    @OneToMany(mappedBy = "sale", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SaleItem> saleItems;

    // ============ M-PESA TRACKING FIELDS ============
    // These fields track the payment flow when M-Pesa is the payment method

    /**
     * Safaricom's unique identifier for this STK push request.
     * Used to match the callback response to this sale.
     * Populated when initiateSTKPush is called.
     */
    @Column(name = "mpesa_checkout_request_id", length = 100)
    private String mpesaCheckoutRequestId;

    /**
     * Safaricom's receipt number when payment succeeds.
     * Proof of transaction on M-Pesa side.
     * Populated by the callback after successful payment.
     */
    @Column(name = "mpesa_receipt_number", length = 100)
    private String mpesaReceiptNumber;

    /**
     * Timestamp when the M-Pesa payment was initiated.
     * Useful for tracking payment lifecycle.
     */
    @Column(name = "mpesa_initiated_at")
    private LocalDateTime mpesaInitiatedAt;

    /**
     * Timestamp when the M-Pesa callback was received and payment confirmed.
     * Null until callback is processed.
     */
    @Column(name = "mpesa_completed_at")
    private LocalDateTime mpesaCompletedAt;

    /**
     * Customer's phone number used for M-Pesa payment.
     * Stored for reference and potential retries.
     */
    @Column(name = "mpesa_phone", length = 20)
    private String mpesaPhone;
}