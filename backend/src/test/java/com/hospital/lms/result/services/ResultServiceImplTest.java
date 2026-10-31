package com.hospital.lms.result.services;

import com.hospital.lms.auth.models.User;
import com.hospital.lms.auth.repositories.UserRepository;
import com.hospital.lms.catalog.repositories.TestParameterRepository;
import com.hospital.lms.order.repositories.OrderTestRepository;
import com.hospital.lms.result.models.TestResult;
import com.hospital.lms.result.models.TestResult.ResultStatus;
import com.hospital.lms.result.repositories.TestResultRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

class ResultServiceImplTest {

    private TestResultRepository testResultRepository;
    private OrderTestRepository orderTestRepository;
    private TestParameterRepository parameterRepository;
    private UserRepository userRepository;
    private ResultService resultService;

    @BeforeEach
    void setUp() {
        testResultRepository = Mockito.mock(TestResultRepository.class);
        orderTestRepository = Mockito.mock(OrderTestRepository.class);
        parameterRepository = Mockito.mock(TestParameterRepository.class);
        userRepository = Mockito.mock(UserRepository.class);

        resultService = new ResultService(
                testResultRepository,
                orderTestRepository,
                parameterRepository,
                userRepository
        );
    }

    @Test
    @DisplayName("Should block self-verification when Senior Tech entered the result themselves (Decision D3)")
    void testSelfVerificationBlocked() {
        User tech = new User();
        tech.setId(10L);
        tech.setUsername("senior_tech_john");

        TestResult result = new TestResult();
        result.setId(100L);
        result.setEnteredBy(tech); // Tech entered the result
        result.setStatus(ResultStatus.SUBMITTED);

        when(userRepository.findByUsername("senior_tech_john")).thenReturn(Optional.of(tech));
        when(testResultRepository.findById(100L)).thenReturn(Optional.of(result));

        // Attempting to approve own result must throw
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                resultService.approveResult(100L, "senior_tech_john")
        );

        assertTrue(ex.getMessage().contains("Forbidden: You cannot verify or approve a result you entered yourself"));
    }

    @Test
    @DisplayName("Should block approval of a DRAFT result directly without submission")
    void testCannotApproveDraftDirectly() {
        User tech1 = new User();
        tech1.setId(10L);
        tech1.setUsername("tech1");

        User seniorTech = new User();
        seniorTech.setId(20L);
        seniorTech.setUsername("senior_tech");

        TestResult result = new TestResult();
        result.setId(101L);
        result.setEnteredBy(tech1);
        result.setStatus(ResultStatus.DRAFT); // Still DRAFT

        when(userRepository.findByUsername("senior_tech")).thenReturn(Optional.of(seniorTech));
        when(testResultRepository.findById(101L)).thenReturn(Optional.of(result));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                resultService.approveResult(101L, "senior_tech")
        );

        assertTrue(ex.getMessage().contains("Only SUBMITTED results can be approved"));
    }

    @Test
    @DisplayName("Should reject without reason throwing IllegalArgumentException")
    void testRejectionRequiresReason() {
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                resultService.rejectResult(102L, "  ", "senior_tech")
        );

        assertTrue(ex.getMessage().contains("rejection reason is required"));
    }
}
