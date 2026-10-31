package com.hospital.lms.result.repositories;

import com.hospital.lms.result.models.TestResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TestResultRepository extends JpaRepository<TestResult, Long> {
    Optional<TestResult> findByOrderTestId(Long orderTestId);
    List<TestResult> findByStatusOrderBySubmittedAtDesc(TestResult.ResultStatus status);
    List<TestResult> findByEnteredByIdOrderByUpdatedAtDesc(Long enteredById);
}
