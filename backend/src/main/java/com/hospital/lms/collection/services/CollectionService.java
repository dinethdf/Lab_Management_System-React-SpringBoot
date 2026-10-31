package com.hospital.lms.collection.services;

import com.hospital.lms.auth.models.User;
import com.hospital.lms.auth.repositories.UserRepository;
import com.hospital.lms.catalog.models.ContainerType;
import com.hospital.lms.catalog.models.SampleGroup;
import com.hospital.lms.collection.dtos.*;
import com.hospital.lms.order.models.Container;
import com.hospital.lms.order.models.Container.ContainerStatus;
import com.hospital.lms.order.models.OrderTest;
import com.hospital.lms.order.models.TestOrder;
import com.hospital.lms.order.repositories.ContainerRepository;
import com.hospital.lms.order.repositories.OrderTestRepository;
import com.hospital.lms.order.repositories.TestOrderRepository;
import com.hospital.lms.patient.models.Patient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service managing phlebotomy sample collection, direct sticker set allocation (0001),
 * auto-matching container codes, container bench receipt, and specimen quality rejections.
 */
@Service
public class CollectionService {

    private final TestOrderRepository testOrderRepository;
    private final OrderTestRepository orderTestRepository;
    private final ContainerRepository containerRepository;
    private final UserRepository userRepository;

    public CollectionService(TestOrderRepository testOrderRepository,
                             OrderTestRepository orderTestRepository,
                             ContainerRepository containerRepository,
                             UserRepository userRepository) {
        this.testOrderRepository = testOrderRepository;
        this.orderTestRepository = orderTestRepository;
        this.containerRepository = containerRepository;
        this.userRepository = userRepository;
    }

