package com.hospital.lms.patient.controllers;

import com.hospital.lms.common.dtos.MessageResponse;
import com.hospital.lms.patient.models.Patient;
import com.hospital.lms.patient.services.PatientService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/patients")
public class PatientController {

    private final PatientService patientService;

    public PatientController(PatientService patientService) {
        this.patientService = patientService;
    }

    @PostMapping
    public ResponseEntity<?> registerPatient(@RequestBody Patient patient) {
        try {
            return ResponseEntity.ok(patientService.registerPatient(patient));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse("Failed to register patient: " + e.getMessage()));
        }
    }

    @GetMapping("/search")
    public ResponseEntity<List<Patient>> searchPatients(@RequestParam("contact") String contact) {
        return ResponseEntity.ok(patientService.searchByContact(contact));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getPatientById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(patientService.getPatientById(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(new MessageResponse(e.getMessage()));
        }
    }
}
