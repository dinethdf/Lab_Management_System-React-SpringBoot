import React from 'react';
import { Navigate } from 'react-router-dom';
import AdminDashboardPage from '../admin/AdminDashboardPage';
import TechDashboardPage from '../technician/TechDashboardPage';
import SeniorTechDashboardPage from '../senior-tech/SeniorTechDashboardPage';
import { ROLES } from '../../constants';

/**
 * DashboardPage — Dynamic Role-Based Router for the Dashboard home route ("/").
 *
 * Directs each authenticated staff member to their specialized workspace:
 * - ADMIN: System-wide analytics, staff management, and lab test catalog oversight.
 * - SENIOR_LAB_TECHNICIAN: Supervisory command center emphasizing verification queue sign-offs.
 * - RECEPTIONIST: Directs immediately to Reception Desk (/reception).
 * - LAB_TECHNICIAN: Analytical workbench focusing on barcode scanning and result entry.
 */
const DashboardPage = () => {
  const role = localStorage.getItem('role')?.toUpperCase();

  // Route according to the authenticated user's role
  if (role === ROLES.ADMIN) {
    return <AdminDashboardPage />;
  }

  if (role === ROLES.SENIOR_LAB_TECHNICIAN) {
    return <SeniorTechDashboardPage />;
  }

  if (role === ROLES.RECEPTIONIST) {
    return <Navigate to="/reception" replace />;
  }

  // Default to Lab Technician Workbench
  return <TechDashboardPage />;
};

export default DashboardPage;
