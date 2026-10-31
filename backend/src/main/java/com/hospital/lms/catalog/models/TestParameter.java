package com.hospital.lms.catalog.models;

import jakarta.persistence.*;
import lombok.Data;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "test_parameters")
@Data
public class TestParameter {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "test_id", nullable = false)
    @JsonIgnore
    private LabTest test;

    @Column(nullable = false, length = 200)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "result_type", nullable = false)
    private ResultType resultType = ResultType.NUMBER;

    @Column(length = 50)
    private String unit;

    @Column(name = "decimal_places")
    private Integer decimalPlaces;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sample_group_id")
    @JsonIgnore
    private SampleGroup sampleGroup;

    @Column(nullable = false)
    private Integer sortOrder = 1;

    @Column(nullable = false)
    private Boolean isActive = true;

    // Male Reference Range & Critical Limits
    @Column(name = "male_min_range", precision = 10, scale = 4)
    private BigDecimal maleMinRange;

    @Column(name = "male_max_range", precision = 10, scale = 4)
    private BigDecimal maleMaxRange;

    @Column(name = "male_critical_low", precision = 10, scale = 4)
    private BigDecimal maleCriticalLow;

    @Column(name = "male_critical_high", precision = 10, scale = 4)
    private BigDecimal maleCriticalHigh;

    // Female Reference Range & Critical Limits
    @Column(name = "female_min_range", precision = 10, scale = 4)
    private BigDecimal femaleMinRange;

    @Column(name = "female_max_range", precision = 10, scale = 4)
    private BigDecimal femaleMaxRange;

    @Column(name = "female_critical_low", precision = 10, scale = 4)
    private BigDecimal femaleCriticalLow;

    @Column(name = "female_critical_high", precision = 10, scale = 4)
    private BigDecimal femaleCriticalHigh;

    // For CHOICE Parameters: comma-separated lists
    @Column(name = "possible_options", columnDefinition = "TEXT")
    private String possibleOptions;

    @Column(name = "abnormal_options", columnDefinition = "TEXT")
    private String abnormalOptions;

    public enum ResultType {
        NUMBER, TEXT, CHOICE
    }

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
