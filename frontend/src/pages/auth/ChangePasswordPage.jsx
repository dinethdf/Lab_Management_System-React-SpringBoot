import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound } from 'lucide-react';
import authService from '../../services/authService';
import { FormInput, Button, ErrorAlert, SuccessAlert } from '../../components/ui';

/**
 * ChangePasswordPage — Mandatory temporary password update screen.
 *
 * Implements business rule (TASK-001):
 * - Newly registered staff with temporary passwords must update their password
 *   before proceeding to any application workspace.
 * - Restyled with Tailwind CSS and the common component library.
 */
const ChangePasswordPage = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Guard: ensure user is authenticated before allowing password reset
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please verify both fields.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      await authService.changePassword(newPassword);
      localStorage.setItem('isTempPassword', 'false');
      setSuccess('Password updated successfully! Redirecting to your dashboard...');

      // Redirect to dashboard after brief visual confirmation
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6FA] flex flex-col justify-center items-center p-4">
      {/* Centered Card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        {/* Header with Key Icon */}
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center mb-3 shadow-md shadow-amber-500/20">
            <KeyRound size={26} strokeWidth={2.5} />
          </div>
          <h1 className="text-xl font-bold text-gray-800 tracking-tight">
            Change Password
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            You must set a new personal password before accessing the system.
          </p>
        </div>

        {/* Feedback Banners */}
        {error && (
          <div className="mb-4">
            <ErrorAlert
              title="Password Update Failed"
              message={error}
              onDismiss={() => setError('')}
            />
          </div>
        )}

        {success && (
          <div className="mb-4">
            <SuccessAlert
              title="Success"
              message={success}
              autoDismiss={0}
            />
          </div>
        )}

        {/* Password Form */}
        <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
          <FormInput
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="At least 6 characters"
            required
            autoFocus
          />

          <FormInput
            label="Confirm New Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter your new password"
            required
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            disabled={Boolean(success)}
            className="w-full mt-2"
          >
            Update Password & Continue
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordPage;
