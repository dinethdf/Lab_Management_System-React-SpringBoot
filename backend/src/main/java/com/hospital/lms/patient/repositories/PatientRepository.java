package com.hospital.lms.patient.repositories;

import com.hospital.lms.patient.models.Patient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PatientRepository extends JpaRepository<Patient, Long> {
    // Find patients by exact or partial contact number
    List<Patient> findByContactNumberContaining(String contactNumber);
}
