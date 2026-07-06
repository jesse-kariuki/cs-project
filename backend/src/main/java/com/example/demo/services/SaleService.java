package com.example.demo.services;

import com.example.demo.dtos.CheckoutRequest;
import com.example.demo.models.*;
import com.example.demo.repositories.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class SaleService {

    @Autowired private SaleRepository saleRepository;
    @Autowired private SaleItemRepository saleItemRepository;
    @Autowired private InventoryRepository inventoryRepository;
    @Autowired private StoreRepository storeRepository;
    @Autowired private CustomerRepository customerRepository;
    @Autowired private PaymentMethodRepository paymentMethodRepository;
    @Autowired private ItemRepository itemRepository;

    private static final int LOW_STOCK_THRESHOLD = 5;

    @Transactional // Critical: If any part of this fails, the whole transaction rolls back
    public Sale processCheckout(CheckoutRequest request) {
        if (request.getCartItems() == null || request.getCartItems().isEmpty()) {
            throw new IllegalArgumentException("Cannot process an empty cart.");
        }

        // 1. Fetch the relationships
        Store store = storeRepository.findById(request.getStoreId())
                .orElseThrow(() -> new IllegalArgumentException("Store not found."));
        PaymentMethod paymentMethod = paymentMethodRepository.findById(request.getPaymentMethodId())
                .orElseThrow(() -> new IllegalArgumentException("Payment method not found."));

        Customer customer = null;
        if (request.getCustomerId() != null) {
            customer = customerRepository.findById(request.getCustomerId())
                    .orElseThrow(() -> new IllegalArgumentException("Customer not found."));
        }

        // 2. Initialize the main Receipt (Sale Header)
        Sale saleHeader = new Sale();
        saleHeader.setStore(store);
        saleHeader.setCustomer(customer);
        saleHeader.setPaymentMethod(paymentMethod);
        saleHeader.setSaleDate(LocalDateTime.now());
        saleHeader.setStatus("PAID");
        saleHeader.setTotalAmount(0.0); // We will calculate this below

        // Save header first to generate the ID
        Sale savedSale = saleRepository.save(saleHeader);

        double calculatedTotal = 0.0;

        // 3. Process each item in the cart
        for (CheckoutRequest.CartItem cartItem : request.getCartItems()) {
            Item item = itemRepository.findById(cartItem.getItemId())
                    .orElseThrow(() -> new IllegalArgumentException("Item ID " + cartItem.getItemId() + " not found."));

            // Check physical inventory at this specific store
            Inventory stock = inventoryRepository.findByStoreAndItem(store, item)
                    .orElseThrow(() -> new IllegalArgumentException("Item " + item.getPartNumber() + " is not stocked at this branch."));

            if (stock.getQuantity() < cartItem.getQuantity()) {
                throw new IllegalArgumentException("Insufficient stock for part: " + item.getPartNumber() + ". Only " + stock.getQuantity() + " left.");
            }

            // Deduct from shelf
            stock.setQuantity(stock.getQuantity() - cartItem.getQuantity());
            inventoryRepository.save(stock);

            // AUTOMATED LOW STOCK ALERT
            if (stock.getQuantity() <= LOW_STOCK_THRESHOLD) {
                System.out.println("🚨 LOW STOCK ALERT: " + item.getPartNumber() + " at " + store.getLocation() + " has dropped to " + stock.getQuantity() + "!");
            }

            // Create line item record
            SaleItem saleLineItem = new SaleItem();
            saleLineItem.setSale(savedSale);
            saleLineItem.setItem(item);
            saleLineItem.setQuantity(cartItem.getQuantity());
            saleLineItem.setUnitPrice(cartItem.getUnitPrice());
            // saleLineItem.setBaseCost(cartItem.getBaseCost()); // Enable if tracking wholesale profit immediately

            saleItemRepository.save(saleLineItem);

            // Update running total
            calculatedTotal += (cartItem.getQuantity() * cartItem.getUnitPrice());
        }

        // 4. Update and finalize the receipt total
        savedSale.setTotalAmount(calculatedTotal);
        return saleRepository.save(savedSale);
    }
}