    /**
     * Looks up an order and its specimen container slots by Lab Slip barcode (LS-YYYY-NNNNN).
     * If an existing order has not yet generated container slots, this dynamically generates them
     * from the test's catalog sample groups for seamless backward compatibility.
     */
    @Transactional
    public CollectionOrderResponseDTO getCollectionOrderByBarcode(String rawBarcode) {
        if (rawBarcode == null || rawBarcode.trim().isEmpty()) {
            throw new IllegalArgumentException("Lab Slip barcode cannot be empty.");
        }

        String barcode = rawBarcode.trim();
        TestOrder order = testOrderRepository.findByLabSlipBarcode(barcode)
                .orElseThrow(() -> new IllegalArgumentException("No laboratory order found for Lab Slip barcode: " + barcode));

        // 1. Ensure container slots exist for all ordered tests
        if (order.getOrderTests() != null) {
            for (OrderTest orderTest : order.getOrderTests()) {
                List<Container> existingContainers = containerRepository.findByOrderTest_Id(orderTest.getId());
                if (existingContainers.isEmpty() && orderTest.getTest() != null && orderTest.getTest().getSampleGroups() != null) {
                    for (SampleGroup group : orderTest.getTest().getSampleGroups()) {
                        int count = (group.getNumContainers() != null && group.getNumContainers() > 0)
                                ? group.getNumContainers() : 1;
                        int dayOffset = group.getDayOffset() != null ? group.getDayOffset() : 0;
                        for (int seq = 1; seq <= count; seq++) {
                            Container container = new Container();
                            container.setOrderTest(orderTest);
                            container.setSampleGroup(group);
                            container.setDayOffset(dayOffset);
                            LocalDate orderDate = order.getCreatedAt() != null ? order.getCreatedAt().toLocalDate() : LocalDate.now();
                            container.setDueDate(orderDate.plusDays(dayOffset));
                            container.setContainerSequence(seq);
                            container.setStatus(ContainerStatus.PENDING_COLLECTION);
                            containerRepository.save(container);
                        }
                    }
                }
            }
        }

        // 2. Fetch all containers for this order
        List<Container> allContainers = containerRepository.findByOrderTest_TestOrder_Id(order.getId());

        // 3. Map to response DTO
        CollectionOrderResponseDTO response = new CollectionOrderResponseDTO();
        response.setOrderId(order.getId());
        response.setLabSlipBarcode(order.getLabSlipBarcode());
        response.setOrderStatus(order.getStatus());
        response.setCreatedAt(order.getCreatedAt());

        Patient patient = order.getPatient();
        if (patient != null) {
            response.setPatientId(patient.getId());
            response.setPatientName(patient.getFullName());
            response.setPatientContact(patient.getContactNumber());
            response.setPatientGender(patient.getGender());
            if (patient.getDateOfBirth() != null) {
                int ageYears = (int) ChronoUnit.YEARS.between(patient.getDateOfBirth(), LocalDate.now());
                response.setPatientAgeYears(ageYears);
            }
            response.setReferringDoctor(patient.getReferringDoctor());
        }

        // 4. Map tests and their allocated sets
        List<CollectionOrderResponseDTO.OrderTestSummaryDTO> orderTestSummaries = new ArrayList<>();
        if (order.getOrderTests() != null) {
            for (OrderTest ot : order.getOrderTests()) {
                CollectionOrderResponseDTO.OrderTestSummaryDTO summary = new CollectionOrderResponseDTO.OrderTestSummaryDTO();
                summary.setOrderTestId(ot.getId());
                if (ot.getTest() != null) {
                    summary.setTestId(ot.getTest().getId());
                    summary.setTestCode(ot.getTest().getCode());
                    summary.setTestName(ot.getTest().getName());
                    summary.setTestCategory(ot.getTest().getCategory());
                }
                summary.setTestSampleCode(ot.getTestSampleCode());
                summary.setStickerSetNumber(ot.getStickerSetNumber());

                List<ContainerDetailDTO> testContainers = allContainers.stream()
                        .filter(c -> c.getOrderTest() != null && c.getOrderTest().getId().equals(ot.getId()))
                        .map(this::mapContainerToDTO)
                        .collect(Collectors.toList());
                summary.setContainers(testContainers);

                orderTestSummaries.add(summary);
            }
        }
        response.setOrderTests(orderTestSummaries);

        // 5. Group containers into today and future
        List<ContainerDetailDTO> todayContainers = new ArrayList<>();
        List<ContainerDetailDTO> futureContainers = new ArrayList<>();
        int collectedCount = 0;
        int pendingCount = 0;
        int rejectedCount = 0;

        for (Container container : allContainers) {
            ContainerDetailDTO dto = mapContainerToDTO(container);

            if (container.getStatus() == ContainerStatus.PENDING_COLLECTION) {
                pendingCount++;
            } else if (container.getStatus() == ContainerStatus.REJECTED) {
                rejectedCount++;
                pendingCount++;
            } else if (container.getStatus() == ContainerStatus.COLLECTED
                    || container.getStatus() == ContainerStatus.RECEIVED_AT_LAB
                    || container.getStatus() == ContainerStatus.RESULT_ENTERED
                    || container.getStatus() == ContainerStatus.VERIFIED) {
                collectedCount++;
            }

            if (container.getDayOffset() == null || container.getDayOffset() == 0) {
                todayContainers.add(dto);
            } else {
                futureContainers.add(dto);
            }
        }

        response.setTodayContainers(todayContainers);
        response.setFutureContainers(futureContainers);
        response.setTotalContainers(allContainers.size());
        response.setCollectedCount(collectedCount);
        response.setPendingCount(pendingCount);
        response.setRejectedCount(rejectedCount);

        return response;
    }

