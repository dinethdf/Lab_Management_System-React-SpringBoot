package com.hospital.lms.catalog.controllers;

import com.hospital.lms.catalog.dtos.CreateTestRequest;
import com.hospital.lms.catalog.dtos.TestDetailResponse;
import com.hospital.lms.catalog.dtos.TestResponse;
import com.hospital.lms.catalog.models.ContainerType;
import com.hospital.lms.catalog.services.CatalogService;
import com.hospital.lms.common.dtos.MessageResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Controller handling Test Catalog API endpoints.
 * Provides endpoints for tests catalog management and container lookup.
 */
@RestController
@RequestMapping("/api/catalog")
public class CatalogController {

    private final CatalogService catalogService;

    public CatalogController(CatalogService catalogService) {
        this.catalogService = catalogService;
    }

    /**
     * Lists all active tests for reception test ordering and catalog browsing.
     */
    @GetMapping("/tests")
    public ResponseEntity<List<TestResponse>> getAllTests() {
        return ResponseEntity.ok(catalogService.getAllTests());
    }

    /**
     * Retrieves full configuration details of a test by ID.
     */
    @GetMapping("/tests/{id}")
    public ResponseEntity<?> getTestById(@PathVariable Long id) {
        try {
            TestDetailResponse response = catalogService.getTestById(id);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(new MessageResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }

    /**
     * Creates a new lab test catalog entry with sample groups, parameters, options, and ranges.
     */
    @PostMapping("/tests")
    public ResponseEntity<?> createTest(@RequestBody CreateTestRequest request) {
        try {
            catalogService.createTest(request);
            return ResponseEntity.ok(new MessageResponse("Test catalog entry created successfully."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse("Failed to create test: " + e.getMessage()));
        }
    }

    /**
     * Updates an existing lab test catalog entry.
     */
    @PutMapping("/tests/{id}")
    public ResponseEntity<?> updateTest(@PathVariable Long id, @RequestBody CreateTestRequest request) {
        try {
            catalogService.updateTest(id, request);
            return ResponseEntity.ok(new MessageResponse("Test catalog entry updated successfully."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse("Failed to update test: " + e.getMessage()));
        }
    }

    /**
     * Activates or deactivates a test in the catalog.
     */
    @PatchMapping("/tests/{id}/active")
    public ResponseEntity<?> setActiveStatus(@PathVariable Long id, @RequestBody Map<String, Boolean> body) {
        try {
            boolean active = body != null && Boolean.TRUE.equals(body.get("active"));
            catalogService.setActiveStatus(id, active);
            String statusText = active ? "activated" : "deactivated";
            return ResponseEntity.ok(new MessageResponse("Test " + statusText + " successfully."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(new MessageResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }

    /**
     * Retrieves all available specimen container types.
     */
    @GetMapping("/containers")
    public ResponseEntity<List<ContainerType>> getAllContainers() {
        return ResponseEntity.ok(catalogService.getAllContainerTypes());
    }
}
