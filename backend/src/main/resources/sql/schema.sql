-- ============================================================================
-- Hospital Lab Management System (LMS) — Master Database Schema
-- Run this script in your MySQL database before starting the application.
-- ============================================================================

CREATE DATABASE IF NOT EXISTS lab_management_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE lab_management_db;

-- 1. USERS & RBAC
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,                     -- ADMIN, RECEPTIONIST, LAB_TECHNICIAN, SENIOR_LAB_TECHNICIAN
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    must_change_password BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    created_by BIGINT,
    updated_by BIGINT
);

-- Seed Default System Users (Password: admin123)
INSERT INTO users (username, password_hash, role, is_active, must_change_password, created_at, updated_at) 
VALUES 
('admin@gmail.com', '$2a$10$lX1wwG4jTLpdU4DWPgzzu.QdWE8AyfQK9xtxVL5KUO4fY/012Vas.', 'ADMIN', TRUE, FALSE, NOW(), NOW()),
('receptionist@gmail.com', '$2a$10$lX1wwG4jTLpdU4DWPgzzu.QdWE8AyfQK9xtxVL5KUO4fY/012Vas.', 'RECEPTIONIST', TRUE, FALSE, NOW(), NOW()),
('labtech@gmail.com', '$2a$10$lX1wwG4jTLpdU4DWPgzzu.QdWE8AyfQK9xtxVL5KUO4fY/012Vas.', 'LAB_TECHNICIAN', TRUE, FALSE, NOW(), NOW()),
('seniorlabtech@gmail.com', '$2a$10$lX1wwG4jTLpdU4DWPgzzu.QdWE8AyfQK9xtxVL5KUO4fY/012Vas.', 'SENIOR_LAB_TECHNICIAN', TRUE, FALSE, NOW(), NOW())
ON DUPLICATE KEY UPDATE username = VALUES(username);

-- 2. TEST CATALOG MODULE
CREATE TABLE IF NOT EXISTS container_types (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    code            VARCHAR(20) NOT NULL UNIQUE,
    name            VARCHAR(100) NOT NULL,
    label_letter    CHAR(1) NOT NULL UNIQUE,
    description     VARCHAR(255),
    additives       VARCHAR(255),
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      DATETIME NOT NULL,
    updated_at      DATETIME NOT NULL,
    created_by      BIGINT,
    updated_by      BIGINT
);

-- Seed Default Container Types
INSERT INTO container_types (code, name, label_letter, description, additives, is_active, created_at, updated_at) VALUES 
('CT001', 'EDTA Tube', 'P', 'CBC and haematology, purple cap', 'EDTA anticoagulant', true, NOW(), NOW()),
('CT002', 'Plain Tube', 'R', 'Serum tests, red/gold cap', 'Clot activator', true, NOW(), NOW()),
('CT003', 'Fluoride Tube', 'G', 'Glucose tests, grey cap', 'Sodium fluoride', true, NOW(), NOW()),
('CT004', 'Citrate Tube', 'C', 'Coagulation tests, blue cap', 'Sodium citrate', true, NOW(), NOW()),
('CT005', 'Urine Cup', 'U', 'All urine tests', NULL, true, NOW(), NOW()),
('CT006', 'Swab Container', 'S', 'Microbiology swabs', 'Transport medium', true, NOW(), NOW())
ON DUPLICATE KEY UPDATE name = VALUES(name), label_letter = VALUES(label_letter);

CREATE TABLE IF NOT EXISTS lab_tests (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(200) NOT NULL,
    code            VARCHAR(20) NOT NULL UNIQUE,
    category        VARCHAR(100) NOT NULL,
    description     TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      DATETIME NOT NULL,
    updated_at      DATETIME NOT NULL,
    created_by      BIGINT,
    updated_by      BIGINT
);

