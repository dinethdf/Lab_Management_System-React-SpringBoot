package com.hospital.lms.order.services;

import com.hospital.lms.catalog.models.LabTest;
import com.hospital.lms.catalog.models.SampleGroup;
import com.hospital.lms.catalog.repositories.LabTestRepository;
import com.hospital.lms.order.dtos.OrderRequestDTO;
import com.hospital.lms.order.dtos.OrderResponseDTO;
import com.hospital.lms.order.models.Container;
import com.hospital.lms.order.models.OrderTest;
import com.hospital.lms.order.models.TestOrder;
import com.hospital.lms.order.repositories.TestOrderRepository;
import com.hospital.lms.patient.models.Patient;
import com.hospital.lms.patient.repositories.PatientRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Year;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service managing diagnostic test orders, lab slip issuance, and specimen slot pre-allocation.
 */
@Service
public class OrderService {

    private final TestOrderRepository testOrderRepository;
    private final PatientRepository patientRepository;
    private final LabTestRepository testRepository;

    public OrderService(TestOrderRepository testOrderRepository,
                        PatientRepository patientRepository,
                        LabTestRepository testRepository) {
        this.testOrderRepository = testOrderRepository;
        this.patientRepository = patientRepository;
        this.testRepository = testRepository;
    }

    /**
     * Creates a new lab order for a patient, generates unique Lab Slip barcode,
     * links requested catalog tests, assigns Test Sample Codes (TSC), and pre-allocates
     * the required specimen container slots based on the test's catalog sample groups.
     */
    @Transactional
    public OrderResponseDTO createOrder(OrderRequestDTO request) {
        Patient patient = patientRepository.findById(request.getPatientId())
                .orElseThrow(() -> new IllegalArgumentException("Patient not found"));

        TestOrder order = new TestOrder();
        order.setPatient(patient);
        order.setStatus("PENDING");

        // 1. Generate Lab Slip Barcode: LS-YYYY-NNNNN
        long nextId = testOrderRepository.count() + 1;
        String currentYear = String.valueOf(Year.now().getValue());
        String labSlipBarcode = String.format("LS-%s-%05d", currentYear, nextId);
        order.setLabSlipBarcode(labSlipBarcode);

        // 2. Add selected tests and generate their Test Sample Codes (TSC)
        int testSequence = 1;
        for (Long testId : request.getTestIds()) {
            LabTest test = testRepository.findById(testId)
                    .orElseThrow(() -> new IllegalArgumentException("Test not found: " + testId));

            OrderTest orderTest = new OrderTest();
            orderTest.setTest(test);

            // Generate TSC: TSC-NNNNN-XX
            String tsc = String.format("TSC-%05d-%02d", nextId, testSequence);
            orderTest.setTestSampleCode(tsc);

            // 3. Pre-allocate specimen container slots from the test's Sample Group configuration
            if (test.getSampleGroups() != null) {
                for (SampleGroup group : test.getSampleGroups()) {
                    int count = (group.getNumContainers() != null && group.getNumContainers() > 0)
                            ? group.getNumContainers() : 1;
                    int dayOffset = group.getDayOffset() != null ? group.getDayOffset() : 0;
                    for (int seq = 1; seq <= count; seq++) {
                        Container container = new Container();
                        container.setSampleGroup(group);
                        container.setDayOffset(dayOffset);
                        container.setDueDate(java.time.LocalDate.now().plusDays(dayOffset));
                        container.setContainerSequence(seq);
                        container.setStatus(Container.ContainerStatus.PENDING_COLLECTION);
                        orderTest.addContainer(container);
                    }
                }
            }

            order.addOrderTest(orderTest);
            testSequence++;
        }

        TestOrder saved = testOrderRepository.save(order);
        return mapToDTO(saved);
    }

    /**
     * Retrieves an order by its unique lab slip barcode.
     */
    @Transactional(readOnly = true)
    public OrderResponseDTO getOrderByBarcode(String barcode) {
        TestOrder order = testOrderRepository.findByLabSlipBarcode(barcode)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));
        return mapToDTO(order);
    }

    /**
     * Retrieves all past test orders for a given patient ID, ordered newest first.
     */
    @Transactional(readOnly = true)
    public List<OrderResponseDTO> getOrdersByPatientId(Long patientId) {
        List<TestOrder> orders = testOrderRepository.findByPatientIdOrderByCreatedAtDesc(patientId);
        return orders.stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    /**
     * Maps the internal TestOrder entity to a clean DTO for client consumption.
     */
    private OrderResponseDTO mapToDTO(TestOrder order) {
        OrderResponseDTO dto = new OrderResponseDTO();
        dto.setId(order.getId());
        dto.setPatientId(order.getPatient().getId());
        dto.setPatientName(order.getPatient().getFullName());
        dto.setPatientContact(order.getPatient().getContactNumber());
        dto.setLabSlipBarcode(order.getLabSlipBarcode());
        dto.setStatus(order.getStatus());
        dto.setCreatedAt(order.getCreatedAt());
        dto.setUpdatedAt(order.getUpdatedAt());

        List<OrderResponseDTO.OrderTestItemDTO> items = new ArrayList<>();
        if (order.getOrderTests() != null) {
            for (OrderTest ot : order.getOrderTests()) {
                OrderResponseDTO.OrderTestItemDTO item = new OrderResponseDTO.OrderTestItemDTO();
                item.setOrderTestId(ot.getId());
                item.setTestId(ot.getTest().getId());
                item.setTestName(ot.getTest().getName());
                item.setTestCode(ot.getTest().getCode());
                item.setTestCategory(ot.getTest().getCategory());
                item.setTestSampleCode(ot.getTestSampleCode());
                items.add(item);
            }
        }
        dto.setOrderTests(items);
        return dto;
    }
}
