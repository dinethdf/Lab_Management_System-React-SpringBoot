package com.hospital.lms.dashboard.controllers;

import com.hospital.lms.dashboard.dtos.AdminDashboardStatsDTO;
import com.hospital.lms.dashboard.services.DashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST Controller exposing operational metrics for the Admin Dashboard.
 */
@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    /**
     * GET /api/dashboard/admin-stats
     * Returns live aggregated counts and the 5 most recent orders for the Admin Dashboard.
     * Restricted to authenticated users with the ADMIN role.
     */
    @GetMapping("/admin-stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AdminDashboardStatsDTO> getAdminDashboardStats() {
        AdminDashboardStatsDTO stats = dashboardService.getAdminDashboardStats();
        return ResponseEntity.ok(stats);
    }
}
