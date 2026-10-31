package com.hospital.lms.order.repositories;

import com.hospital.lms.order.models.TestOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TestOrderRepository extends JpaRepository<TestOrder, Long> {
    Optional<TestOrder> findByLabSlipBarcode(String labSlipBarcode);
    
    // Finds all past lab test orders for a given patient, ordered by creation date newest first
    List<TestOrder> findByPatientIdOrderByCreatedAtDesc(Long patientId);

    // Finds orders by lifecycle status (PENDING, IN_PROGRESS, COMPLETED)
    List<TestOrder> findByStatus(String status);
    List<TestOrder> findByStatusInOrderByCreatedAtDesc(List<String> statuses);

    // Custom query to get the count of orders today (for barcode generation)
    long count();
}
