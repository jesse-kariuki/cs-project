package com.example.demo.repositories;

import com.example.demo.models.Item;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ItemRepository extends JpaRepository<Item, Integer> {
    Optional<Item> findByPartNumber(String partNumber);
    boolean existsByPartNumber(String partNumber);

    @Query(
            "SELECT i FROM Item i"+
                    " WHERE LOWER(i.brand) LIKE LOWER(CONCAT('%',:query,'%' ))"+
                    " OR LOWER(i.partName) LIKE LOWER(CONCAT('%', :query, '%'))"+   
                    " OR LOWER(i.partNumber) LIKE LOWER(CONCAT('%', :query, '%'))"+
                    " OR LOWER(i.type) LIKE LOWER(CONCAT('%', :query, '%'))"
    )
    List<Item> searchByKeyword(@Param("query") String keyword);

    Optional<Item> findByCode(String barcode);

    List<Item> findByTypeIgnoreCase(String type);

    List<Item> findByBrandIgnoreCase(String brand);
}

