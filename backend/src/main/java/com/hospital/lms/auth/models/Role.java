package com.hospital.lms.auth.models;

/**
 * All user roles in the system.
 * These are used by Spring Security for Role-Based Access Control (RBAC).
 */
public enum Role {
    ADMIN,
    RECEPTIONIST,
    LAB_TECHNICIAN,
    SENIOR_LAB_TECHNICIAN
}
