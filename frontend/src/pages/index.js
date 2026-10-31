/**
 * Central Barrel Export for all Pages in the Hospital Lab Management System.
 * 
 * Pages are organized by User Role:
 * - auth/       -> Authentication (Login, Change Password)
 * - admin/      -> Administrator (Staff Management, Test Catalog, Admin Dashboard)
 * - technician/ -> Lab Technician / Receptionist (Reception, Result Entry, Tech Dashboard, Patient History)
 * - senior-tech/-> Senior Lab Tech (Verification Queue, Senior Tech Dashboard)
 * - shared/     -> Shared / Common (Dynamic Role Dashboard, UI Showcase)
 */

// Auth Pages
export { LoginPage, ChangePasswordPage } from './auth';

// Admin Pages
export { AdminDashboardPage, AdminUserManagementPage, TestCatalogPage } from './admin';

// Lab Technician Pages
export { TechDashboardPage, ReceptionPage, ResultEntryPage, PatientHistoryPage } from './technician';

// Senior Lab Technician Pages
export { SeniorTechDashboardPage, VerificationQueuePage } from './senior-tech';

// Shared Pages
export { DashboardPage, ComponentShowcasePage } from './shared';
