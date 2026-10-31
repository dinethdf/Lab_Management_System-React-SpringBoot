package com.hospital.lms.catalog.repositories;

import com.hospital.lms.catalog.models.TestParameter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TestParameterRepository extends JpaRepository<TestParameter, Long> {
    List<TestParameter> findByTestIdOrderBySortOrderAsc(Long testId);
}
