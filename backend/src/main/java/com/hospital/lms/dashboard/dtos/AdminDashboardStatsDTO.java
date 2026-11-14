package com.hospital.lms.dashboard.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Aggregated statistics DTO for the Administrator Dashboard.
 * Calculated dynamically from real database records (no mock values).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminDashboardStatsDTO {

    // Core Metrics
    private long totalPatients;
    private long todayPatients;
    private long totalStaff;
    private long totalTestsInCatalog;
    private long totalOrders;
    private long todayOrders;

    // Review & Pipeline Metrics
    private long pendingReviewCount;      // Results waiting for supervisor sign-off (SUBMITTED)
    private long pendingOrdersCount;      // Orders pending sample collection
    private long inProgressOrdersCount;   // Orders in sample analysis
    private long completedOrdersCount;    // Orders completed/reported

    // Real Activity Feed
    private List<RecentOrderSummaryDTO> recentOrders;
}
