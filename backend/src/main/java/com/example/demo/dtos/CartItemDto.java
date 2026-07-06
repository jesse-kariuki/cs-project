package com.example.demo.dtos;


import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CartItemDto {
    private String productSku;
    private Long productId;
    private String productName;
    private Double unitPrice;
    private Double quantity;
    private Double total;
}
