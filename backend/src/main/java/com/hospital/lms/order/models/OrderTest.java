package com.hospital.lms.order.models;

import com.hospital.lms.catalog.models.LabTest;

import jakarta.persistence.*;
import lombok.Data;
import com.fasterxml.jackson.annotation.JsonIgnore;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "order_tests")
@Data
public class OrderTest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "order_id", nullable = false)
    @JsonIgnore
    private TestOrder testOrder;

    @ManyToOne
    @JoinColumn(name = "test_id", nullable = false)
    private LabTest test;

    @Column(name = "test_sample_code", nullable = false, unique = true)
    private String testSampleCode;

    // Allocated 4-digit sticker set code (e.g. "0001")
    @Column(name = "sticker_set_number", length = 10)
    private String stickerSetNumber;

    // Specimen container slots required for this diagnostic test
    @OneToMany(mappedBy = "orderTest", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Container> containers = new ArrayList<>();

    public void addContainer(Container container) {
        containers.add(container);
        container.setOrderTest(this);
    }
}
