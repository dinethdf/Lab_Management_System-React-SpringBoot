package com.hospital.lms.result.models;

import com.hospital.lms.auth.models.User;

import com.hospital.lms.catalog.models.TestParameter;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "results")
@Data
public class Result {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "container_id", nullable = false)
    private Long containerId; // Using ID directly to avoid depending on Phase 4 entity

    @ManyToOne
    @JoinColumn(name = "test_parameter_id", nullable = false)
    private TestParameter testParameter;

    @Column(nullable = false)
    private String value;

    @Column(name = "is_abnormal")
    private Boolean isAbnormal;

    @Column(nullable = false)
    private String status; // DRAFT, SUBMITTED, APPROVED, REJECTED

    @ManyToOne
    @JoinColumn(name = "entered_by", nullable = false)
    private User enteredBy;

    @ManyToOne
    @JoinColumn(name = "approved_by")
    private User approvedBy;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;
}