-- Sample groups created before test_parameters so parameters can reference sample_group_id
CREATE TABLE IF NOT EXISTS sample_groups (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    test_id             BIGINT NOT NULL,
    sample_type         ENUM('BLOOD_VENOUS','BLOOD_CAPILLARY','URINE_SPOT','URINE_24HR','SWAB','STOOL','SPUTUM','CSF','OTHER') NOT NULL,
    container_type_id   BIGINT NOT NULL,
    num_containers      INT NOT NULL DEFAULT 1,
    day_offset          INT NOT NULL DEFAULT 0,
    created_at          DATETIME NOT NULL,
    updated_at          DATETIME NOT NULL,
    created_by          BIGINT,
    updated_by          BIGINT,
    FOREIGN KEY (test_id) REFERENCES lab_tests(id) ON DELETE CASCADE,
    FOREIGN KEY (container_type_id) REFERENCES container_types(id)
);

CREATE TABLE IF NOT EXISTS test_parameters (
    id                    BIGINT AUTO_INCREMENT PRIMARY KEY,
    test_id               BIGINT NOT NULL,
    sample_group_id       BIGINT NULL,
    name                  VARCHAR(200) NOT NULL,
    result_type           ENUM('NUMBER','TEXT','CHOICE') NOT NULL DEFAULT 'NUMBER',
    unit                  VARCHAR(50),
    decimal_places        TINYINT NULL,
    sort_order            INT NOT NULL DEFAULT 1,

    -- Male Reference Range & Critical Limits
    male_min_range        DECIMAL(10,4) NULL,
    male_max_range        DECIMAL(10,4) NULL,
    male_critical_low     DECIMAL(10,4) NULL,
    male_critical_high    DECIMAL(10,4) NULL,

    -- Female Reference Range & Critical Limits
    female_min_range      DECIMAL(10,4) NULL,
    female_max_range      DECIMAL(10,4) NULL,
    female_critical_low   DECIMAL(10,4) NULL,
    female_critical_high  DECIMAL(10,4) NULL,

    -- For CHOICE Parameters
    possible_options      TEXT NULL,
    abnormal_options      TEXT NULL,

    is_active             BOOLEAN NOT NULL DEFAULT TRUE,
    created_at            DATETIME NOT NULL,
    updated_at            DATETIME NOT NULL,
    created_by            BIGINT,
    updated_by            BIGINT,
    FOREIGN KEY (test_id) REFERENCES lab_tests(id) ON DELETE CASCADE,
    FOREIGN KEY (sample_group_id) REFERENCES sample_groups(id) ON DELETE SET NULL
);

-- 3. PATIENTS
CREATE TABLE IF NOT EXISTS patients (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(20) NOT NULL,
    contact_number VARCHAR(50) NOT NULL,
    address VARCHAR(500),
    referring_doctor VARCHAR(255),
    guardian_name VARCHAR(255),
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    created_by BIGINT,
    updated_by BIGINT
);

-- 4. ORDERS & SAMPLES
CREATE TABLE IF NOT EXISTS test_orders (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    patient_id BIGINT NOT NULL,
    lab_slip_barcode VARCHAR(50) NOT NULL UNIQUE, -- e.g. LS-2026-00456
    status VARCHAR(50) NOT NULL,                  -- PENDING, IN_PROGRESS, COMPLETED
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    created_by BIGINT,
    updated_by BIGINT,
    FOREIGN KEY (patient_id) REFERENCES patients(id)
);

CREATE TABLE IF NOT EXISTS order_tests (
    id                   BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id             BIGINT NOT NULL,
    test_id              BIGINT NOT NULL,
    test_sample_code     VARCHAR(50) NOT NULL UNIQUE,     -- e.g. TSC-00456-01
    sticker_set_number   VARCHAR(10) NULL,                -- e.g. '0001' allocated at collection
    FOREIGN KEY (order_id) REFERENCES test_orders(id) ON DELETE CASCADE,
    FOREIGN KEY (test_id) REFERENCES lab_tests(id)
);

