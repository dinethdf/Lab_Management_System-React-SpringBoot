import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Role-based Page Imports
import { LoginPage, ChangePasswordPage } from './pages/auth';
import { AdminUserManagementPage, TestCatalogPage } from './pages/admin';
import { ReceptionPage, ResultEntryPage, PatientHistoryPage, SampleCollectionPage } from './pages/technician';
import { VerificationQueuePage } from './pages/senior-tech';
import { DashboardPage, ComponentShowcasePage } from './pages/shared';

// Global Toast Notifications
import { ToastProvider } from './context/ToastContext';
import { ToastContainer } from './components/ui';

// A simple PrivateRoute component to protect routes
const PrivateRoute = ({ children, requiredRole, allowedRoles }) => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role')?.toUpperCase();
  const isTempPassword = localStorage.getItem('isTempPassword') === 'true';
  
  if (!token) {
    return <Navigate to="/login" />;
  }
  
  if (isTempPassword) {
    return <Navigate to="/change-password" />;
  }
  
  // If a specific role is required and user doesn't have it, redirect to dashboard
  if (requiredRole && role !== requiredRole?.toUpperCase()) {
    return <Navigate to="/" />;
  }

  // If a list of allowed roles is given, ensure user's role is in the list
  if (allowedRoles && !allowedRoles.map(r => r.toUpperCase()).includes(role)) {
    return <Navigate to="/" />;
  }
  
  return children;
};

function App() {
  return (
    <ToastProvider>
      <ToastContainer />
      <Router>
        <Routes>
        {/* ======================================================== */}
        {/* 1. PUBLIC & AUTHENTICATION ROUTES                         */}
        {/* ======================================================== */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/change-password" element={<ChangePasswordPage />} />
        
        {/* ======================================================== */}
        {/* 2. SHARED DASHBOARD (Dynamic Role-based Routing)          */}
        {/* ======================================================== */}
        <Route 
          path="/" 
          element={
            <PrivateRoute>
              <DashboardPage />
            </PrivateRoute>
          } 
        />

        {/* ======================================================== */}
        {/* 3. ADMINISTRATOR ROUTES (Protected: ADMIN only)           */}
        {/* ======================================================== */}
        <Route 
          path="/admin/users" 
          element={
            <PrivateRoute requiredRole="ADMIN">
              <AdminUserManagementPage />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/tests" 
          element={
            <PrivateRoute requiredRole="ADMIN">
              <TestCatalogPage />
            </PrivateRoute>
          } 
        />

        {/* ======================================================== */}
        {/* 4. LAB TECHNICIAN ROUTES (Reception & Result Entry)       */}
        {/* ======================================================== */}
        <Route 
          path="/reception" 
          element={
            <PrivateRoute>
              <ReceptionPage />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/patients/:id" 
          element={
            <PrivateRoute>
              <PatientHistoryPage />
            </PrivateRoute>
          } 
        />
        {/* Sample Collection Route (Restricted from Receptionist) */}
        <Route 
          path="/collection" 
          element={
            <PrivateRoute allowedRoles={['ADMIN', 'LAB_TECHNICIAN', 'SENIOR_LAB_TECHNICIAN']}>
              <SampleCollectionPage />
            </PrivateRoute>
          } 
        />
        {/* Result Entry Route (Restricted from Receptionist) */}
        <Route 
          path="/results/entry" 
          element={
            <PrivateRoute allowedRoles={['ADMIN', 'LAB_TECHNICIAN', 'SENIOR_LAB_TECHNICIAN']}>
              <ResultEntryPage />
            </PrivateRoute>
          } 
        />

        {/* ======================================================== */}
        {/* 5. SENIOR LAB TECH ROUTES (Verification & Approvals)      */}
        {/* ======================================================== */}
        <Route 
          path="/verification-queue" 
          element={
            <PrivateRoute>
              <VerificationQueuePage />
            </PrivateRoute>
          } 
        />

        {/* ======================================================== */}
        {/* 6. DEVELOPER / UI SHOWCASE PLAYGROUND                    */}
        {/* ======================================================== */}
        <Route path="/components" element={<ComponentShowcasePage />} />
        
        {/* Catch-all for unknown URLs */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  </ToastProvider>
  );
}

export default App;
