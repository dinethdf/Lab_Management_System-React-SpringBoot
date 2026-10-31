package com.hospital.lms.patient.services;

import com.hospital.lms.patient.models.Patient;
import com.hospital.lms.patient.repositories.PatientRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Service managing patient registration, retrieval, and validation rules.
 */
@Service
public class PatientService {

    private final PatientRepository patientRepository;

    public PatientService(PatientRepository patientRepository) {
        this.patientRepository = patientRepository;
    }

    /**
     * Registers a new patient after validating required demographics and the minor/guardian rule.
     */
    public Patient registerPatient(Patient patient) {
        if (patient.getFullName() == null || patient.getFullName().trim().isEmpty()) {
            throw new IllegalArgumentException("Patient full name is required.");
        }
        if (patient.getDateOfBirth() == null) {
            throw new IllegalArgumentException("Patient date of birth is required.");
        }
        if (patient.getGender() == null || patient.getGender().trim().isEmpty()) {
            throw new IllegalArgumentException("Patient gender/sex is required.");
        }
        if (patient.getContactNumber() == null || patient.getContactNumber().trim().isEmpty()) {
            throw new IllegalArgumentException("Contact number is required.");
        }

        // Normalize gender to standard uppercase (MALE / FEMALE)
        String genderUpper = patient.getGender().trim().toUpperCase();
        if (!"MALE".equals(genderUpper) && !"FEMALE".equals(genderUpper)) {
            // If passed as Male/Female, normalize to MALE/FEMALE
            if ("OTHER".equals(genderUpper)) {
                patient.setGender("OTHER");
            } else {
                patient.setGender(genderUpper);
            }
        } else {
            patient.setGender(genderUpper);
        }

        // Business rule: Under 18 requires guardian name
        long yearsOld = ChronoUnit.YEARS.between(patient.getDateOfBirth(), LocalDate.now());
        if (yearsOld < 18) {
            if (patient.getGuardianName() == null || patient.getGuardianName().trim().isEmpty()) {
                throw new IllegalArgumentException("Guardian name is required for patients under 18 years old.");
            }
        }

        return patientRepository.save(patient);
    }

    /**
     * Searches patients by contact mobile number.
     */
    public List<Patient> searchByContact(String contact) {
        return patientRepository.findByContactNumberContaining(contact);
    }

    /**
     * Retrieves a patient by database ID.
     */
    public Patient getPatientById(Long id) {
        return patientRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Patient not found with ID: " + id));
    }
}
