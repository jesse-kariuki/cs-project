package com.example.demo.dtos;

import java.util.List;

public class CheckoutRequest {
    private Integer storeId;
    private Integer customerId; // Nullable for walk-in customers
    private Integer paymentMethodId;
    private List<CartItem> cartItems;

    public static class CartItem {
        private Integer itemId;
        private Integer quantity;
        private Double unitPrice;
        private Double baseCost; // Optional: If you want to track wholesale cost right now

        // CartItem Getters & Setters
        public Integer getItemId() { return itemId; }
        public void setItemId(Integer itemId) { this.itemId = itemId; }
        public Integer getQuantity() { return quantity; }
        public void setQuantity(Integer quantity) { this.quantity = quantity; }
        public Double getUnitPrice() { return unitPrice; }
        public void setUnitPrice(Double unitPrice) { this.unitPrice = unitPrice; }
        public Double getBaseCost() { return baseCost != null ? baseCost : 0.0; }
        public void setBaseCost(Double baseCost) { this.baseCost = baseCost; }
    }

    // CheckoutRequest Getters & Setters
    public Integer getStoreId() { return storeId; }
    public void setStoreId(Integer storeId) { this.storeId = storeId; }
    public Integer getCustomerId() { return customerId; }
    public void setCustomerId(Integer customerId) { this.customerId = customerId; }
    public Integer getPaymentMethodId() { return paymentMethodId; }
    public void setPaymentMethodId(Integer paymentMethodId) { this.paymentMethodId = paymentMethodId; }
    public List<CartItem> getCartItems() { return cartItems; }
    public void setCartItems(List<CartItem> cartItems) { this.cartItems = cartItems; }
}