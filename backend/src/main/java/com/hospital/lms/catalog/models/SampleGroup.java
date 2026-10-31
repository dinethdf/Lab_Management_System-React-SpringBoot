package com.hospital.lms.catalog.models;

import jakarta.persistence.*;
import lombok.Data;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.time.LocalDateTime;

@Entity
@Table(name = "sample_groups")
@Data
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class SampleGroup {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "test_id", nullable = false)
    @JsonIgnore
    private LabTest test;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SampleType sampleType;

    @ManyToOne
    @JoinColumn(name = "container_type_id", nullable = false)
    private ContainerType containerType;

    @Column(nullable = false)
    private Integer numContainers = 1;

    @Column(nullable = false)
    private Integer dayOffset = 0;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    private Long createdBy;
    private Long updatedBy;

    public enum SampleType {
        BLOOD_VENOUS, BLOOD_CAPILLARY, URINE_SPOT, URINE_24HR, SWAB, STOOL, SPUTUM, CSF, OTHER
    }

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