    /**
     * ALLOCATE SET: The technician enters only the set number (e.g. "0001" or "1").
     * The system automatically generates and matches all container codes for that test:
     * e.g. [TestCode]-[SetCode]-[Letter][Seq] -> FBC-0001-P1, FBC-0001-P2, FBC-0001-U1.
     */
    @Transactional
    public CollectionOrderResponseDTO allocateStickerSet(Long orderTestId, String rawSetCode, String username) {
        if (orderTestId == null) {
            throw new IllegalArgumentException("Order Test ID is required.");
        }
        if (rawSetCode == null || rawSetCode.trim().isEmpty()) {
            throw new IllegalArgumentException("Sticker set code cannot be empty. Please enter the 4-digit code (e.g. 0001).");
        }

        // Format code into 4-digit zero-padded number (e.g. "1" -> "0001")
        String setCode;
        try {
            int num = Integer.parseInt(rawSetCode.trim());
            if (num <= 0) {
                throw new IllegalArgumentException("Sticker set number must be a positive integer.");
            }
            setCode = String.format("%04d", num);
        } catch (NumberFormatException e) {
            setCode = rawSetCode.trim().toUpperCase();
        }

        OrderTest orderTest = orderTestRepository.findById(orderTestId)
                .orElseThrow(() -> new IllegalArgumentException("Ordered test not found with ID: " + orderTestId));

        Long testId = orderTest.getTest().getId();
        String testCode = orderTest.getTest().getCode().toUpperCase();

        // Ensure this set code is not already allocated to a DIFFERENT order test of the same test
        Optional<OrderTest> existing = orderTestRepository.findByTest_IdAndStickerSetNumber(testId, setCode);
        if (existing.isPresent() && !existing.get().getId().equals(orderTest.getId())) {
            throw new IllegalArgumentException("Sticker set " + setCode + " has already been allocated to another patient for test " + testCode + ".");
        }

        // Retrieve existing containers for this order test
        List<Container> containers = containerRepository.findByOrderTest_Id(orderTest.getId());
        if (containers.isEmpty()) {
            LocalDate orderDate = orderTest.getTestOrder().getCreatedAt() != null
                    ? orderTest.getTestOrder().getCreatedAt().toLocalDate() : LocalDate.now();
            for (SampleGroup group : orderTest.getTest().getSampleGroups()) {
                int count = (group.getNumContainers() != null && group.getNumContainers() > 0) ? group.getNumContainers() : 1;
                int dayOffset = group.getDayOffset() != null ? group.getDayOffset() : 0;
                for (int seq = 1; seq <= count; seq++) {
                    Container container = new Container();
                    container.setOrderTest(orderTest);
                    container.setSampleGroup(group);
                    container.setDayOffset(dayOffset);
                    container.setDueDate(orderDate.plusDays(dayOffset));
                    container.setContainerSequence(seq);
                    container.setStatus(ContainerStatus.PENDING_COLLECTION);
                    containers.add(containerRepository.save(container));
                }
            }
        }

        // Track sequential letter counter across the whole test (e.g. U1, U2...)
        Map<String, Integer> letterCounters = new HashMap<>();

        for (Container container : containers) {
            SampleGroup sg = container.getSampleGroup();
            String letter = (sg != null && sg.getContainerType() != null && sg.getContainerType().getLabelLetter() != null)
                    ? sg.getContainerType().getLabelLetter().toUpperCase() : "X";

            int seq = letterCounters.getOrDefault(letter, 0) + 1;
            letterCounters.put(letter, seq);

            String containerCode = String.format("%s-%s-%s%d", testCode, setCode, letter, seq);
            container.setContainerCode(containerCode);
            containerRepository.save(container);
        }

        orderTest.setStickerSetNumber(setCode);
        orderTestRepository.save(orderTest);

        return getCollectionOrderByBarcode(orderTest.getTestOrder().getLabSlipBarcode());
    }

    /**
     * COLLECT TUBE: The technician scans an individual tube code (e.g. "FBC-0001-P1") or specifies containerId.
     * Marks container as COLLECTED. Blocks future-day samples until their due date.
     */
    @Transactional
    public ContainerDetailDTO collectTube(String tubeCode, Long containerId, String username) {
        Container container = null;
        if (tubeCode != null && !tubeCode.trim().isEmpty()) {
            container = containerRepository.findByContainerCodeIgnoreCase(tubeCode.trim())
                    .orElseThrow(() -> new IllegalArgumentException("No specimen container found matching code: " + tubeCode.trim()));
        } else if (containerId != null) {
            container = containerRepository.findById(containerId)
                    .orElseThrow(() -> new IllegalArgumentException("Container slot not found with ID: " + containerId));
        } else {
            throw new IllegalArgumentException("Container barcode code or ID is required.");
        }

        // Lockout rule for future-day collections
        if (container.getDayOffset() != null && container.getDayOffset() > 0 && container.getDueDate() != null) {
            if (container.getDueDate().isAfter(LocalDate.now())) {
                throw new IllegalArgumentException("Specimen container " + container.getContainerCode() +
                        " is scheduled for Day " + container.getDayOffset() + " (" + container.getDueDate() +
                        ") and is locked against early collection until its scheduled date.");
            }
        }

        if (container.getStatus() != ContainerStatus.PENDING_COLLECTION && container.getStatus() != ContainerStatus.REJECTED) {
            throw new IllegalArgumentException("Container " + container.getContainerCode() +
                    " is in status " + container.getStatus() + " and cannot be collected.");
        }

        User user = userRepository.findByUsername(username).orElse(null);
        Long userId = user != null ? user.getId() : null;

        // If previously rejected, re-collecting resets rejection details so the replacement specimen can proceed to bench
        if (container.getStatus() == ContainerStatus.REJECTED) {
            container.setRejectionReason(null);
            container.setRejectedAt(null);
            container.setReceivedAt(null);
            container.setReceivedBy(null);
        }

        container.setStatus(ContainerStatus.COLLECTED);
        container.setCollectedAt(LocalDateTime.now());
        container.setCollectedBy(userId);
        Container saved = containerRepository.save(container);

        // Update overall order status to IN_PROGRESS if it was PENDING
        if (container.getOrderTest() != null && container.getOrderTest().getTestOrder() != null) {
            TestOrder order = container.getOrderTest().getTestOrder();
            if ("PENDING".equalsIgnoreCase(order.getStatus())) {
                order.setStatus("IN_PROGRESS");
                testOrderRepository.save(order);
            }
        }

        return mapContainerToDTO(saved);
    }

