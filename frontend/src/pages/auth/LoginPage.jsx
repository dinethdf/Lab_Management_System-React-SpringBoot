import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity } from 'lucide-react';
import authService from '../../services/authService';
import { FormInput, Button, ErrorAlert } from '../../components/ui';

/**
 * LoginPage — Authentication screen for lab staff and administrators.
 *
 * Fully restyled with Tailwind CSS and the common component library:
 * - Uses FormInput with built-in password visibility toggle
 * - Uses Button with loading spinner state
 * - Uses ErrorAlert with retry/dismiss
 */
const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Call authentication service
      const response = await authService.login(username, password);

      // Store token and role in localStorage
      localStorage.setItem('token', response.token);
      localStorage.setItem('role', response.role);
      localStorage.setItem('username', username);
      localStorage.setItem('isTempPassword', response.isTempPassword);

      // Check temporary password requirement (must change before dashboard access)
      if (response.isTempPassword) {
        navigate('/change-password');
      } else {
        navigate('/'); // Redirect to dashboard
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6FA] flex flex-col justify-center items-center p-4">
      {/* Centered Login Card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center mb-3 shadow-md shadow-blue-500/20">
            <Activity size={26} strokeWidth={2.5} />
          </div>
          <h1 className="text-xl font-bold text-gray-800 tracking-tight">
            Hospital Lab System
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Sign in to access your laboratory workspace
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6">
            <ErrorAlert
              title="Authentication Error"
              message={error}
              onDismiss={() => setError('')}
            />
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <FormInput
            label="Username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
            required
            autoFocus
          />

          <FormInput
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            className="w-full mt-2"
          >
            Sign In
          </Button>
        </form>

        {/* Footer info note */}
        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400">
            Final Year Project • Hospital Laboratory Management System
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
