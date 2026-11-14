package com.hospital.lms.patient.repositories;

import com.hospital.lms.patient.models.Patient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PatientRepository extends JpaRepository<Patient, Long> {
    // Find patients by exact or partial contact number
    List<Patient> findByContactNumberContaining(String contactNumber);

    // Count patients registered on or after a given timestamp (e.g. start of today)
    long countByCreatedAtGreaterThanEqual(LocalDateTime dateTime);
}
