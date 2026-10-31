package com.hospital.lms.result.models;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.hospital.lms.catalog.models.TestParameter;
import com.hospital.lms.catalog.models.TestParameter.ResultType;
import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "result_values")
@Data
public class ResultValue {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "test_result_id", nullable = false)
    @JsonIgnore
    private TestResult testResult;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parameter_id", nullable = false)
    private TestParameter parameter;

    @Column(name = "parameter_name", nullable = false, length = 255)
    private String parameterName;

    @Column(name = "parameter_unit", length = 100)
    private String parameterUnit;

    @Enumerated(EnumType.STRING)
    @Column(name = "result_type", nullable = false)
    private ResultType resultType;

    @Column(name = "numeric_value", precision = 12, scale = 4)
    private BigDecimal numericValue;

    @Column(name = "text_value", columnDefinition = "TEXT")
    private String textValue;

    @Column(name = "choice_value", length = 100)
    private String choiceValue;

    @Column(name = "ref_lower", precision = 10, scale = 4)
    private BigDecimal refLower;

    @Column(name = "ref_upper", precision = 10, scale = 4)
    private BigDecimal refUpper;

    @Column(name = "critical_low", precision = 10, scale = 4)
    private BigDecimal criticalLow;

    @Column(name = "critical_high", precision = 10, scale = 4)
    private BigDecimal criticalHigh;

    @Column(name = "is_abnormal", nullable = false)
    private Boolean isAbnormal = false;

    @Column(name = "is_critical", nullable = false)
    private Boolean isCritical = false;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    private Long createdBy;
    private Long updatedBy;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
