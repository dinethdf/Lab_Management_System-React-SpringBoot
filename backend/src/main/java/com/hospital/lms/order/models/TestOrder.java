package com.hospital.lms.order.models;

import com.hospital.lms.patient.models.Patient;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "test_orders")
@Data
public class TestOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @Column(name = "lab_slip_barcode", nullable = false, unique = true)
    private String labSlipBarcode;

    @Column(nullable = false)
    private String status; // PENDING, IN_PROGRESS, COMPLETED

    @OneToMany(mappedBy = "testOrder", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderTest> orderTests = new ArrayList<>();

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public void addOrderTest(OrderTest orderTest) {
        orderTests.add(orderTest);
        orderTest.setTestOrder(this);
    }
}
