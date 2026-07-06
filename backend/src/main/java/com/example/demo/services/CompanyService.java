package com.example.demo.services;

import com.example.demo.models.Company;
import com.example.demo.repositories.CompanyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CompanyService {

    @Autowired
    private CompanyRepository companyRepository;

    // Replaces addToTable() and getCompany()
    public List<Company> getAllCompanies() {
        return companyRepository.findAll();
    }

    // Replaces addCompany()
    public Company createCompany(Company company) {
        if (companyRepository.existsByName(company.getName())) {
            throw new IllegalArgumentException("A company with this name already exists.");
        }
        if (companyRepository.existsByPhone(company.getPhone())) {
            throw new IllegalArgumentException("A company with this phone number already exists.");
        }
        return companyRepository.save(company);
    }

    public Company getCompanyById(Integer id) {
        return companyRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Company not found"));
    }
}