package com.example.demo.repositories;

import com.example.demo.models.Store;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface StoreRepository extends JpaRepository<Store, Integer> {
    // To prevent adding two stores with the exact same location name
    boolean existsByLocation(String location);
}