-- 5. SPECIMEN CONTAINERS
CREATE TABLE IF NOT EXISTS containers (
    id                           BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_test_id                BIGINT NOT NULL,
    sample_group_id              BIGINT NOT NULL,
    container_code               VARCHAR(50) NULL UNIQUE,       -- Auto-matched sticker code, e.g. FBC-0001-P1
    day_offset                   INT NOT NULL DEFAULT 0,
    due_date                     DATE NULL,                     -- Day offset applied to order creation date
    container_sequence           INT NOT NULL DEFAULT 1,
    status                       VARCHAR(50) NOT NULL,          -- PENDING_COLLECTION, COLLECTED, RECEIVED_AT_LAB, RESULT_ENTERED, VERIFIED, REJECTED
    replacement_for_container_id BIGINT NULL,
    collected_at                 DATETIME,
    collected_by                 BIGINT,
    received_at                  DATETIME,
    received_by                  BIGINT,
    rejected_at                  DATETIME,
    rejection_reason             VARCHAR(255),
    created_at                   DATETIME NOT NULL,
    updated_at                   DATETIME NOT NULL,
    created_by                   BIGINT,
    updated_by                   BIGINT,
    FOREIGN KEY (order_test_id) REFERENCES order_tests(id) ON DELETE CASCADE,
    FOREIGN KEY (sample_group_id) REFERENCES sample_groups(id),
    FOREIGN KEY (replacement_for_container_id) REFERENCES containers(id) ON DELETE SET NULL,
    FOREIGN KEY (collected_by) REFERENCES users(id),
    FOREIGN KEY (received_by) REFERENCES users(id)
);

