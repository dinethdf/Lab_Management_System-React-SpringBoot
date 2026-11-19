package com.hospital.lms.result.repositories;

import com.hospital.lms.result.models.ReportAccessSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Repository interface for managing public report portal access sessions.
 */
@Repository
public interface ReportAccessSessionRepository extends JpaRepository<ReportAccessSession, Long> {

    /**
     * Finds an access session by its secret session token.
     * Used to validate PDF stream requests from the patient portal.
     */
    Optional<ReportAccessSession> findBySessionToken(String sessionToken);

    /**
     * Deletes expired access sessions for database housekeeping.
     */
    void deleteByExpiresAtBefore(LocalDateTime cutoff);
}
