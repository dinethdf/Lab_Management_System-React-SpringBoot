package com.hospital.lms.auth.services;

import com.hospital.lms.auth.dtos.*;
import com.hospital.lms.auth.models.User;
import com.hospital.lms.auth.repositories.UserRepository;
import com.hospital.lms.config.JwtUtil;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.List;
import java.util.stream.Collectors;

/**
 * The Chef for Authentication and Staff User Management.
 * Contains the business logic to verify passwords, issue tokens, and manage users.
 */
@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    /**
     * Checks the user's credentials and returns a Token if they are correct.
     */
    public AuthResponse login(AuthRequest request) {
        // 1. Find the user in the database (Pantry)
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("Invalid username or password."));

        // 2. Check if the user account is active
        if (!user.getIsActive()) {
            throw new IllegalArgumentException("Account is disabled. Please contact the Admin.");
        }

        // 3. Check if the password matches the hash in the database
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid username or password.");
        }

        // 4. Password is correct! Generate a JWT (Digital ID card)
        String token = jwtUtil.generateToken(user.getUsername(), user.getRole().name());

        // 5. Return the token, role, and mustChangePassword flag to React
        return new AuthResponse(token, user.getRole().name(), user.getMustChangePassword());
    }

    /**
     * Returns a list of all users without sensitive fields (safe for Admin view).
     */
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream().map(user -> new UserResponse(
                user.getId(),
                user.getUsername(),
                user.getRole(),
                user.getIsActive(),
                user.getMustChangePassword(),
                user.getCreatedAt()
        )).collect(Collectors.toList());
    }

    /**
     * Creates a new staff member account.
     * Sets must_change_password to true so the user is forced to change it on their first login.
     */
    @Transactional
    public UserResponse registerUser(RegisterUserRequest request) {
        if (request.getUsername() == null || request.getUsername().trim().isEmpty()) {
            throw new IllegalArgumentException("Username / Email cannot be empty.");
        }
        if (request.getRole() == null) {
            throw new IllegalArgumentException("A valid staff role must be selected.");
        }

        String username = request.getUsername().trim().toLowerCase();
        if (userRepository.existsByUsername(username)) {
            throw new IllegalArgumentException("A user with username '" + username + "' already exists.");
        }

        String rawPassword = request.getPassword();
        if (rawPassword == null || rawPassword.trim().isEmpty()) {
            // Auto-generate temporary password if not provided
            rawPassword = generateRandomPassword();
        } else if (rawPassword.trim().length() < 6) {
            throw new IllegalArgumentException("Temporary password must be at least 6 characters.");
        }

        User user = new User();
        user.setUsername(username);
        user.setPasswordHash(passwordEncoder.encode(rawPassword.trim()));
        user.setRole(request.getRole());
        user.setIsActive(true);
        user.setMustChangePassword(true);

        User saved = userRepository.save(user);

        UserResponse response = new UserResponse(
                saved.getId(),
                saved.getUsername(),
                saved.getRole(),
                saved.getIsActive(),
                saved.getMustChangePassword(),
                saved.getCreatedAt()
        );
        response.setTemporaryPassword(rawPassword.trim());
        return response;
    }

    /**
     * Allows an authenticated user to change their own password (e.g., during mandatory first login).
     */
    @Transactional
    public void changePassword(String username, String newPassword) {
        if (newPassword == null || newPassword.trim().length() < 6) {
            throw new IllegalArgumentException("New password must be at least 6 characters long.");
        }

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + username));

        user.setPasswordHash(passwordEncoder.encode(newPassword.trim()));
        user.setMustChangePassword(false);
        userRepository.save(user);
    }

    /**
     * Allows an Administrator to enable or disable a staff member's account.
     * Prevents an admin from accidentally disabling their own current account.
     */
    @Transactional
    public UserResponse updateUserStatus(Long userId, Boolean isActive, String currentUsername) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Staff user not found with ID: " + userId));

        if (user.getUsername().equalsIgnoreCase(currentUsername) && Boolean.FALSE.equals(isActive)) {
            throw new IllegalArgumentException("Action blocked: You cannot disable your own active administrator account.");
        }

        user.setIsActive(Boolean.TRUE.equals(isActive));
        User saved = userRepository.save(user);

        return new UserResponse(
                saved.getId(),
                saved.getUsername(),
                saved.getRole(),
                saved.getIsActive(),
                saved.getMustChangePassword(),
                saved.getCreatedAt()
        );
    }

    /**
     * Allows an Administrator to reset a staff user's password and issue a new temporary password.
     * Sets mustChangePassword to true so they are forced to change it upon next login.
     */
    @Transactional
    public ResetPasswordResponse resetPassword(Long userId, String customTempPassword) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Staff user not found with ID: " + userId));

        String tempPassword = (customTempPassword != null && !customTempPassword.trim().isEmpty())
                ? customTempPassword.trim()
                : generateRandomPassword();

        if (tempPassword.length() < 6) {
            throw new IllegalArgumentException("Temporary password must be at least 6 characters long.");
        }

        user.setPasswordHash(passwordEncoder.encode(tempPassword));
        user.setMustChangePassword(true);
        userRepository.save(user);

        return new ResetPasswordResponse(
                "Temporary password issued for " + user.getUsername() + ". They must change it upon their next login.",
                tempPassword
        );
    }

    /**
     * Helper to generate a friendly, secure temporary password (e.g. Temp5842!).
     */
    private String generateRandomPassword() {
        SecureRandom random = new SecureRandom();
        int digits = 1000 + random.nextInt(9000); // 4-digit number
        return "Temp" + digits + "!";
    }
}
