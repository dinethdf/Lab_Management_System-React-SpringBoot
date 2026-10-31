package com.hospital.lms.catalog.repositories;

import com.hospital.lms.catalog.models.ContainerType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ContainerTypeRepository extends JpaRepository<ContainerType, Long> {
    List<ContainerType> findByIsActiveTrue();
    Optional<ContainerType> findByCode(String code);
}
