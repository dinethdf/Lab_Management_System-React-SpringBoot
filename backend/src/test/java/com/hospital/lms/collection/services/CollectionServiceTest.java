package com.hospital.lms.collection.services;

import com.hospital.lms.auth.models.User;
import com.hospital.lms.auth.repositories.UserRepository;
import com.hospital.lms.catalog.models.ContainerType;
import com.hospital.lms.catalog.models.LabTest;
import com.hospital.lms.catalog.models.SampleGroup;
import com.hospital.lms.collection.dtos.CollectionOrderResponseDTO;
import com.hospital.lms.collection.dtos.ContainerDetailDTO;
import com.hospital.lms.order.models.Container;
import com.hospital.lms.order.models.Container.ContainerStatus;
import com.hospital.lms.order.models.OrderTest;
import com.hospital.lms.order.models.TestOrder;
import com.hospital.lms.order.repositories.ContainerRepository;
import com.hospital.lms.order.repositories.OrderTestRepository;
import com.hospital.lms.order.repositories.TestOrderRepository;
import com.hospital.lms.patient.models.Patient;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

public class CollectionServiceTest {

    private TestOrderRepository testOrderRepository;
    private OrderTestRepository orderTestRepository;
    private ContainerRepository containerRepository;
    private UserRepository userRepository;
    private CollectionService collectionService;

    private LabTest test;
    private OrderTest orderTest;
    private TestOrder testOrder;
    private User tech;

    @BeforeEach
    void setUp() {
        testOrderRepository = mock(TestOrderRepository.class);
        orderTestRepository = mock(OrderTestRepository.class);
        containerRepository = mock(ContainerRepository.class);
        userRepository = mock(UserRepository.class);

        collectionService = new CollectionService(
                testOrderRepository,
                orderTestRepository,
                containerRepository,
                userRepository
        );

        tech = new User();
        tech.setId(10L);
        tech.setUsername("labtech@gmail.com");

        test = new LabTest();
        test.setId(1L);
        test.setCode("FBC");
        test.setName("Full Blood Count");

        ContainerType edta = new ContainerType();
        edta.setId(101L);
        edta.setName("EDTA Tube");
        edta.setLabelLetter("P");

        ContainerType urine = new ContainerType();
        urine.setId(102L);
        urine.setName("Urine Cup");
        urine.setLabelLetter("U");

        SampleGroup g1 = new SampleGroup();
        g1.setId(201L);
        g1.setContainerType(edta);
        g1.setNumContainers(2);
        g1.setDayOffset(0);

        SampleGroup g2 = new SampleGroup();
        g2.setId(202L);
        g2.setContainerType(urine);
        g2.setNumContainers(1);
        g2.setDayOffset(1);

        test.setSampleGroups(Arrays.asList(g1, g2));

        Patient patient = new Patient();
        patient.setId(5L);
        patient.setFullName("John Doe");

        testOrder = new TestOrder();
        testOrder.setId(50L);
        testOrder.setLabSlipBarcode("LS-2026-00001");
        testOrder.setStatus("PENDING");
        testOrder.setPatient(patient);
        testOrder.setCreatedAt(LocalDateTime.now());

        orderTest = new OrderTest();
        orderTest.setId(100L);
        orderTest.setTest(test);
        orderTest.setTestOrder(testOrder);
        orderTest.setTestSampleCode("TSC-00001-01");

        testOrder.setOrderTests(Collections.singletonList(orderTest));
    }