    /**
     * Legacy linkSticker method retained for backward compatibility.
     */
    @Transactional
    public ContainerDetailDTO linkSticker(LinkStickerRequestDTO request, String username) {
        if (request.getContainerId() == null) {
            throw new IllegalArgumentException("Container ID is required.");
        }
        return collectTube(request.getStickerCode(), request.getContainerId(), username);
    }

    /**
     * Marks a collected container as RECEIVED_AT_LAB when specimen reaches the testing bench.
     */
    @Transactional
    public ContainerDetailDTO receiveContainer(Long containerId, String username) {
        Container container = containerRepository.findById(containerId)
                .orElseThrow(() -> new IllegalArgumentException("Container not found with ID: " + containerId));

        if (container.getStatus() != ContainerStatus.COLLECTED) {
            throw new IllegalArgumentException("Only COLLECTED containers can be marked as RECEIVED_AT_LAB (Current: " +
                    container.getStatus() + ").");
        }

        User user = userRepository.findByUsername(username).orElse(null);
        Long userId = user != null ? user.getId() : null;

        container.setStatus(ContainerStatus.RECEIVED_AT_LAB);
        container.setReceivedAt(LocalDateTime.now());
        container.setReceivedBy(userId);

        Container saved = containerRepository.save(container);
        return mapContainerToDTO(saved);
    }

    /**
     * Bulk shortcut to mark all collected containers for an order as RECEIVED_AT_LAB
     * when an entire phlebotomy batch arrives at the bench.
     */
    @Transactional
    public List<ContainerDetailDTO> receiveAllCollected(Long orderId, String username) {
        List<Container> containers = containerRepository.findByOrderTest_TestOrder_Id(orderId);
        User user = userRepository.findByUsername(username).orElse(null);
        Long userId = user != null ? user.getId() : null;

        List<Container> updated = new ArrayList<>();
        for (Container container : containers) {
            if (container.getStatus() == ContainerStatus.COLLECTED) {
                container.setStatus(ContainerStatus.RECEIVED_AT_LAB);
                container.setReceivedAt(LocalDateTime.now());
                container.setReceivedBy(userId);
                updated.add(containerRepository.save(container));
            }
        }

        return updated.stream().map(this::mapContainerToDTO).collect(Collectors.toList());
    }

    /**
     * Rejects a specimen container at bench receipt due to a quality issue (hemolysis, clotted, etc.).
     */
    @Transactional
    public ContainerDetailDTO rejectContainer(Long containerId, RejectContainerRequestDTO request, String username) {
        if (request.getReason() == null || request.getReason().trim().isEmpty()) {
            throw new IllegalArgumentException("Specimen rejection reason is required.");
        }

        Container container = containerRepository.findById(containerId)
                .orElseThrow(() -> new IllegalArgumentException("Container not found with ID: " + containerId));

        if (container.getStatus() != ContainerStatus.COLLECTED && container.getStatus() != ContainerStatus.RECEIVED_AT_LAB) {
            throw new IllegalArgumentException("Only COLLECTED or RECEIVED_AT_LAB containers can be rejected for sample quality (Current: " +
                    container.getStatus() + ").");
        }

        container.setStatus(ContainerStatus.REJECTED);
        container.setRejectedAt(LocalDateTime.now());
        container.setRejectionReason(request.getReason().trim());

        Container saved = containerRepository.save(container);
        return mapContainerToDTO(saved);
    }

