package com.example.demo.services;

import com.example.demo.dto.TopProductDto;
import com.example.demo.dtos.CheckoutRequest;
import com.example.demo.dtos.CheckoutRequestWithPhone;
import com.example.demo.enumeration.SaleStatus;
import com.example.demo.models.*;
import com.example.demo.repositories.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

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

    /**
     * Original processCheckout method from your code.
     * Creates a sale with all items and calculates total.
     * Returns sale with status set based on paymentStatus parameter.
     */
    @Transactional
    public Sale processCheckout(CheckoutRequest request) {
        if (request.getCartItems() == null || request.getCartItems().isEmpty()) {
            throw new IllegalArgumentException("Cannot process an empty cart.");
        }

        Store store = storeRepository.findById(request.getStoreId())
                .orElseThrow(() -> new IllegalArgumentException("Store not found."));
        PaymentMethod paymentMethod = paymentMethodRepository.findById(request.getPaymentMethodId())
                .orElseThrow(() -> new IllegalArgumentException("Payment method not found."));

        Customer customer = null;
        if (request.getCustomerId() != null) {
            customer = customerRepository.findById(request.getCustomerId())
                    .orElseThrow(() -> new IllegalArgumentException("Customer not found."));
        }

        boolean isCreditSale = "credit".equalsIgnoreCase(paymentMethod.getName());
        boolean isCashSale = "cash".equalsIgnoreCase(paymentMethod.getName());

        double requestedTotal = request.getCartItems().stream()
                .mapToDouble(ci -> ci.getQuantity() * ci.getUnitPrice())
                .sum();

        if (isCreditSale) {
            if (customer == null) {
                throw new IllegalArgumentException("A customer is required for credit sales.");
            }
            double outstanding = getOutstandingBalance(customer);
            double limit = customer.getCreditLimit() == null ? 0.0 : customer.getCreditLimit();
            if (outstanding + requestedTotal > limit + 0.01) {
                throw new IllegalArgumentException(String.format(
                        "Credit limit exceeded for %s. Outstanding: %.2f, Limit: %.2f, Available: %.2f",
                        customer.getName(), outstanding, limit, Math.max(0, limit - outstanding)));
            }
        }

        List<SaleItem> saleItems = new ArrayList<>();

        Sale saleHeader = new Sale();
        saleHeader.setStore(store);
        saleHeader.setCustomer(customer);
        saleHeader.setPaymentMethod(paymentMethod);
        saleHeader.setSaleDate(LocalDateTime.now());
        saleHeader.setStatus(SaleStatus.CREDIT); // pending until confirmed/collected below
        saleHeader.setTotalAmount(0.0);
        saleHeader.setAmountPaid(0.0);

        Sale savedSale = saleRepository.save(saleHeader);

        double calculatedTotal = 0.0;

        for (CheckoutRequestWithPhone.CartItem cartItem : request.getCartItems()) {
            Item item = itemRepository.findById(cartItem.getItemId())
                    .orElseThrow(() -> new IllegalArgumentException("Item ID " + cartItem.getItemId() + " not found."));

            Inventory stock = inventoryRepository.findByStoreAndItem(store, item)
                    .orElseThrow(() -> new IllegalArgumentException("Item " + item.getPartNumber() + " is not stocked at this branch."));

            if (stock.getQuantity() < cartItem.getQuantity()) {
                throw new IllegalArgumentException("Insufficient stock for part: " + item.getPartNumber() + ". Only " + stock.getQuantity() + " left.");
            }

            stock.setQuantity(stock.getQuantity() - cartItem.getQuantity());
            inventoryRepository.save(stock);

            if (stock.getQuantity() <= LOW_STOCK_THRESHOLD) {
                System.out.println("🚨 LOW STOCK ALERT: " + item.getPartNumber() + " at " + store.getLocation() + " has dropped to " + stock.getQuantity() + "!");
            }

            SaleItem saleLineItem = new SaleItem();
            saleLineItem.setSale(savedSale);
            saleLineItem.setItem(item);
            saleLineItem.setQuantity(cartItem.getQuantity());
            saleLineItem.setUnitPrice(cartItem.getUnitPrice());
            saleItems.add(saleLineItem);
            saleItemRepository.save(saleLineItem);

            calculatedTotal += (cartItem.getQuantity() * cartItem.getUnitPrice());
        }

        savedSale.setTotalAmount(calculatedTotal);

        if (isCashSale) {
            savedSale.setStatus(SaleStatus.PAID);
            savedSale.setAmountPaid(calculatedTotal);
        }
        // credit sales and mpesa sales stay CREDIT until repaid / callback confirms

        return saleRepository.save(savedSale);
    }

    public List<Sale> getUnpaidCreditSales(Customer customer) {
        return saleRepository.findByCustomerAndPaymentMethod_NameIgnoreCaseAndStatusOrderBySaleDateAsc(
                customer, "credit", SaleStatus.CREDIT);
    }

    public double getOutstandingBalance(Customer customer) {
        return getUnpaidCreditSales(customer).stream()
                .mapToDouble(s -> s.getTotalAmount() - (s.getAmountPaid() == null ? 0.0 : s.getAmountPaid()))
                .sum();
    }

    public List<Sale> getAllOutstandingCreditSales() {
        return saleRepository.findByPaymentMethod_NameIgnoreCaseAndStatus("credit", SaleStatus.CREDIT);
    }

    /**
     * Overloaded processCheckout that handles CheckoutRequestWithPhone.
     * This is a wrapper around the original processCheckout.
     * The phone number is stored separately in the Sale entity during PaymentService.initiateMpesaPayment().
     *
     * Simply delegates to the original processCheckout with the base CheckoutRequest.
     */
    @Transactional
    public Sale processCheckout(CheckoutRequestWithPhone request) {
        // Convert CheckoutRequestWithPhone to CheckoutRequest
        CheckoutRequest baseRequest = CheckoutRequest.builder()
                .storeId(request.getStoreId())
                .customerId(request.getCustomerId())
                .paymentMethodId(request.getPaymentMethodId())
                .cartItems(request.getCartItems())
                .build();

        // Call the original processCheckout
        return processCheckout(baseRequest);
    }

    /**
     * Fetch a sale by ID.
     * Used by the controller to retrieve sale details.
     *
     * @param saleId The sale ID
     * @return The sale with all relationships loaded
     * @throws IllegalArgumentException if sale not found
     */
    public Sale getSaleById(Integer saleId) {
        return saleRepository.findById(saleId)
                .orElseThrow(() -> new IllegalArgumentException("Sale ID " + saleId + " not found."));
    }

    public List<Sale> getAllSales() {
        return saleRepository.findAll();
    }

    public List<Sale> getSalesByDate(LocalDate start, LocalDate end){

        return saleRepository.findBySaleDateBetween(
                start.atStartOfDay(),
                end.atTime(23,59,59)
        );
    }

    public Double getTodaySalesTotal(){

        LocalDate today = LocalDate.now();
        return saleRepository.findBySaleDateBetween(
                today.atStartOfDay(),
                today.atTime(23, 59, 59)
        )
                .stream().mapToDouble(Sale::getTotalAmount).sum();


    }

    public Double getMonthlySalesTotal(){
        LocalDate startOfMonth = LocalDate.now().withDayOfMonth(1);

        return saleRepository.findAll().stream()
                .filter(sale -> !sale.getSaleDate().isBefore(startOfMonth.atStartOfDay()))
                .filter(sale -> sale.getStatus() == SaleStatus.PAID || sale.getStatus()==SaleStatus.CREDIT)
                .mapToDouble(Sale::getTotalAmount)
                .sum();
    }


    public List<TopProductDto> getTopSellingProducts() {
        return saleRepository.findAll().stream()
                .filter(order -> order.getStatus() == SaleStatus.PAID || order.getStatus()==SaleStatus.CREDIT)
                .flatMap(order -> order.getSaleItems().stream())
                .collect(Collectors.groupingBy(
                        item -> item.getItem().getPartName(),
                        Collectors.collectingAndThen(
                                Collectors.toList(),
                                list -> {
                                    double totalQty = list.stream().mapToDouble(SaleItem::getQuantity).sum();
                                    double totalRev = list.stream().mapToDouble(item -> item.getUnitPrice() * item.getQuantity()).sum();
                                    return new TopProductDto("", totalQty, totalRev);
                                }
                        )
                ))
                .entrySet().stream()
                .map(entry -> {
                    TopProductDto dto = entry.getValue();
                    dto.setName(entry.getKey());
                    return dto;
                })
                .sorted((a, b) -> b.getQuantitySold().compareTo(a.getQuantitySold()))
                .limit(5)
                .collect(Collectors.toList());
    }

    public List<Sale> getSalesByStatus(SaleStatus status) {

        return saleRepository.findByStatus(status)
                .stream()
                .toList();
    }

}