    package com.example.demo.dtos;
    
    import lombok.AllArgsConstructor;
    import lombok.Builder;
    import lombok.NoArgsConstructor;

    import java.util.List;

    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public class CheckoutRequest {
        private Integer storeId;
        private Integer customerId; // Nullable for walk-in customers
        private Integer paymentMethodId;
        private List<CheckoutRequestWithPhone.CartItem> cartItems;
    

    
        // CheckoutRequest Getters & Setters
        public Integer getStoreId() { return storeId; }
        public void setStoreId(Integer storeId) { this.storeId = storeId; }
        public Integer getCustomerId() { return customerId; }
        public void setCustomerId(Integer customerId) { this.customerId = customerId; }
        public Integer getPaymentMethodId() { return paymentMethodId; }
        public void setPaymentMethodId(Integer paymentMethodId) { this.paymentMethodId = paymentMethodId; }
        public List<CheckoutRequestWithPhone.CartItem> getCartItems() { return cartItems; }
        public void setCartItems(List<CheckoutRequestWithPhone.CartItem> cartItems) { this.cartItems = cartItems; }
    }