-- 6. RESULTS & VERIFICATION
CREATE TABLE IF NOT EXISTS test_results (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_test_id       BIGINT NOT NULL,
    entered_by          BIGINT NOT NULL,
    verified_by         BIGINT NULL,
    status              ENUM('DRAFT','SUBMITTED','APPROVED','REJECTED') NOT NULL DEFAULT 'DRAFT',
    notes               TEXT NULL,
    rejection_reason    TEXT NULL,
    submitted_at        DATETIME NULL,
    verified_at         DATETIME NULL,
    patient_age_days    INT NOT NULL,
    patient_sex         VARCHAR(20) NOT NULL,
    created_at          DATETIME NOT NULL,
    updated_at          DATETIME NOT NULL,
    created_by          BIGINT,
    updated_by          BIGINT,
    FOREIGN KEY (order_test_id) REFERENCES order_tests(id) ON DELETE CASCADE,
    FOREIGN KEY (entered_by) REFERENCES users(id),
    FOREIGN KEY (verified_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS result_values (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    test_result_id      BIGINT NOT NULL,
    parameter_id        BIGINT NOT NULL,
    parameter_name      VARCHAR(255) NOT NULL,
    parameter_unit      VARCHAR(100) NULL,
    result_type         ENUM('NUMBER','TEXT','CHOICE') NOT NULL,
    numeric_value       DECIMAL(12,4) NULL,
    text_value          TEXT NULL,
    choice_value        VARCHAR(100) NULL,
    ref_lower           DECIMAL(10,4) NULL,
    ref_upper           DECIMAL(10,4) NULL,
    critical_low        DECIMAL(10,4) NULL,
    critical_high       DECIMAL(10,4) NULL,
    is_abnormal         BOOLEAN NOT NULL DEFAULT FALSE,
    is_critical         BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          DATETIME NOT NULL,
    updated_at          DATETIME NOT NULL,
    created_by          BIGINT,
    updated_by          BIGINT,
    FOREIGN KEY (test_result_id) REFERENCES test_results(id) ON DELETE CASCADE,
    FOREIGN KEY (parameter_id) REFERENCES test_parameters(id)
);

CREATE TABLE IF NOT EXISTS reports (
    id                      BIGINT AUTO_INCREMENT PRIMARY KEY,
    test_result_id          BIGINT NOT NULL UNIQUE,
    report_number           VARCHAR(100) NOT NULL UNIQUE,
    pdf_path                VARCHAR(500) NOT NULL,
    share_token             VARCHAR(64) UNIQUE,
    share_token_generated_at DATETIME,
    approved_by             BIGINT NOT NULL,
    generated_at            DATETIME NOT NULL,
    created_at              DATETIME NOT NULL,
    updated_at              DATETIME NOT NULL,
    created_by              BIGINT,
    updated_by              BIGINT,
    CONSTRAINT fk_report_test_result FOREIGN KEY (test_result_id) REFERENCES test_results(id),
    CONSTRAINT fk_report_approver    FOREIGN KEY (approved_by)    REFERENCES users(id)
);

-- 5.1 REPORT ACCESS SESSIONS (Public patient portal verification sessions)
CREATE TABLE IF NOT EXISTS report_access_sessions (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    report_id       BIGINT       NOT NULL,
    session_token   VARCHAR(64)  NOT NULL UNIQUE,
    expires_at      DATETIME     NOT NULL,
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_access_session_report FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
);

-- 5.2 REPORT OTP CODES (One-Time Password challenge for patient report portal)
CREATE TABLE IF NOT EXISTS report_otp_codes (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    report_id       BIGINT       NOT NULL,
    otp_code        VARCHAR(6)   NOT NULL,
    generated_at    DATETIME     NOT NULL,
    expires_at      DATETIME     NOT NULL,
    is_used         BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by      BIGINT,
    updated_by      BIGINT,
    CONSTRAINT fk_otp_report FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
);

-- ============================================================================
-- 6. DEFAULT DIAGNOSTIC TEST CATALOG SEED DATA
-- ============================================================================

-- 1. Full Blood Count (FBC)
INSERT INTO lab_tests (name, code, category, description, is_active, created_at, updated_at)
SELECT 'Full Blood Count (FBC)', 'FBC', 'Haematology', 'Complete blood count assessing red cells, white cells, and platelets for anemia, infection, and general hematological evaluation.', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM lab_tests WHERE code = 'FBC');

SET @fbc_id = (SELECT id FROM lab_tests WHERE code = 'FBC' LIMIT 1);

INSERT INTO sample_groups (test_id, sample_type, container_type_id, num_containers, day_offset, created_at, updated_at)
SELECT @fbc_id, 'BLOOD_VENOUS', (SELECT id FROM container_types WHERE code = 'CT001' LIMIT 1), 1, 0, NOW(), NOW()
WHERE @fbc_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sample_groups WHERE test_id = @fbc_id);

SET @fbc_sg_id = (SELECT id FROM sample_groups WHERE test_id = @fbc_id LIMIT 1);

INSERT INTO test_parameters (test_id, sample_group_id, name, result_type, unit, decimal_places, sort_order,
    male_min_range, male_max_range, male_critical_low, male_critical_high,
    female_min_range, female_max_range, female_critical_low, female_critical_high,
    possible_options, abnormal_options, is_active, created_at, updated_at)
SELECT @fbc_id, @fbc_sg_id, 'Hemoglobin (Hb)', 'NUMBER', 'g/dL', 1, 1, 13.5, 17.5, 7.0, 20.0, 12.0, 15.5, 7.0, 20.0, NULL, NULL, true, NOW(), NOW()
WHERE @fbc_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM test_parameters WHERE test_id = @fbc_id AND name = 'Hemoglobin (Hb)');

INSERT INTO test_parameters (test_id, sample_group_id, name, result_type, unit, decimal_places, sort_order,
    male_min_range, male_max_range, male_critical_low, male_critical_high,
    female_min_range, female_max_range, female_critical_low, female_critical_high,
    possible_options, abnormal_options, is_active, created_at, updated_at)
