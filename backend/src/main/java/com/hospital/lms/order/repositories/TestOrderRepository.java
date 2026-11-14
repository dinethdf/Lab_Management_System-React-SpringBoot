package com.hospital.lms.order.repositories;

import com.hospital.lms.order.models.TestOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface TestOrderRepository extends JpaRepository<TestOrder, Long> {
    Optional<TestOrder> findByLabSlipBarcode(String labSlipBarcode);
    
    // Finds all past lab test orders for a given patient, ordered by creation date newest first
    List<TestOrder> findByPatientIdOrderByCreatedAtDesc(Long patientId);

    // Finds orders by lifecycle status (PENDING, IN_PROGRESS, COMPLETED, REPORTED)
    List<TestOrder> findByStatus(String status);
    List<TestOrder> findByStatusInOrderByCreatedAtDesc(List<String> statuses);

    // Count orders created on or after a given timestamp
    long countByCreatedAtGreaterThanEqual(LocalDateTime dateTime);

    // Count orders by status
    long countByStatus(String status);

    // Latest 5 orders for real activity feed
    List<TestOrder> findTop5ByOrderByCreatedAtDesc();

    // Total count of orders
    long count();
}
