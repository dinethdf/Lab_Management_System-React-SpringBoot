package com.hospital.lms.result.repositories;

import com.hospital.lms.result.models.Result;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ResultRepository extends JpaRepository<Result, Long> {
    List<Result> findByContainerId(Long containerId);
}
