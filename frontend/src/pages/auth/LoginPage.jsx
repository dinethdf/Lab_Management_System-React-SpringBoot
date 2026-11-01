import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, ShieldCheck, FlaskConical, CheckCircle2, UserCheck, Sparkles } from 'lucide-react';
import authService from '../../services/authService';
import { FormInput, Button, ErrorAlert } from '../../components/ui';

/**
 * Predefined demo accounts for quick role-based testing and viva presentations.
 * Clicking any role button automatically populates the username & password fields.
 */
const DEMO_ROLES = [
  {
    roleName: 'Admin',
    email: 'admin@gmail.com',
    password: 'admin123',
    icon: ShieldCheck,
    color: 'hover:border-purple-300 hover:bg-purple-50/50 text-purple-700 bg-purple-50/30 border-purple-100',
    activeColor: 'border-purple-500 bg-purple-50 ring-2 ring-purple-400/20 text-purple-800',
  },
  {
    roleName: 'Senior Lab Tech',
    email: 'seniorlabtech@gmail.com',
    password: 'admin123',
    icon: CheckCircle2,
    color: 'hover:border-indigo-300 hover:bg-indigo-50/50 text-indigo-700 bg-indigo-50/30 border-indigo-100',
    activeColor: 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-400/20 text-indigo-800',
  },
  {
    roleName: 'Lab Technician',
    email: 'labtech@gmail.com',
    password: 'admin123',
    icon: FlaskConical,
    color: 'hover:border-blue-300 hover:bg-blue-50/50 text-blue-700 bg-blue-50/30 border-blue-100',
    activeColor: 'border-blue-500 bg-blue-50 ring-2 ring-blue-400/20 text-blue-800',
  },
  {
    roleName: 'Receptionist',
    email: 'receptionist@gmail.com',
    password: 'admin123',
    icon: UserCheck,
    color: 'hover:border-teal-300 hover:bg-teal-50/50 text-teal-700 bg-teal-50/30 border-teal-100',
    activeColor: 'border-teal-500 bg-teal-50 ring-2 ring-teal-400/20 text-teal-800',
  },
];

/**
 * LoginPage — Authentication screen for lab staff and administrators.
 *
 * Fully restyled with Tailwind CSS and the common component library:
 * - Uses FormInput with built-in password visibility toggle
 * - Uses Button with loading spinner state
 * - Uses ErrorAlert with retry/dismiss
 * - Features one-click quick-fill demo buttons for all 4 hospital roles
 */
const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Handle Quick-Fill button click
  const handleQuickFill = (roleObj) => {
    setUsername(roleObj.email);
    setPassword(roleObj.password);
    setSelectedRole(roleObj.roleName);
    setError(''); // Clear any previous error
  };

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
        navigate('/'); // Redirect to role dashboard
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
        <div className="flex flex-col items-center mb-6 text-center">
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

        {/* Quick Role Fill Section */}
        <div className="mb-6 p-3.5 bg-gray-50/80 rounded-xl border border-gray-100">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
              <Sparkles size={13} className="text-amber-500" />
              Quick Fill Demo Role
            </span>
            <span className="text-[10px] text-gray-400">Click to fill credentials</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {DEMO_ROLES.map((roleItem) => {
              const Icon = roleItem.icon;
              const isSelected = selectedRole === roleItem.roleName && username === roleItem.email;

              return (
                <button
                  key={roleItem.roleName}
                  type="button"
                  onClick={() => handleQuickFill(roleItem)}
                  className={`flex items-center gap-2 p-2 rounded-lg border text-xs font-semibold transition-all text-left ${
                    isSelected ? roleItem.activeColor : roleItem.color
                  }`}
                  title={`Pre-fill ${roleItem.roleName} (${roleItem.email})`}
                >
                  <Icon size={16} className="flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="truncate leading-tight">{roleItem.roleName}</p>
                    <p className="text-[10px] font-normal opacity-70 truncate">
                      {roleItem.email.split('@')[0]}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
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
            label="Username / Email"
            type="text"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setSelectedRole(null);
            }}
            placeholder="e.g. admin@gmail.com"
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
