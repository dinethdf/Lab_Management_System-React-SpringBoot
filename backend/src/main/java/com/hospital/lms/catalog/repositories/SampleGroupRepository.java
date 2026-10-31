package com.hospital.lms.catalog.repositories;

import com.hospital.lms.catalog.models.SampleGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SampleGroupRepository extends JpaRepository<SampleGroup, Long> {
    List<SampleGroup> findByTestId(Long testId);
}
