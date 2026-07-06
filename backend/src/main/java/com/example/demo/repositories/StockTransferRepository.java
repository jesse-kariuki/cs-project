package com.example.demo.repositories;

import com.example.demo.models.StockTransfer;
import com.example.demo.models.Store;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StockTransferRepository extends JpaRepository<StockTransfer, Integer> {

    // Find all parts transferred OUT of a specific branch
    List<StockTransfer> findByFromStore(Store fromStore);

    // Find all parts transferred INTO a specific branch
    List<StockTransfer> findByToStore(Store toStore);
}