    @Test
    @DisplayName("Allocate 0001 set code automatically generates matched container codes (FBC-0001-P1, FBC-0001-P2, FBC-0001-U1)")
    void testAllocateStickerSet_AutoMatchesContainers() {
        when(orderTestRepository.findById(100L)).thenReturn(Optional.of(orderTest));
        when(orderTestRepository.findByTest_IdAndStickerSetNumber(1L, "0001")).thenReturn(Optional.empty());

        // Mock container creation
        List<Container> containers = new ArrayList<>();
        Container c1 = new Container();
        c1.setId(1L);
        c1.setOrderTest(orderTest);
        c1.setSampleGroup(test.getSampleGroups().get(0));

        Container c2 = new Container();
        c2.setId(2L);
        c2.setOrderTest(orderTest);
        c2.setSampleGroup(test.getSampleGroups().get(0));

        Container c3 = new Container();
        c3.setId(3L);
        c3.setOrderTest(orderTest);
        c3.setSampleGroup(test.getSampleGroups().get(1));

        containers.add(c1);
        containers.add(c2);
        containers.add(c3);

        when(containerRepository.findByOrderTest_Id(100L)).thenReturn(containers);
        when(containerRepository.save(any(Container.class))).thenAnswer(inv -> inv.getArgument(0));
        when(orderTestRepository.save(any(OrderTest.class))).thenAnswer(inv -> inv.getArgument(0));
        when(testOrderRepository.findByLabSlipBarcode("LS-2026-00001")).thenReturn(Optional.of(testOrder));
        when(containerRepository.findByOrderTest_TestOrder_Id(50L)).thenReturn(containers);

        CollectionOrderResponseDTO response = collectionService.allocateStickerSet(100L, "1", "labtech@gmail.com");

        assertNotNull(response);
        assertEquals("0001", orderTest.getStickerSetNumber());
        assertEquals("FBC-0001-P1", c1.getContainerCode());
        assertEquals("FBC-0001-P2", c2.getContainerCode());
        assertEquals("FBC-0001-U1", c3.getContainerCode());
    }

    @Test
    @DisplayName("Collecting tube marks container as COLLECTED and advances order to IN_PROGRESS")
    void testCollectTube_Success() {
        Container c1 = new Container();
        c1.setId(1L);
        c1.setOrderTest(orderTest);
        c1.setContainerCode("FBC-0001-P1");
        c1.setDayOffset(0);
        c1.setStatus(ContainerStatus.PENDING_COLLECTION);

        when(containerRepository.findByContainerCodeIgnoreCase("FBC-0001-P1")).thenReturn(Optional.of(c1));
        when(userRepository.findByUsername("labtech@gmail.com")).thenReturn(Optional.of(tech));
        when(containerRepository.save(any(Container.class))).thenAnswer(inv -> inv.getArgument(0));

        ContainerDetailDTO result = collectionService.collectTube("FBC-0001-P1", null, "labtech@gmail.com");

        assertNotNull(result);
        assertEquals("COLLECTED", c1.getStatus().name());
        assertEquals("IN_PROGRESS", testOrder.getStatus());
        assertEquals(10L, c1.getCollectedBy());
    }

    @Test
    @DisplayName("Re-collecting a REJECTED tube resets status to COLLECTED and clears rejection fields using same sticker code")
    void testCollectTube_ReCollectRejectedContainer() {
        Container c1 = new Container();
        c1.setId(1L);
        c1.setOrderTest(orderTest);
        c1.setContainerCode("FBC-0001-P1");
        c1.setDayOffset(0);
        c1.setStatus(ContainerStatus.REJECTED);
        c1.setRejectionReason("Gross Hemolysis");
        c1.setRejectedAt(LocalDateTime.now().minusHours(1));
        c1.setReceivedAt(LocalDateTime.now().minusHours(2));
        c1.setReceivedBy(15L);

        when(containerRepository.findByContainerCodeIgnoreCase("FBC-0001-P1")).thenReturn(Optional.of(c1));
        when(userRepository.findByUsername("labtech@gmail.com")).thenReturn(Optional.of(tech));
        when(containerRepository.save(any(Container.class))).thenAnswer(inv -> inv.getArgument(0));

        ContainerDetailDTO result = collectionService.collectTube("FBC-0001-P1", null, "labtech@gmail.com");

        assertNotNull(result);
        assertEquals("COLLECTED", c1.getStatus().name());
        assertNull(c1.getRejectionReason());
        assertNull(c1.getRejectedAt());
        assertNull(c1.getReceivedAt());
        assertNull(c1.getReceivedBy());
        assertEquals(10L, c1.getCollectedBy());
        assertNotNull(c1.getCollectedAt());
    }
}
