package com.hospital.lms.order.repositories;

import com.hospital.lms.order.models.OrderTest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OrderTestRepository extends JpaRepository<OrderTest, Long> {
    Optional<OrderTest> findByTestSampleCode(String testSampleCode);
    Optional<OrderTest> findByTest_IdAndStickerSetNumber(Long testId, String stickerSetNumber);
    boolean existsByTest_IdAndStickerSetNumber(Long testId, String stickerSetNumber);
}
