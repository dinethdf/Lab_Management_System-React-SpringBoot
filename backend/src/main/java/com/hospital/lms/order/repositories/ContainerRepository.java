package com.hospital.lms.order.repositories;

import com.hospital.lms.order.models.Container;
import com.hospital.lms.order.models.Container.ContainerStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA repository for specimen containers.
 * Provides lookup methods for barcode linking, slip resolution, and status tracking.
 */
@Repository
public interface ContainerRepository extends JpaRepository<Container, Long> {

    // Resolves a container by its physical pre-printed sticker code (e.g. "SC00001" or "FBC-0001-P1")
    Optional<Container> findByContainerCode(String containerCode);
    Optional<Container> findByContainerCodeIgnoreCase(String containerCode);

    // Checks whether an entered sticker code is already attached to any container in the system
    boolean existsByContainerCode(String containerCode);

    // Fetches all containers for a given order test
    List<Container> findByOrderTest_Id(Long orderTestId);

    // Fetches all containers for a given test order
    List<Container> findByOrderTest_TestOrder_Id(Long orderId);

    // Fetches all containers by lab slip barcode
    List<Container> findByOrderTest_TestOrder_LabSlipBarcode(String labSlipBarcode);

    // Fetches all containers matching a specific lifecycle status (e.g. PENDING_COLLECTION)
    List<Container> findByStatus(ContainerStatus status);
}
