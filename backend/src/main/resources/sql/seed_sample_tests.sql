-- ============================================================================
-- Hospital Lab Management System (LMS) — Seed Sample Diagnostic Tests
-- Inserts 3 realistic diagnostic tests: FBC, FBS, and UFR.
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
