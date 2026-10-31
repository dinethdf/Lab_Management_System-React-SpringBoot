package com.hospital.lms.auth.controllers;

import com.hospital.lms.auth.dtos.*;
import com.hospital.lms.auth.services.AuthService;
import com.hospital.lms.common.dtos.MessageResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

/**
 * Controller for Authentication and Staff User Management.
 * Receives requests from the React frontend and delegates to AuthService.
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    /**
     * Endpoint to log in a user.
     * React sends a POST request here with username and password.
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthRequest request) {
        try {
            AuthResponse response = authService.login(request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(401).body(new MessageResponse(e.getMessage()));
        }
    }

    /**
     * Endpoint to list all registered users (for Admin User Management).
     */
    @GetMapping("/users")
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        return ResponseEntity.ok(authService.getAllUsers());
    }

    /**
     * Endpoint for Admin to create a new staff account.
     */
    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody RegisterUserRequest request) {
        try {
            UserResponse response = authService.registerUser(request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }

    /**
     * Endpoint for an authenticated user to change their password (e.g. mandatory first-login change).
     */
    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody ChangePasswordRequest request, Principal principal) {
        try {
            if (principal == null || principal.getName() == null) {
                return ResponseEntity.status(401).body(new MessageResponse("Unauthorized. Please log in first."));
            }
            authService.changePassword(principal.getName(), request.getNewPassword());
            return ResponseEntity.ok(new MessageResponse("Password updated successfully."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse("Failed to update password: " + e.getMessage()));
        }
    }

    /**
     * Endpoint for Admin to enable or disable a staff member's account.
     */
    @PatchMapping("/users/{id}/status")
    public ResponseEntity<?> updateUserStatus(@PathVariable Long id,
                                              @RequestBody UpdateUserStatusRequest request,
                                              Principal principal) {
        try {
            String currentUsername = principal != null ? principal.getName() : "";
            UserResponse response = authService.updateUserStatus(id, request.getIsActive(), currentUsername);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse("Failed to update status: " + e.getMessage()));
        }
    }

    /**
     * Endpoint for Admin to reset a staff member's password and issue a new temporary password.
     */
    @PostMapping("/users/{id}/reset-password")
    public ResponseEntity<?> resetPassword(@PathVariable Long id,
                                          @RequestBody(required = false) ResetPasswordRequest request) {
        try {
            String customTemp = request != null ? request.getTemporaryPassword() : null;
            ResetPasswordResponse response = authService.resetPassword(id, customTemp);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse("Failed to reset password: " + e.getMessage()));
        }
    }
}
