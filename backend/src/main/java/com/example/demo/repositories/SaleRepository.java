package com.example.demo.repositories;

import com.example.demo.enumeration.SaleStatus;
import com.example.demo.models.Customer;
import com.example.demo.models.Item;
import com.example.demo.models.Sale;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface SaleRepository extends JpaRepository<Sale, Integer> {

    Optional<Sale> findByMpesaCheckoutRequestId(String mpesaCheckoutRequestId);

    List<Sale> findBySaleDateBetween(LocalDateTime start, LocalDateTime end);

    // Find sales by date range and status
    List<Sale> findBySaleDateBetweenAndStatusIn(
            LocalDateTime start,
            LocalDateTime end,
            List<SaleStatus> statuses
    );

    List<Sale> findByStatus(SaleStatus status);

    // Sum total cost by product - FIXED: This should query purchases, not sales
//    @Query("SELECT COALESCE(SUM(si.unitPrice * si.quantity), 0) " +
//            "FROM Sale s " +
//            "JOIN s.saleItems si " +
//            "WHERE si.item = :product " +
//            "AND s.saleDate BETWEEN :start AND :end " +
//            "AND s.status IN ('CREDIT', 'PAID')")
//    double sumTotalCostByProductAndDateRange(
//            @Param("product") Item product,
//            @Param("start") LocalDateTime start,
//            @Param("end") LocalDateTime end
//    );
//
//    @Query("SELECT s FROM Sale s " +
//            "JOIN s.saleItems si " +
//            "WHERE si.item = :product " +
//            "AND s.saleDate BETWEEN :start AND :end")
//    List<Sale> findByItemAndSaleDateBetween(
//            @Param("product") Item product,
//            @Param("start") LocalDateTime start,
//            @Param("end") LocalDateTime end
//    );

    // Get total revenue by product for date range
    @Query("SELECT COALESCE(SUM(si.unitPrice * si.quantity), 0) " +
            "FROM Sale s " +
            "JOIN s.saleItems si " +
            "WHERE si.item = :product " +
            "AND s.saleDate BETWEEN :start AND :end " +
            "AND s.status IN ('CREDIT', 'PAID')")
    double sumRevenueByProductAndDateRange(
            @Param("product") Item product,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );

    // Get total quantity sold by product
    @Query("SELECT COALESCE(SUM(si.quantity), 0) " +
            "FROM Sale s " +
            "JOIN s.saleItems si " +
            "WHERE si.item = :product " +
            "AND s.saleDate BETWEEN :start AND :end " +
            "AND s.status IN ('CREDIT', 'PAID')")
    double sumQuantitySoldByProductAndDateRange(
            @Param("product") Item product,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );

    @Query("SELECT si.item, COALESCE(SUM(si.unitPrice * si.quantity), 0) as revenue " +
            "FROM Sale s " +
            "JOIN s.saleItems si " +
            "WHERE s.saleDate BETWEEN :start AND :end " +
            "AND s.status IN ('CREDIT', 'PAID') " +
            "GROUP BY si.item " +
            "ORDER BY revenue DESC")
    List<Object[]> findTopProductsByRevenue(
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );

    List<Sale> findByCustomerAndPaymentMethod_NameIgnoreCaseAndStatusOrderBySaleDateAsc(
            Customer customer, String paymentMethodName, SaleStatus status);

    List<Sale> findByPaymentMethod_NameIgnoreCaseAndStatus(String paymentMethodName, SaleStatus status);
}