    /**
     * Retrieves recent pending collection orders for the phlebotomy room worklist.
     * Includes orders that are PENDING or IN_PROGRESS with outstanding pending/rejected containers needing attention.
     */
    @Transactional(readOnly = true)
    public List<CollectionOrderResponseDTO> getPendingCollectionOrders() {
        List<TestOrder> activeOrders = testOrderRepository.findByStatusInOrderByCreatedAtDesc(
                Arrays.asList("PENDING", "IN_PROGRESS"));
        return activeOrders.stream()
                .map(o -> getCollectionOrderByBarcode(o.getLabSlipBarcode()))
                .filter(dto -> dto != null && (dto.getPendingCount() > 0 || (dto.getRejectedCount() != null && dto.getRejectedCount() > 0)))
                .limit(20)
                .collect(Collectors.toList());
    }

    /**
     * Helper method to map Container entity to rich ContainerDetailDTO.
     */
    private ContainerDetailDTO mapContainerToDTO(Container container) {
        ContainerDetailDTO dto = new ContainerDetailDTO();
        dto.setId(container.getId());
        dto.setContainerCode(container.getContainerCode());
        dto.setDayOffset(container.getDayOffset());
        dto.setDueDate(container.getDueDate());
        dto.setDueToday(container.getDueDate() == null || !container.getDueDate().isAfter(LocalDate.now()));

        if (container.getOrderTest() != null) {
            dto.setStickerSetFormattedNumber(container.getOrderTest().getStickerSetNumber());
            dto.setOrderTestId(container.getOrderTest().getId());
            dto.setTestSampleCode(container.getOrderTest().getTestSampleCode());
            if (container.getOrderTest().getTest() != null) {
                dto.setTestId(container.getOrderTest().getTest().getId());
                dto.setTestName(container.getOrderTest().getTest().getName());
                dto.setTestCode(container.getOrderTest().getTest().getCode());
                dto.setTestCategory(container.getOrderTest().getTest().getCategory());
            }
        }

        dto.setContainerSequence(container.getContainerSequence());
        dto.setStatus(container.getStatus() != null ? container.getStatus().name() : "PENDING_COLLECTION");

        dto.setCollectedAt(container.getCollectedAt());
        dto.setCollectedBy(container.getCollectedBy());
        if (container.getCollectedBy() != null) {
            userRepository.findById(container.getCollectedBy())
                    .ifPresent(u -> dto.setCollectedByName(u.getUsername()));
        }

        dto.setReceivedAt(container.getReceivedAt());
        dto.setReceivedBy(container.getReceivedBy());
        if (container.getReceivedBy() != null) {
            userRepository.findById(container.getReceivedBy())
                    .ifPresent(u -> dto.setReceivedByName(u.getUsername()));
        }

        dto.setRejectedAt(container.getRejectedAt());
        dto.setRejectionReason(container.getRejectionReason());

        if (container.getSampleGroup() != null) {
            SampleGroup sg = container.getSampleGroup();
            dto.setSampleGroupId(sg.getId());
            if (sg.getSampleType() != null) {
                dto.setSampleType(sg.getSampleType().name());
                dto.setSampleTypeName(formatSampleTypeName(sg.getSampleType().name()));
            }
            if (sg.getContainerType() != null) {
                ContainerType ct = sg.getContainerType();
                dto.setContainerTypeCode(ct.getCode());
                dto.setContainerTypeName(ct.getName());
                dto.setContainerLabelLetter(ct.getLabelLetter());
                dto.setContainerColorHint(getColorHintForLetter(ct.getLabelLetter()));
            }
        }

        return dto;
    }

    private String formatSampleTypeName(String rawType) {
        switch (rawType) {
            case "BLOOD_VENOUS": return "Venous Blood";
            case "BLOOD_CAPILLARY": return "Capillary Blood";
            case "URINE_SPOT": return "Spot Urine";
            case "URINE_24HR": return "24-Hour Urine";
            case "SWAB": return "Swab";
            case "STOOL": return "Stool";
            case "SPUTUM": return "Sputum";
            case "CSF": return "Cerebrospinal Fluid (CSF)";
            default: return rawType;
        }
    }

    private String getColorHintForLetter(String letter) {
        if (letter == null) return "gray";
        switch (letter.toUpperCase()) {
            case "P": return "purple"; // EDTA Tube (CBC)
            case "R": return "red";    // Plain Tube (Serum)
            case "G": return "gray";   // Fluoride Tube (Glucose)
            case "C": return "blue";   // Citrate Tube (Coagulation)
            case "U": return "yellow"; // Urine Cup
            case "S": return "teal";   // Swab container
            default: return "blue";
        }
    }
}
