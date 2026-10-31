package com.hospital.lms.order.models;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.hospital.lms.catalog.models.SampleGroup;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Entity representing a physical specimen container slot for an ordered diagnostic test.
 *
 * Lifecycle:
 * 1. PENDING_COLLECTION : Tube slot created when order is placed, waiting for patient.
 * 2. COLLECTED          : Phlebotomist draws sample and links pre-printed sticker (SC00001).
 * 3. RECEIVED_AT_LAB    : Sample arrives at analytical bench and is accepted.
 * 4. RESULT_ENTERED     : Lab Tech enters test values for this specimen.
 * 5. VERIFIED           : Senior Lab Tech approves final report.
 * 6. REJECTED           : Sample rejected at bench due to quality defect (hemolyzed, clotted, etc.).
 */
@Entity
@Table(name = "containers")
@Data
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Container {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // The order test this container is assigned to
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_test_id", nullable = false)
    @JsonIgnore
    private OrderTest orderTest;

    // The catalog sample group defining container type (e.g. EDTA Tube) and sample type
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "sample_group_id", nullable = false)
    private SampleGroup sampleGroup;

    // Pre-printed sticker sequential barcode (e.g. FBC-0001-P1).
    // Nullable initially until set number (e.g. 0001) is allocated at sample collection.
    @Column(name = "container_code", length = 50, unique = true)
    private String containerCode;

    // Visit offset: 0 for today's collection, 1+ for future-day scheduled visits
    @Column(name = "day_offset", nullable = false)
    private Integer dayOffset = 0;

    // Due date for sample collection (calculated from order creation date + day_offset).
    // Used to block future-day samples from being collected too early.
    @Column(name = "due_date")
    private java.time.LocalDate dueDate;

    // Link to an earlier rejected container if this container was created as a replacement
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "replacement_for_container_id")
    @JsonIgnore
    private Container replacementForContainer;

    // Sequence index for tests requiring multiple containers of the same type (e.g. 1 of 2)
    @Column(name = "container_sequence", nullable = false)
    private Integer containerSequence = 1;

    // Current lifecycle status of this specimen container
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private ContainerStatus status = ContainerStatus.PENDING_COLLECTION;

    // Phlebotomy collection tracking
    @Column(name = "collected_at")
    private LocalDateTime collectedAt;

    @Column(name = "collected_by")
    private Long collectedBy;

    // Bench receipt tracking
    @Column(name = "received_at")
    private LocalDateTime receivedAt;

    @Column(name = "received_by")
    private Long receivedBy;

    // Specimen quality rejection tracking
    @Column(name = "rejected_at")
    private LocalDateTime rejectedAt;

    @Column(name = "rejection_reason", length = 255)
    private String rejectionReason;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public enum ContainerStatus {
        PENDING_COLLECTION,
        COLLECTED,
        RECEIVED_AT_LAB,
        RESULT_ENTERED,
        VERIFIED,
        REJECTED
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.status == null) {
            this.status = ContainerStatus.PENDING_COLLECTION;
        }
        if (this.dayOffset == null) {
            this.dayOffset = 0;
        }
        if (this.containerSequence == null) {
            this.containerSequence = 1;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