SELECT @fbc_id, @fbc_sg_id, 'White Blood Cells (WBC)', 'NUMBER', '10^3/uL', 2, 2, 4.50, 11.00, 2.00, 30.00, 4.50, 11.00, 2.00, 30.00, NULL, NULL, true, NOW(), NOW()
WHERE @fbc_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM test_parameters WHERE test_id = @fbc_id AND name = 'White Blood Cells (WBC)');

INSERT INTO test_parameters (test_id, sample_group_id, name, result_type, unit, decimal_places, sort_order,
    male_min_range, male_max_range, male_critical_low, male_critical_high,
    female_min_range, female_max_range, female_critical_low, female_critical_high,
    possible_options, abnormal_options, is_active, created_at, updated_at)
SELECT @fbc_id, @fbc_sg_id, 'Platelet Count', 'NUMBER', '10^3/uL', 0, 3, 150, 450, 50, 1000, 150, 450, 50, 1000, NULL, NULL, true, NOW(), NOW()
WHERE @fbc_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM test_parameters WHERE test_id = @fbc_id AND name = 'Platelet Count');

INSERT INTO test_parameters (test_id, sample_group_id, name, result_type, unit, decimal_places, sort_order,
    male_min_range, male_max_range, male_critical_low, male_critical_high,
    female_min_range, female_max_range, female_critical_low, female_critical_high,
    possible_options, abnormal_options, is_active, created_at, updated_at)
SELECT @fbc_id, @fbc_sg_id, 'Blood Film Morphology', 'TEXT', NULL, NULL, 4, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, true, NOW(), NOW()
WHERE @fbc_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM test_parameters WHERE test_id = @fbc_id AND name = 'Blood Film Morphology');

-- 2. Fasting Blood Sugar (FBS)
INSERT INTO lab_tests (name, code, category, description, is_active, created_at, updated_at)
SELECT 'Fasting Blood Sugar (FBS)', 'FBS', 'Biochemistry', 'Measures blood glucose concentration after an overnight fast to diagnose diabetes mellitus and impaired glucose tolerance.', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM lab_tests WHERE code = 'FBS');

SET @fbs_id = (SELECT id FROM lab_tests WHERE code = 'FBS' LIMIT 1);

INSERT INTO sample_groups (test_id, sample_type, container_type_id, num_containers, day_offset, created_at, updated_at)
SELECT @fbs_id, 'BLOOD_VENOUS', (SELECT id FROM container_types WHERE code = 'CT003' LIMIT 1), 1, 0, NOW(), NOW()
WHERE @fbs_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sample_groups WHERE test_id = @fbs_id);

SET @fbs_sg_id = (SELECT id FROM sample_groups WHERE test_id = @fbs_id LIMIT 1);

INSERT INTO test_parameters (test_id, sample_group_id, name, result_type, unit, decimal_places, sort_order,
    male_min_range, male_max_range, male_critical_low, male_critical_high,
    female_min_range, female_max_range, female_critical_low, female_critical_high,
    possible_options, abnormal_options, is_active, created_at, updated_at)
SELECT @fbs_id, @fbs_sg_id, 'Fasting Plasma Glucose', 'NUMBER', 'mg/dL', 1, 1, 70.0, 99.0, 50.0, 400.0, 70.0, 99.0, 50.0, 400.0, NULL, NULL, true, NOW(), NOW()
WHERE @fbs_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM test_parameters WHERE test_id = @fbs_id AND name = 'Fasting Plasma Glucose');

-- 3. Urine Full Report (UFR)
INSERT INTO lab_tests (name, code, category, description, is_active, created_at, updated_at)
SELECT 'Urine Full Report (UFR)', 'UFR', 'Urinalysis', 'Routine physical, chemical, and microscopic examination of urine specimen for renal and urinary tract evaluation.', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM lab_tests WHERE code = 'UFR');

SET @ufr_id = (SELECT id FROM lab_tests WHERE code = 'UFR' LIMIT 1);

