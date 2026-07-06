package com.example.demo.services;

import com.example.demo.dtos.CartItemDto;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.models.Item;
import com.example.demo.repositories.ItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Scan Service for barcode scanning.
 * Handles both FIXED price items and WEIGHED items.
 *
 * Barcode Types:
 * 1. FIXED items: Standard barcode (code stored in database)
 *    Example: "4005500033237" → quantity = 1
 *
 * 2. WEIGHED items: 13-digit barcode format
 *    Format: 20 + PLU(5) + Weight*100(5) + Check digit(1)
 *    Example: "2012345000555"
 *             20 = weighed indicator
 *             12345 = PLU (product code)
 *             00555 = weight in hectograms (5.55 kg)
 *
 * Usage:
 * - Scan a FIXED barcode → returns item with quantity 1
 * - Scan a weighed barcode → returns item with calculated weight
 */
@Service
@RequiredArgsConstructor
public class ScanService {

    private final ItemRepository itemRepository;

    /**
     * Handle barcode scan.
     * Automatically detects item type and returns cart item.
     *
     * @param barcode The scanned barcode
     * @return CartItemDto with product details
     * @throws ResourceNotFoundException if product not found
     * @throws IllegalArgumentException if barcode format invalid
     */
    public CartItemDto handleScan(String barcode) {
        if (barcode == null || barcode.trim().isEmpty()) {
            throw new IllegalArgumentException("Barcode cannot be empty");
        }

        // Check if weighed barcode: 13 digits starting with "20"
        if (barcode.length() == 13 && barcode.startsWith("20")) {
            return handleWeighedBarcode(barcode);
        }

        // Otherwise, treat as fixed barcode
        return handleFixedBarcode(barcode);
    }

    /**
     * Handle weighed item barcode.
     *
     * Barcode format: 20 + PLU(5) + TotalPrice*100(5)
     *
     * Example: "2012345000550"
     * - 20 = weighed item indicator
     * - 12345 = PLU (product code)
     * - 00550 = total price in cents (5.50)
     *
     * Calculation:
     * - Get product by PLU
     * - Verify it's a WEIGHED type
     * - Extract total price from barcode
     * - Calculate weight = totalPrice / unitPrice
     * - Round to 3 decimal places
     *
     * @param barcode 13-digit weighed barcode
     * @return CartItemDto with calculated weight
     */
    private CartItemDto handleWeighedBarcode(String barcode) {
        try {
            // Extract PLU: positions 2-7 (5 digits)
            String plu = barcode.substring(2, 7);

            // Extract total price: positions 7-12 (5 digits)
            // These are in cents, so divide by 100
            double totalFromBarcode = Integer.parseInt(barcode.substring(7, 12)) / 100.0;

            // Find product by PLU code
            Item product = itemRepository.findByCode(plu)
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Product with PLU '" + plu + "' not found in system"
                    ));

            // Verify it's a WEIGHED item
            if (product.getType() == null || !product.getType().equalsIgnoreCase("WEIGHED")) {
                throw new IllegalArgumentException(
                        "Product '" + product.getPartName() + "' is not configured as a WEIGHED item. " +
                                "Update product type to WEIGHED or use fixed barcode."
                );
            }

            // Verify selling price is set
            if (product.getSellingPrice() == null || product.getSellingPrice() <= 0) {
                throw new IllegalArgumentException(
                        "Product '" + product.getPartName() + "' has invalid price per kg"
                );
            }

            // Calculate weight: weight = total price / price per kg
            double rawWeight = totalFromBarcode / product.getSellingPrice();

            // Round weight to 3 decimal places (e.g., 2.550 kg)
            double weight = BigDecimal.valueOf(rawWeight)
                    .setScale(3, RoundingMode.HALF_UP)
                    .doubleValue();

            // Build and return cart item
            return CartItemDto.builder()
                    .productId(product.getId().longValue())
                    .productName(product.getPartName())
                    .productSku(product.getCode())
                    .unitPrice(product.getSellingPrice())
                    .quantity(weight)  // Weight in kg
                    .total(BigDecimal.valueOf(totalFromBarcode)
                            .setScale(2, RoundingMode.HALF_UP)
                            .doubleValue())
                    .build();

        } catch (NumberFormatException e) {
            throw new IllegalArgumentException(
                    "Invalid weighed barcode format. Expected: 20PPPPPWWWWW (13 digits)"
            );
        } catch (StringIndexOutOfBoundsException e) {
            throw new IllegalArgumentException(
                    "Barcode too short. Weighed barcodes must be 13 digits"
            );
        }
    }

    /**
     * Handle fixed (standard) barcode.
     *
     * For items with fixed prices (not weighed).
     * Barcode should match the product code in database.
     * Returns quantity of 1 per scan.
     *
     * @param barcode Standard barcode (EAN-13, UPC, or custom)
     * @return CartItemDto with quantity 1
     */
    private CartItemDto handleFixedBarcode(String barcode) {
        Item product = itemRepository.findByCode(barcode)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Product with barcode '" + barcode + "' not found. " +
                                "Please register this product in the system first."
                ));

        // For fixed items, quantity is always 1 per scan
        Double unitPrice = product.getSellingPrice();
        if (unitPrice == null || unitPrice <= 0) {
            throw new IllegalArgumentException(
                    "Product '" + product.getPartName() + "' has invalid selling price"
            );
        }

        return CartItemDto.builder()
                .productId(product.getId().longValue())
                .productName(product.getPartName())
                .productSku(product.getCode())
                .unitPrice(unitPrice)
                .quantity(1.0)  // One item per scan
                .total(unitPrice)
                .build();
    }

    /**
     * Generate a weighed barcode for testing or printing.
     *
     * Useful for generating barcodes to print on scale labels.
     * Format: 20 + PLU(5) + TotalPrice*100(5) + checksum(1)
     *
     * @param plu The 5-digit PLU code
     * @param weight Weight in kg
     * @param pricePerKg Price per kilogram
     * @return 13-digit barcode string
     */
    public String generateWeighedBarcode(String plu, Double weight, Double pricePerKg) {
        if (plu == null || plu.length() != 5) {
            throw new IllegalArgumentException("PLU must be exactly 5 digits");
        }

        if (weight == null || weight <= 0) {
            throw new IllegalArgumentException("Weight must be greater than 0");
        }

        if (pricePerKg == null || pricePerKg <= 0) {
            throw new IllegalArgumentException("Price per kg must be greater than 0");
        }

        // Calculate total price
        double totalPrice = weight * pricePerKg;
        int priceInCents = (int) Math.round(totalPrice * 100);

        // Format: 20 + PLU + Price (5 digits padded with zeros) + checksum
        String barcode = String.format("20%s%05d0", plu, priceInCents);

        return barcode;
    }

    /**
     * Validate barcode format.
     *
     * @param barcode Barcode to validate
     * @return true if valid format, false otherwise
     */
    public boolean isValidBarcodeFormat(String barcode) {
        if (barcode == null || barcode.isEmpty()) {
            return false;
        }

        // Weighed: 13 digits starting with 20
        if (barcode.length() == 13 && barcode.startsWith("20")) {
            return barcode.matches("20\\d{11}");
        }

        // Fixed: typically 12-13 digits (EAN-13, UPC-A)
        // Can also be alphanumeric custom codes
        return barcode.length() >= 6 && barcode.length() <= 20;
    }
}
