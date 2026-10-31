package com.hospital.lms.auth.services;

import com.hospital.lms.auth.dtos.RegisterUserRequest;
import com.hospital.lms.auth.dtos.ResetPasswordResponse;
import com.hospital.lms.auth.dtos.UserResponse;
import com.hospital.lms.auth.models.Role;
import com.hospital.lms.auth.models.User;
import com.hospital.lms.auth.repositories.UserRepository;
import com.hospital.lms.config.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

public class AuthServiceTest {

    private UserRepository userRepository;
    private PasswordEncoder passwordEncoder;
    private JwtUtil jwtUtil;
    private AuthService authService;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        passwordEncoder = mock(PasswordEncoder.class);
        jwtUtil = mock(JwtUtil.class);

        when(passwordEncoder.encode(anyString())).thenAnswer(inv -> "hashed_" + inv.getArgument(0));

        authService = new AuthService(userRepository, passwordEncoder, jwtUtil);
    }

    @Test
    @DisplayName("Admin can register a new staff member with temporary password and mustChangePassword = true")
    void testRegisterUser_Success() {
        RegisterUserRequest req = new RegisterUserRequest();
        req.setUsername("sarah.tech@hospital.com");
        req.setRole(Role.LAB_TECHNICIAN);
        req.setPassword("TempPass123!");

        when(userRepository.existsByUsername("sarah.tech@hospital.com")).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId(99L);
            return u;
        });

        UserResponse response = authService.registerUser(req);

        assertNotNull(response);
        assertEquals("sarah.tech@hospital.com", response.getUsername());
        assertEquals(Role.LAB_TECHNICIAN, response.getRole());
        assertTrue(response.getIsActive());
        assertTrue(response.getMustChangePassword());
        assertEquals("TempPass123!", response.getTemporaryPassword());
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    @DisplayName("Staff member can change temporary password on mandatory first login")
    void testChangePassword_Success() {
        User user = new User();
        user.setId(5L);
        user.setUsername("sarah.tech@hospital.com");
        user.setPasswordHash("hashed_temp");
        user.setMustChangePassword(true);

        when(userRepository.findByUsername("sarah.tech@hospital.com")).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        authService.changePassword("sarah.tech@hospital.com", "MyNewSecretPassword99!");

        assertEquals("hashed_MyNewSecretPassword99!", user.getPasswordHash());
        assertFalse(user.getMustChangePassword()); // Flag cleared!
        verify(userRepository, times(1)).save(user);
    }

    @Test
    @DisplayName("Admin can disable and re-enable a staff account but cannot disable own account")
    void testUpdateUserStatus() {
        User staff = new User();
        staff.setId(12L);
        staff.setUsername("receptionist2@gmail.com");
        staff.setIsActive(true);

        when(userRepository.findById(12L)).thenReturn(Optional.of(staff));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        // Disable account
        UserResponse disabled = authService.updateUserStatus(12L, false, "admin@gmail.com");
        assertFalse(disabled.getIsActive());

        // Self-disable blocked
        User admin = new User();
        admin.setId(1L);
        admin.setUsername("admin@gmail.com");
        admin.setIsActive(true);
        when(userRepository.findById(1L)).thenReturn(Optional.of(admin));

        assertThrows(IllegalArgumentException.class, () -> {
            authService.updateUserStatus(1L, false, "admin@gmail.com");
        });
    }

    @Test
    @DisplayName("Admin can reset staff password and issue a temporary password requiring change on next login")
    void testResetPassword() {
        User staff = new User();
        staff.setId(15L);
        staff.setUsername("juniorlabtech@hospital.com");
        staff.setPasswordHash("old_hash");
        staff.setMustChangePassword(false);

        when(userRepository.findById(15L)).thenReturn(Optional.of(staff));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        ResetPasswordResponse response = authService.resetPassword(15L, "NewTemp9988!");

        assertNotNull(response);
        assertEquals("NewTemp9988!", response.getTemporaryPassword());
        assertTrue(staff.getMustChangePassword());
        assertEquals("hashed_NewTemp9988!", staff.getPasswordHash());
    }
}
