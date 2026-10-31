package com.hospital.lms.config;

import com.hospital.lms.auth.models.Role;
import com.hospital.lms.auth.models.User;
import com.hospital.lms.auth.repositories.UserRepository;
import com.hospital.lms.catalog.models.ContainerType;
import com.hospital.lms.catalog.repositories.ContainerTypeRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

/**
 * DataInitializer - Automatically seeds default database records on application startup.
 * 
 * Ensures that whenever the application starts on a clean or reset database:
 * 1. Default system users exist for each role (Admin, Lab Tech, Senior Lab Tech, Receptionist).
 * 2. Standard specimen container types (EDTA, Plain Tube, etc.) are available for test ordering.
 * 
 * Default user credentials:
 * - Admin: admin@gmail.com / admin123
 * - Lab Tech: labtech@gmail.com / admin123
 * - Senior Lab Tech: seniorlabtech@gmail.com / admin123
 * - Receptionist: receptionist@gmail.com / admin123
 */
@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final ContainerTypeRepository containerTypeRepository;

    public DataInitializer(UserRepository userRepository,
                           PasswordEncoder passwordEncoder,
                           ContainerTypeRepository containerTypeRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.containerTypeRepository = containerTypeRepository;
    }

    @Override
    public void run(String... args) {
        seedDefaultUsers();
        seedDefaultContainerTypes();
    }

    /**
     * Seeds initial staff users if they are not already in the database.
     */
    private void seedDefaultUsers() {
        seedUserIfNotExists("admin@gmail.com", "admin123", Role.ADMIN);
        seedUserIfNotExists("labtech@gmail.com", "admin123", Role.LAB_TECHNICIAN);
        seedUserIfNotExists("seniorlabtech@gmail.com", "admin123", Role.SENIOR_LAB_TECHNICIAN);
        seedUserIfNotExists("receptionist@gmail.com", "admin123", Role.RECEPTIONIST);
    }

    private void seedUserIfNotExists(String username, String rawPassword, Role role) {
        if (!userRepository.existsByUsername(username)) {
            User user = new User();
            user.setUsername(username);
            user.setPasswordHash(passwordEncoder.encode(rawPassword));
            user.setRole(role);
            user.setIsActive(true);
            user.setMustChangePassword(false); // Set to false so student/examiner can log in immediately
            userRepository.save(user);
            log.info("Default user created: {} ({})", username, role);
        }
    }

    /**
     * Seeds standard specimen container types if the table is empty.
     */
    private void seedDefaultContainerTypes() {
        if (containerTypeRepository.count() == 0) {
            List<ContainerType> defaults = Arrays.asList(
                createContainerType("CT001", "EDTA Tube", "P", "CBC and haematology, purple cap", "EDTA anticoagulant"),
                createContainerType("CT002", "Plain Tube", "R", "Serum tests, red/gold cap", "Clot activator"),
                createContainerType("CT003", "Fluoride Tube", "G", "Glucose tests, grey cap", "Sodium fluoride"),
                createContainerType("CT004", "Citrate Tube", "C", "Coagulation tests, blue cap", "Sodium citrate"),
                createContainerType("CT005", "Urine Cup", "U", "All urine tests", null),
                createContainerType("CT006", "Swab Container", "S", "Microbiology swabs", "Transport medium")
            );

            containerTypeRepository.saveAll(defaults);
            log.info("Default specimen container types seeded successfully ({} types).", defaults.size());
        }
    }

    private ContainerType createContainerType(String code, String name, String labelLetter, String description, String additives) {
        ContainerType ct = new ContainerType();
        ct.setCode(code);
        ct.setName(name);
        ct.setLabelLetter(labelLetter);
        ct.setDescription(description);
        ct.setAdditives(additives);
        ct.setIsActive(true);
        return ct;
    }
}
