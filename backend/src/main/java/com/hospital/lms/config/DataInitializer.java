package com.hospital.lms.config;

import com.hospital.lms.auth.models.Role;
import com.hospital.lms.auth.models.User;
import com.hospital.lms.auth.repositories.UserRepository;
import com.hospital.lms.catalog.dtos.CreateTestRequest;
import com.hospital.lms.catalog.dtos.ParameterDTO;
import com.hospital.lms.catalog.dtos.SampleGroupDTO;
import com.hospital.lms.catalog.models.ContainerType;
import com.hospital.lms.catalog.models.SampleGroup;
import com.hospital.lms.catalog.repositories.ContainerTypeRepository;
import com.hospital.lms.catalog.repositories.LabTestRepository;
import com.hospital.lms.catalog.services.CatalogService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * DataInitializer - Automatically seeds default database records on application startup.
 * 
 * Ensures that whenever the application starts on a clean or reset database:
 * 1. Default system users exist for each role (Admin, Lab Tech, Senior Lab Tech, Receptionist).
 * 2. Standard specimen container types (EDTA, Plain Tube, etc.) are available for test ordering.
 * 3. Standard diagnostic test catalog entries (FBC, FBS, UFR) are initialized for manual testing.
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
    private final LabTestRepository testRepository;
    private final CatalogService catalogService;

    public DataInitializer(UserRepository userRepository,
                           PasswordEncoder passwordEncoder,
                           ContainerTypeRepository containerTypeRepository,
                           LabTestRepository testRepository,
                           CatalogService catalogService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.containerTypeRepository = containerTypeRepository;
        this.testRepository = testRepository;
        this.catalogService = catalogService;
    }

    @Override
    public void run(String... args) {
        seedDefaultUsers();
        seedDefaultContainerTypes();
        seedDefaultTests();
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

    /**
     * Seeds realistic default diagnostic tests (FBC, FBS, UFR) if not already present.
     */
    private void seedDefaultTests() {
        seedFbcTest();
        seedFbsTest();
        seedUfrTest();
    }

    private void seedFbcTest() {
        if (testRepository.findByCode("FBC").isPresent()) {
            return;
        }
        ContainerType edta = containerTypeRepository.findByCode("CT001").orElse(null);
        if (edta == null) return;

        CreateTestRequest req = new CreateTestRequest();
        req.setName("Full Blood Count (FBC)");
        req.setCode("FBC");
        req.setCategory("Haematology");
        req.setDescription("Complete blood count assessing red cells, white cells, and platelets for anemia, infection, and general hematological evaluation.");

        SampleGroupDTO g1 = new SampleGroupDTO();
        g1.setKey("g1");
        g1.setSampleType(SampleGroup.SampleType.BLOOD_VENOUS);
        g1.setContainerTypeId(edta.getId());
        g1.setNumContainers(1);
        g1.setDayOffset(0);
        req.setSampleGroups(List.of(g1));

        List<ParameterDTO> params = new ArrayList<>();

        ParameterDTO p1 = new ParameterDTO();
        p1.setName("Hemoglobin (Hb)");
        p1.setResultType("NUMBER");
        p1.setUnit("g/dL");
        p1.setDecimalPlaces(1);
        p1.setSortOrder(1);
        p1.setSampleGroupKey("g1");
        p1.setMaleMinRange(new BigDecimal("13.5"));
        p1.setMaleMaxRange(new BigDecimal("17.5"));
        p1.setMaleCriticalLow(new BigDecimal("7.0"));
        p1.setMaleCriticalHigh(new BigDecimal("20.0"));
        p1.setFemaleMinRange(new BigDecimal("12.0"));
        p1.setFemaleMaxRange(new BigDecimal("15.5"));
        p1.setFemaleCriticalLow(new BigDecimal("7.0"));
        p1.setFemaleCriticalHigh(new BigDecimal("20.0"));
        params.add(p1);

        ParameterDTO p2 = new ParameterDTO();
        p2.setName("White Blood Cells (WBC)");
        p2.setResultType("NUMBER");
        p2.setUnit("10^3/uL");
        p2.setDecimalPlaces(2);
        p2.setSortOrder(2);
        p2.setSampleGroupKey("g1");
        p2.setMaleMinRange(new BigDecimal("4.50"));
        p2.setMaleMaxRange(new BigDecimal("11.00"));
        p2.setMaleCriticalLow(new BigDecimal("2.00"));
        p2.setMaleCriticalHigh(new BigDecimal("30.00"));
        p2.setFemaleMinRange(new BigDecimal("4.50"));
        p2.setFemaleMaxRange(new BigDecimal("11.00"));
        p2.setFemaleCriticalLow(new BigDecimal("2.00"));
        p2.setFemaleCriticalHigh(new BigDecimal("30.00"));
        params.add(p2);

        ParameterDTO p3 = new ParameterDTO();
        p3.setName("Platelet Count");
        p3.setResultType("NUMBER");
        p3.setUnit("10^3/uL");
        p3.setDecimalPlaces(0);
        p3.setSortOrder(3);
        p3.setSampleGroupKey("g1");
        p3.setMaleMinRange(new BigDecimal("150"));
        p3.setMaleMaxRange(new BigDecimal("450"));
        p3.setMaleCriticalLow(new BigDecimal("50"));
        p3.setMaleCriticalHigh(new BigDecimal("1000"));
        p3.setFemaleMinRange(new BigDecimal("150"));
        p3.setFemaleMaxRange(new BigDecimal("450"));
        p3.setFemaleCriticalLow(new BigDecimal("50"));
        p3.setFemaleCriticalHigh(new BigDecimal("1000"));
        params.add(p3);

        ParameterDTO p4 = new ParameterDTO();
        p4.setName("Blood Film Morphology");
        p4.setResultType("TEXT");
        p4.setSortOrder(4);
        p4.setSampleGroupKey("g1");
        params.add(p4);

        req.setParameters(params);
        catalogService.createTest(req);
        log.info("Default diagnostic test seeded: FBC");
    }

    private void seedFbsTest() {
        if (testRepository.findByCode("FBS").isPresent()) {
            return;
        }
        ContainerType fluoride = containerTypeRepository.findByCode("CT003").orElse(null);
        if (fluoride == null) return;

        CreateTestRequest req = new CreateTestRequest();
        req.setName("Fasting Blood Sugar (FBS)");
        req.setCode("FBS");
        req.setCategory("Biochemistry");
        req.setDescription("Measures blood glucose concentration after an overnight fast to diagnose diabetes mellitus and impaired glucose tolerance.");

        SampleGroupDTO g1 = new SampleGroupDTO();
        g1.setKey("g1");
        g1.setSampleType(SampleGroup.SampleType.BLOOD_VENOUS);
        g1.setContainerTypeId(fluoride.getId());
        g1.setNumContainers(1);
        g1.setDayOffset(0);
        req.setSampleGroups(List.of(g1));

        List<ParameterDTO> params = new ArrayList<>();

        ParameterDTO p1 = new ParameterDTO();
        p1.setName("Fasting Plasma Glucose");
        p1.setResultType("NUMBER");
        p1.setUnit("mg/dL");
        p1.setDecimalPlaces(1);
        p1.setSortOrder(1);
        p1.setSampleGroupKey("g1");
        p1.setMaleMinRange(new BigDecimal("70.0"));
        p1.setMaleMaxRange(new BigDecimal("99.0"));
        p1.setMaleCriticalLow(new BigDecimal("50.0"));
        p1.setMaleCriticalHigh(new BigDecimal("400.0"));
        p1.setFemaleMinRange(new BigDecimal("70.0"));
        p1.setFemaleMaxRange(new BigDecimal("99.0"));
        p1.setFemaleCriticalLow(new BigDecimal("50.0"));
        p1.setFemaleCriticalHigh(new BigDecimal("400.0"));
        params.add(p1);

        req.setParameters(params);
        catalogService.createTest(req);
        log.info("Default diagnostic test seeded: FBS");
    }

    private void seedUfrTest() {
        if (testRepository.findByCode("UFR").isPresent()) {
            return;
        }
        ContainerType urineCup = containerTypeRepository.findByCode("CT005").orElse(null);
        if (urineCup == null) return;

        CreateTestRequest req = new CreateTestRequest();
        req.setName("Urine Full Report (UFR)");
        req.setCode("UFR");
        req.setCategory("Urinalysis");
        req.setDescription("Routine physical, chemical, and microscopic examination of urine specimen for renal and urinary tract evaluation.");

        SampleGroupDTO g1 = new SampleGroupDTO();
        g1.setKey("g1");
        g1.setSampleType(SampleGroup.SampleType.URINE_SPOT);
        g1.setContainerTypeId(urineCup.getId());
        g1.setNumContainers(1);
        g1.setDayOffset(0);
        req.setSampleGroups(List.of(g1));

        List<ParameterDTO> params = new ArrayList<>();

        ParameterDTO p1 = new ParameterDTO();
        p1.setName("Urine Sugar / Glucose");
        p1.setResultType("CHOICE");
        p1.setSortOrder(1);
        p1.setSampleGroupKey("g1");
        p1.setPossibleOptions("Negative, Trace, 1+, 2+, 3+, 4+");
        p1.setAbnormalOptions("Trace, 1+, 2+, 3+, 4+");
        params.add(p1);

        ParameterDTO p2 = new ParameterDTO();
        p2.setName("Urine Protein / Albumin");
        p2.setResultType("CHOICE");
        p2.setSortOrder(2);
        p2.setSampleGroupKey("g1");
        p2.setPossibleOptions("Nil, Trace, 1+, 2+, 3+");
        p2.setAbnormalOptions("Trace, 1+, 2+, 3+");
        params.add(p2);

        ParameterDTO p3 = new ParameterDTO();
        p3.setName("Pus Cells (WBC)");
        p3.setResultType("NUMBER");
        p3.setUnit("/hpf");
        p3.setDecimalPlaces(0);
        p3.setSortOrder(3);
        p3.setSampleGroupKey("g1");
        p3.setMaleMinRange(new BigDecimal("0"));
        p3.setMaleMaxRange(new BigDecimal("5"));
        p3.setFemaleMinRange(new BigDecimal("0"));
        p3.setFemaleMaxRange(new BigDecimal("5"));
        params.add(p3);

        ParameterDTO p4 = new ParameterDTO();
        p4.setName("Red Blood Cells (RBC)");
        p4.setResultType("NUMBER");
        p4.setUnit("/hpf");
        p4.setDecimalPlaces(0);
        p4.setSortOrder(4);
        p4.setSampleGroupKey("g1");
        p4.setMaleMinRange(new BigDecimal("0"));
        p4.setMaleMaxRange(new BigDecimal("3"));
        p4.setMaleCriticalHigh(new BigDecimal("50.0"));
        p4.setFemaleMinRange(new BigDecimal("0"));
        p4.setFemaleMaxRange(new BigDecimal("3"));
        p4.setFemaleCriticalHigh(new BigDecimal("50.0"));
        params.add(p4);

        ParameterDTO p5 = new ParameterDTO();
        p5.setName("Epithelial Cells");
        p5.setResultType("CHOICE");
        p5.setSortOrder(5);
        p5.setSampleGroupKey("g1");
        p5.setPossibleOptions("Nil, Few, Moderate, Plenty");
        p5.setAbnormalOptions("Moderate, Plenty");
        params.add(p5);

        req.setParameters(params);
        catalogService.createTest(req);
        log.info("Default diagnostic test seeded: UFR");
    }
}
