package com.hospital.lms.dashboard.services;

import com.hospital.lms.auth.repositories.UserRepository;
import com.hospital.lms.catalog.models.LabTest;
import com.hospital.lms.catalog.repositories.LabTestRepository;
import com.hospital.lms.dashboard.dtos.AdminDashboardStatsDTO;
import com.hospital.lms.order.models.OrderTest;
import com.hospital.lms.order.models.TestOrder;
import com.hospital.lms.order.repositories.TestOrderRepository;
import com.hospital.lms.patient.models.Patient;
import com.hospital.lms.patient.repositories.PatientRepository;
import com.hospital.lms.result.models.TestResult;
import com.hospital.lms.result.repositories.TestResultRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

public class DashboardServiceTest {

    private PatientRepository patientRepository;
    private UserRepository userRepository;
    private LabTestRepository labTestRepository;
    private TestOrderRepository testOrderRepository;
    private TestResultRepository testResultRepository;
    private DashboardService dashboardService;

    @BeforeEach
    void setUp() {
        patientRepository = mock(PatientRepository.class);
        userRepository = mock(UserRepository.class);
        labTestRepository = mock(LabTestRepository.class);
        testOrderRepository = mock(TestOrderRepository.class);
        testResultRepository = mock(TestResultRepository.class);

        dashboardService = new DashboardService(
                patientRepository,
                userRepository,
                labTestRepository,
                testOrderRepository,
                testResultRepository
        );
    }

    @Test
    @DisplayName("Should compute aggregated dashboard metrics correctly from repositories")
    void testGetAdminDashboardStats_Success() {
        // Arrange
        when(patientRepository.count()).thenReturn(15L);
        when(patientRepository.countByCreatedAtGreaterThanEqual(any())).thenReturn(3L);
        when(userRepository.countByIsActiveTrue()).thenReturn(4L);
        when(labTestRepository.countByIsActiveTrue()).thenReturn(8L);
        when(testOrderRepository.count()).thenReturn(20L);
        when(testOrderRepository.countByCreatedAtGreaterThanEqual(any())).thenReturn(5L);
        when(testOrderRepository.countByStatus("PENDING")).thenReturn(6L);
        when(testOrderRepository.countByStatus("IN_PROGRESS")).thenReturn(4L);
        when(testOrderRepository.countByStatus("COMPLETED")).thenReturn(8L);
        when(testOrderRepository.countByStatus("REPORTED")).thenReturn(2L);
        when(testResultRepository.countByStatus(TestResult.ResultStatus.SUBMITTED)).thenReturn(2L);

        Patient patient = new Patient();
        patient.setId(101L);
        patient.setFullName("John Perera");
        patient.setContactNumber("0771234567");

        LabTest labTest = new LabTest();
        labTest.setName("Full Blood Count");
        labTest.setCode("FBC");

        OrderTest orderTest = new OrderTest();
        orderTest.setTest(labTest);
        orderTest.setTestSampleCode("TSC-00001-01");

        TestOrder order = new TestOrder();
        order.setId(1L);
        order.setLabSlipBarcode("LS-2026-00001");
        order.setStatus("PENDING");
        order.setPatient(patient);
        order.setOrderTests(List.of(orderTest));
        order.setCreatedAt(LocalDateTime.now());

        when(testOrderRepository.findTop5ByOrderByCreatedAtDesc()).thenReturn(List.of(order));

        // Act
        AdminDashboardStatsDTO stats = dashboardService.getAdminDashboardStats();

        // Assert
        assertNotNull(stats);
        assertEquals(15L, stats.getTotalPatients());
        assertEquals(3L, stats.getTodayPatients());
        assertEquals(4L, stats.getTotalStaff());
        assertEquals(8L, stats.getTotalTestsInCatalog());
        assertEquals(20L, stats.getTotalOrders());
        assertEquals(5L, stats.getTodayOrders());
        assertEquals(2L, stats.getPendingReviewCount());
        assertEquals(6L, stats.getPendingOrdersCount());
        assertEquals(4L, stats.getInProgressOrdersCount());
        assertEquals(10L, stats.getCompletedOrdersCount()); // 8 + 2
        assertEquals(1, stats.getRecentOrders().size());
        assertEquals("LS-2026-00001", stats.getRecentOrders().get(0).getLabSlipBarcode());
        assertEquals("John Perera", stats.getRecentOrders().get(0).getPatientName());
        assertEquals("Full Blood Count", stats.getRecentOrders().get(0).getTestNames().get(0));
    }
}
