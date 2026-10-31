package com.hospital.lms.auth.repositories;

import com.hospital.lms.auth.models.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * The Repository (Pantry) for the User entity.
 * Handles all database operations for the users table.
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    // Spring automatically generates the SQL query to find a user by their username
    Optional<User> findByUsername(String username);
    boolean existsByUsername(String username);
}
