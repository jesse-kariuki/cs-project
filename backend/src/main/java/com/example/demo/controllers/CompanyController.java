package com.example.demo.controllers;

import com.example.demo.models.Company;
import com.example.demo.services.CompanyService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/companies")
public class CompanyController {

    @Autowired
    private CompanyService companyService;

    // GET: http://localhost:8080/api/companies
    @GetMapping
    public ResponseEntity<List<Company>> getAllCompanies() {
        return ResponseEntity.ok(companyService.getAllCompanies());
    }
    // GET: http://localhost:8080/api/companies/1
    @GetMapping("/{id}")
    public ResponseEntity<Company> getCompanyById(@PathVariable Integer id) {
        try {
            return ResponseEntity.ok(companyService.getCompanyById(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // POST: http://localhost:8080/api/companies
    // React sends JSON: { "name": "Tech Supplies Inc", "phone": "0712345678" }
    @PostMapping
    public ResponseEntity<?> createCompany(@RequestBody Company company) {
        try {
            Company savedCompany = companyService.createCompany(company);
            return ResponseEntity.ok(savedCompany);
        } catch (IllegalArgumentException e) {
            // Sends a 400 Bad Request if the name/phone already exists
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}