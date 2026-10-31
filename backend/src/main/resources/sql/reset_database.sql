-- ============================================================================
-- Hospital Lab Management System (LMS) — Master Database Clean Reset
-- Drops and recreates the entire database and seeds users & container types.
-- ============================================================================

DROP DATABASE IF EXISTS lab_management_db;
CREATE DATABASE lab_management_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE lab_management_db;

-- 1. USERS & RBAC
CREATE TABLE users (
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
-- BCrypt hash for 'admin123': $2a$10$lX1wwG4jTLpdU4DWPgzzu.QdWE8AyfQK9xtxVL5KUO4fY/012Vas.
INSERT INTO users (username, password_hash, role, is_active, must_change_password, created_at, updated_at) 
VALUES 
('admin@gmail.com', '$2a$10$lX1wwG4jTLpdU4DWPgzzu.QdWE8AyfQK9xtxVL5KUO4fY/012Vas.', 'ADMIN', TRUE, FALSE, NOW(), NOW()),
('receptionist@gmail.com', '$2a$10$lX1wwG4jTLpdU4DWPgzzu.QdWE8AyfQK9xtxVL5KUO4fY/012Vas.', 'RECEPTIONIST', TRUE, FALSE, NOW(), NOW()),
('labtech@gmail.com', '$2a$10$lX1wwG4jTLpdU4DWPgzzu.QdWE8AyfQK9xtxVL5KUO4fY/012Vas.', 'LAB_TECHNICIAN', TRUE, FALSE, NOW(), NOW()),
('seniorlabtech@gmail.com', '$2a$10$lX1wwG4jTLpdU4DWPgzzu.QdWE8AyfQK9xtxVL5KUO4fY/012Vas.', 'SENIOR_LAB_TECHNICIAN', TRUE, FALSE, NOW(), NOW());

-- 2. TEST CATALOG MODULE
CREATE TABLE container_types (
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
('CT006', 'Swab Container', 'S', 'Microbiology swabs', 'Transport medium', true, NOW(), NOW());

CREATE TABLE lab_tests (
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
CREATE TABLE sample_groups (
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

CREATE TABLE test_parameters (
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
CREATE TABLE patients (
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
CREATE TABLE test_orders (
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

CREATE TABLE order_tests (
    id                   BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id             BIGINT NOT NULL,
    test_id              BIGINT NOT NULL,
    test_sample_code     VARCHAR(50) NOT NULL UNIQUE,     -- e.g. TSC-00456-01
    sticker_set_number   VARCHAR(10) NULL,                -- e.g. '0001' allocated at collection
    FOREIGN KEY (order_id) REFERENCES test_orders(id) ON DELETE CASCADE,
    FOREIGN KEY (test_id) REFERENCES lab_tests(id)
);

-- 5. SPECIMEN CONTAINERS
CREATE TABLE containers (
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
CREATE TABLE test_results (
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

CREATE TABLE result_values (
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