INSERT INTO sample_groups (test_id, sample_type, container_type_id, num_containers, day_offset, created_at, updated_at)
SELECT @ufr_id, 'URINE_SPOT', (SELECT id FROM container_types WHERE code = 'CT005' LIMIT 1), 1, 0, NOW(), NOW()
WHERE @ufr_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sample_groups WHERE test_id = @ufr_id);

SET @ufr_sg_id = (SELECT id FROM sample_groups WHERE test_id = @ufr_id LIMIT 1);

INSERT INTO test_parameters (test_id, sample_group_id, name, result_type, unit, decimal_places, sort_order,
    male_min_range, male_max_range, male_critical_low, male_critical_high,
    female_min_range, female_max_range, female_critical_low, female_critical_high,
    possible_options, abnormal_options, is_active, created_at, updated_at)
SELECT @ufr_id, @ufr_sg_id, 'Urine Sugar / Glucose', 'CHOICE', NULL, NULL, 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Negative, Trace, 1+, 2+, 3+, 4+', 'Trace, 1+, 2+, 3+, 4+', true, NOW(), NOW()
WHERE @ufr_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM test_parameters WHERE test_id = @ufr_id AND name = 'Urine Sugar / Glucose');

INSERT INTO test_parameters (test_id, sample_group_id, name, result_type, unit, decimal_places, sort_order,
    male_min_range, male_max_range, male_critical_low, male_critical_high,
    female_min_range, female_max_range, female_critical_low, female_critical_high,
    possible_options, abnormal_options, is_active, created_at, updated_at)
SELECT @ufr_id, @ufr_sg_id, 'Urine Protein / Albumin', 'CHOICE', NULL, NULL, 2, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Nil, Trace, 1+, 2+, 3+', 'Trace, 1+, 2+, 3+', true, NOW(), NOW()
WHERE @ufr_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM test_parameters WHERE test_id = @ufr_id AND name = 'Urine Protein / Albumin');

INSERT INTO test_parameters (test_id, sample_group_id, name, result_type, unit, decimal_places, sort_order,
    male_min_range, male_max_range, male_critical_low, male_critical_high,
    female_min_range, female_max_range, female_critical_low, female_critical_high,
    possible_options, abnormal_options, is_active, created_at, updated_at)
SELECT @ufr_id, @ufr_sg_id, 'Pus Cells (WBC)', 'NUMBER', '/hpf', 0, 3, 0, 5, NULL, NULL, 0, 5, NULL, NULL, NULL, NULL, true, NOW(), NOW()
WHERE @ufr_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM test_parameters WHERE test_id = @ufr_id AND name = 'Pus Cells (WBC)');

INSERT INTO test_parameters (test_id, sample_group_id, name, result_type, unit, decimal_places, sort_order,
    male_min_range, male_max_range, male_critical_low, male_critical_high,
    female_min_range, female_max_range, female_critical_low, female_critical_high,
    possible_options, abnormal_options, is_active, created_at, updated_at)
SELECT @ufr_id, @ufr_sg_id, 'Red Blood Cells (RBC)', 'NUMBER', '/hpf', 0, 4, 0, 3, NULL, 50.0, 0, 3, NULL, 50.0, NULL, NULL, true, NOW(), NOW()
WHERE @ufr_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM test_parameters WHERE test_id = @ufr_id AND name = 'Red Blood Cells (RBC)');

INSERT INTO test_parameters (test_id, sample_group_id, name, result_type, unit, decimal_places, sort_order,
    male_min_range, male_max_range, male_critical_low, male_critical_high,
    female_min_range, female_max_range, female_critical_low, female_critical_high,
    possible_options, abnormal_options, is_active, created_at, updated_at)
SELECT @ufr_id, @ufr_sg_id, 'Epithelial Cells', 'CHOICE', NULL, NULL, 5, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Nil, Few, Moderate, Plenty', 'Moderate, Plenty', true, NOW(), NOW()
WHERE @ufr_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM test_parameters WHERE test_id = @ufr_id AND name = 'Epithelial Cells');

