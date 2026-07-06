package com.example.demo.repositories;

import com.example.demo.models.Company;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CompanyRepository extends JpaRepository<Company, Integer> {

    // Replaces getID(String name)
    Optional<Company> findByName(String name);

    // Useful for validation before saving
    boolean existsByName(String name);
    boolean existsByPhone(String phone);
}