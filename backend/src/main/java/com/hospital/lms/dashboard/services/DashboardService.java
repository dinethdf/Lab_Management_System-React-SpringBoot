package com.hospital.lms.dashboard.services;

import com.hospital.lms.auth.repositories.UserRepository;
import com.hospital.lms.catalog.repositories.LabTestRepository;
import com.hospital.lms.dashboard.dtos.AdminDashboardStatsDTO;
import com.hospital.lms.dashboard.dtos.RecentOrderSummaryDTO;
import com.hospital.lms.order.models.OrderTest;
import com.hospital.lms.order.models.TestOrder;
import com.hospital.lms.order.repositories.TestOrderRepository;
import com.hospital.lms.patient.repositories.PatientRepository;
import com.hospital.lms.result.models.TestResult;
import com.hospital.lms.result.repositories.TestResultRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

/**
 * DashboardService — Gathers and computes real-time operational metrics for laboratory administrators.
 *
 * All values are queried directly from the MySQL database:
 * - Patient counts (Total & Registered Today)
 * - Active Staff user count
 * - Active Test Catalog count
 * - Orders summary (Total, Today's Orders, Pending, In Progress, Completed)
 * - Review queue backlog (Submitted results awaiting supervisor sign-off)
 * - Real activity stream of the 5 most recent diagnostic orders
 */
@Service
public class DashboardService {

    private final PatientRepository patientRepository;
    private final UserRepository userRepository;
    private final LabTestRepository labTestRepository;
    private final TestOrderRepository testOrderRepository;
    private final TestResultRepository testResultRepository;

    public DashboardService(PatientRepository patientRepository,
                            UserRepository userRepository,
                            LabTestRepository labTestRepository,
                            TestOrderRepository testOrderRepository,
                            TestResultRepository testResultRepository) {
        this.patientRepository = patientRepository;
        this.userRepository = userRepository;
        this.labTestRepository = labTestRepository;
        this.testOrderRepository = testOrderRepository;
        this.testResultRepository = testResultRepository;
    }

    /**
     * Aggregates live system statistics for the Admin Dashboard.
     */
    @Transactional(readOnly = true)
    public AdminDashboardStatsDTO getAdminDashboardStats() {
        // Midnight of today for calculating today's new registrations and orders
        LocalDateTime startOfToday = LocalDate.now().atStartOfDay();

        // 1. Patient metrics
        long totalPatients = patientRepository.count();
        long todayPatients = patientRepository.countByCreatedAtGreaterThanEqual(startOfToday);

        // 2. Staff metrics
        long totalStaff = userRepository.countByIsActiveTrue();

        // 3. Test catalog metrics
        long totalTestsInCatalog = labTestRepository.countByIsActiveTrue();

        // 4. Order metrics
        long totalOrders = testOrderRepository.count();
        long todayOrders = testOrderRepository.countByCreatedAtGreaterThanEqual(startOfToday);
        long pendingOrders = testOrderRepository.countByStatus("PENDING");
        long inProgressOrders = testOrderRepository.countByStatus("IN_PROGRESS");
        long completedOrders = testOrderRepository.countByStatus("COMPLETED") + testOrderRepository.countByStatus("REPORTED");

        // 5. Results pending review
        long pendingReviewCount = testResultRepository.countByStatus(TestResult.ResultStatus.SUBMITTED);

        // 6. Recent 5 orders
        List<TestOrder> recentOrdersList = testOrderRepository.findTop5ByOrderByCreatedAtDesc();
        List<RecentOrderSummaryDTO> recentOrders = recentOrdersList.stream()
                .map(this::mapToRecentOrderSummary)
                .collect(Collectors.toList());

        return AdminDashboardStatsDTO.builder()
                .totalPatients(totalPatients)
                .todayPatients(todayPatients)
                .totalStaff(totalStaff)
                .totalTestsInCatalog(totalTestsInCatalog)
                .totalOrders(totalOrders)
                .todayOrders(todayOrders)
                .pendingReviewCount(pendingReviewCount)
                .pendingOrdersCount(pendingOrders)
                .inProgressOrdersCount(inProgressOrders)
                .completedOrdersCount(completedOrders)
                .recentOrders(recentOrders != null ? recentOrders : Collections.emptyList())
                .build();
    }

    /**
     * Converts a TestOrder database entity into a clean RecentOrderSummaryDTO for the UI table.
     */
    private RecentOrderSummaryDTO mapToRecentOrderSummary(TestOrder order) {
        List<String> testNames = order.getOrderTests() != null
                ? order.getOrderTests().stream()
                    .map(ot -> ot.getTest() != null ? ot.getTest().getName() : "Diagnostic Test")
                    .collect(Collectors.toList())
                : Collections.emptyList();

        String patientName = order.getPatient() != null ? order.getPatient().getFullName() : "Anonymous";
        Long patientId = order.getPatient() != null ? order.getPatient().getId() : null;
        String patientContact = order.getPatient() != null ? order.getPatient().getContactNumber() : null;

        return RecentOrderSummaryDTO.builder()
                .orderId(order.getId())
                .labSlipBarcode(order.getLabSlipBarcode())
                .patientId(patientId)
                .patientName(patientName)
                .patientContact(patientContact)
                .status(order.getStatus())
                .testNames(testNames)
                .createdAt(order.getCreatedAt())
                .build();
    }
}
