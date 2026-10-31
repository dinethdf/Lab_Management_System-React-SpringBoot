import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import {
  DataTable,
  Badge,
  PageHeader,
  ErrorAlert,
  EmptyState,
  Button,
  Modal,
  FormInput,
  FormSelect,
  ConfirmDialog,
  useToast,
} from '../../components/ui';
import {
  Plus,
  RefreshCw,
  Users,
  KeyRound,
  Copy,
  Check,
  Shield,
  UserX,
  UserCheck,
  Sparkles,
} from 'lucide-react';
import adminUserService from '../../services/adminUserService';

/**
 * AdminUserManagementPage — Staff accounts overview, creation, and role management.
 *
 * Implements:
 * 1. Dynamic creation of real staff accounts in MySQL database with temporary passwords.
 * 2. Mandatory first-login password change flagging (mustChangePassword = true).
 * 3. Administrator-mediated password reset with 1-click credential copying.
 * 4. Activation and deactivation of staff accounts with self-disable safeguards.
 * 5. Preservation of the default seeded accounts (admin, receptionist, labtech, seniorlabtech).
 */
const AdminUserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('ALL');
  const { showSuccess, showError, showInfo } = useToast();

  const currentUsername = localStorage.getItem('username') || '';

  // --- Create Staff Modal State ---
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createUsername, setCreateUsername] = useState('');
  const [createRole, setCreateRole] = useState('LAB_TECHNICIAN');
  const [createPassword, setCreatePassword] = useState('');
  const [creating, setCreating] = useState(false);
  const [createdResult, setCreatedResult] = useState(null);
  const [copiedKey, setCopiedKey] = useState(false);

  // --- Reset Password Modal State ---
  const [resetModalUser, setResetModalUser] = useState(null);
  const [resetTempPassword, setResetTempPassword] = useState('');
  const [resetting, setResetting] = useState(false);
  const [resetSuccessData, setResetSuccessData] = useState(null);

  // --- Status Toggle State (Enable / Disable) ---
  const [toggleStatusUser, setToggleStatusUser] = useState(null);
  const [toggling, setToggling] = useState(false);

  // Generates a random temporary password like "Temp4921!"
  const generateRandomPassword = () => {
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    return `Temp${randomDigits}!`;
  };

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminUserService.getAllStaff();
      setUsers(data || []);
    } catch (err) {
      console.error('Failed to load staff list:', err);
      const errMsg =
        err.response?.data?.message ||
        'Failed to connect to the backend server. Please verify Spring Boot is running on port 8080.';
      setError(errMsg);
      showError(errMsg, 'Staff Load Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter users by selected category tab
  const filteredUsers = users.filter((user) => {
    if (activeTab === 'ADMIN') return user.role === 'ADMIN';
    if (activeTab === 'STAFF') return user.role !== 'ADMIN';
    return true;
  });

  // --------------------------------------------------------------------------
  // CREATE STAFF HANDLERS
  // --------------------------------------------------------------------------
  const openCreateModal = () => {
    setCreateUsername('');
    setCreateRole('LAB_TECHNICIAN');
    setCreatePassword(generateRandomPassword());
    setCreatedResult(null);
    setCopiedKey(false);
    setIsCreateModalOpen(true);
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    if (!createUsername.trim()) {
      showError('Please enter a username or email for the staff member.', 'Validation Error');
      return;
    }
    if (!createPassword.trim() || createPassword.trim().length < 6) {
      showError('Temporary password must be at least 6 characters.', 'Validation Error');
      return;
    }

    setCreating(true);
    try {
      const response = await adminUserService.createStaff({
        username: createUsername.trim(),
        role: createRole,
        password: createPassword.trim(),
      });

      setCreatedResult({
        username: response.username,
        role: response.role,
        temporaryPassword: response.temporaryPassword || createPassword.trim(),
      });

      showSuccess(`Staff account for ${response.username} created successfully!`, 'Account Created');
      await fetchUsers();
    } catch (err) {
      console.error('Failed to create staff account:', err);
      showError(err.response?.data?.message || err.message || 'Failed to create staff account.', 'Creation Failed');
    } finally {
      setCreating(false);
    }
  };

  // --------------------------------------------------------------------------
  // RESET PASSWORD HANDLERS
  // --------------------------------------------------------------------------
  const openResetPasswordModal = (user) => {
    setResetModalUser(user);
    setResetTempPassword(generateRandomPassword());
    setResetSuccessData(null);
    setCopiedKey(false);
  };

  const handleConfirmResetPassword = async () => {
    if (!resetModalUser) return;
    if (!resetTempPassword.trim() || resetTempPassword.trim().length < 6) {
      showError('Temporary password must be at least 6 characters.', 'Validation Error');
      return;
    }

    setResetting(true);
    try {
      const result = await adminUserService.resetStaffPassword(resetModalUser.id, resetTempPassword.trim());
      setResetSuccessData({
        username: resetModalUser.username,
        temporaryPassword: result.temporaryPassword || resetTempPassword.trim(),
        message: result.message,
      });
      showSuccess(`Temporary password issued for ${resetModalUser.username}.`, 'Password Reset');
      await fetchUsers();
    } catch (err) {
      console.error('Failed to reset staff password:', err);
      showError(err.response?.data?.message || err.message || 'Failed to reset password.', 'Reset Failed');
    } finally {
      setResetting(false);
    }
  };

  // --------------------------------------------------------------------------
  // TOGGLE STATUS HANDLERS
  // --------------------------------------------------------------------------
  const handleToggleStatus = async () => {
    if (!toggleStatusUser) return;

    setToggling(true);
    try {
      const newStatus = !toggleStatusUser.isActive;
      await adminUserService.updateStaffStatus(toggleStatusUser.id, newStatus);
      showSuccess(
        `Staff account ${toggleStatusUser.username} is now ${newStatus ? 'Active' : 'Disabled'}.`,
        'Status Updated'
      );
      setToggleStatusUser(null);
      await fetchUsers();
    } catch (err) {
      console.error('Failed to update staff status:', err);
      showError(err.response?.data?.message || err.message || 'Failed to update account status.', 'Update Failed');
    } finally {
      setToggling(false);
    }
  };

  // Copy helper
  const handleCopy = (text) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
      setCopiedKey(true);
      showInfo('Temporary credentials copied to clipboard!', 'Copied');
      setTimeout(() => setCopiedKey(false), 2500);
    }
  };

  // --------------------------------------------------------------------------
  // TABLE COLUMNS CONFIGURATION
  // --------------------------------------------------------------------------
  const columns = [
    {
      header: 'Staff Member (Username)',
      accessor: 'username',
      cell: (row) => {
        const isSelf = row.username?.toLowerCase() === currentUsername.toLowerCase();
        return (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs uppercase shadow-xs">
              {row.username ? row.username.charAt(0) : 'U'}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-gray-900 block">{row.username}</span>
                {isSelf && (
                  <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-1.5 py-0.5 rounded border border-blue-200">
                    You
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-400">Staff ID #{row.id}</span>
            </div>
          </div>
        );
      },
    },
    {
      header: 'Assigned Role',
      accessor: 'role',
      cell: (row) => {
        let color = 'gray';
        if (row.role === 'ADMIN') color = 'blue';
        else if (row.role === 'LAB_TECHNICIAN') color = 'green';
        else if (row.role === 'SENIOR_LAB_TECHNICIAN') color = 'orange';
        else if (row.role === 'RECEPTIONIST') color = 'purple';
        return <Badge variant={color}>{row.role ? row.role.replace(/_/g, ' ') : 'N/A'}</Badge>;
      },
    },
    {
      header: 'Account Status',
      accessor: 'isActive',
      cell: (row) => (
        <Badge variant={row.isActive ? 'green' : 'red'}>
          {row.isActive ? 'Active' : 'Disabled'}
        </Badge>
      ),
    },
    {
      header: 'Password Status',
      accessor: 'mustChangePassword',
      cell: (row) => (
        <span
          className={`text-xs font-medium px-2 py-1 rounded-full ${
            row.mustChangePassword
              ? 'bg-amber-50 text-amber-700 border border-amber-200 font-semibold'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          {row.mustChangePassword ? 'Temp Password (Pending Change)' : 'Active Password Set'}
        </span>
      ),
    },
    {
      header: 'Actions',
      accessor: 'actions',
      cell: (row) => {
        const isSelf = row.username?.toLowerCase() === currentUsername.toLowerCase();
        return (
          <div className="flex items-center justify-end gap-2">
            {/* Reset Password Button */}
            <Button
              variant="outline"
              size="xs"
              leftIcon={<KeyRound size={13} />}
              onClick={() => openResetPasswordModal(row)}
              title="Reset Temporary Password"
            >
              Reset Pass
            </Button>

            {/* Toggle Status Button (Activate / Disable) */}
            <Button
              variant={row.isActive ? 'secondary' : 'primary'}
              size="xs"
              disabled={isSelf}
              leftIcon={row.isActive ? <UserX size={13} /> : <UserCheck size={13} />}
              onClick={() => setToggleStatusUser(row)}
              className={row.isActive ? 'text-red-700 hover:bg-red-50 hover:border-red-200' : 'bg-green-700 hover:bg-green-800'}
              title={isSelf ? 'Cannot disable your own active account' : row.isActive ? 'Disable Account' : 'Activate Account'}
            >
              {row.isActive ? 'Disable' : 'Activate'}
            </Button>
          </div>
        );
      },
    },
  ];

  const roleOptions = [
    { value: 'LAB_TECHNICIAN', label: 'Lab Technician (Collection & Testing)' },
    { value: 'SENIOR_LAB_TECHNICIAN', label: 'Senior Lab Technician (Verification & Approvals)' },
    { value: 'RECEPTIONIST', label: 'Receptionist (Front Desk & Orders)' },
    { value: 'ADMIN', label: 'Administrator (System & Catalog Config)' },
  ];

  return (
    <Layout title="Staff Management">
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Laboratory Staff & Accounts"
          subtitle="Manage authorized laboratory personnel, assign role-based permissions, issue temporary credentials, and handle account security."
          tabs={[
            { label: 'All Accounts', value: 'ALL', count: users.length },
            {
              label: 'Administrators',
              value: 'ADMIN',
              count: users.filter((u) => u.role === 'ADMIN').length,
            },
            {
              label: 'Lab Staff',
              value: 'STAFF',
              count: users.filter((u) => u.role !== 'ADMIN').length,
            },
          ]}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={fetchUsers}
                disabled={loading}
                leftIcon={<RefreshCw size={15} className={loading ? 'animate-spin' : ''} />}
              >
                Refresh
              </Button>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus size={16} />}
                onClick={openCreateModal}
              >
                Add Staff Member
              </Button>
            </div>
          }
        />

        {/* Error Alert */}
        {error && (
          <ErrorAlert
            title="Failed to Load Staff Accounts"
            message={error}
            onRetry={fetchUsers}
            onDismiss={() => setError(null)}
          />
        )}

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={filteredUsers}
          loading={loading}
          showActions={false}
          emptyState={
            <EmptyState
              title="No Staff Accounts Found"
              description="No user accounts match the selected category filter."
              icon={<Users size={24} />}
            />
          }
        />

        {/* ======================================================== */}
        {/* MODAL 1: CREATE NEW STAFF ACCOUNT                        */}
        {/* ======================================================== */}
        {isCreateModalOpen && (
          <Modal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            title="Add New Staff Member"
            size="md"
            footer={
              createdResult ? (
                <div className="flex justify-end gap-2 w-full">
                  <Button variant="primary" size="sm" onClick={() => setIsCreateModalOpen(false)}>
                    Done
                  </Button>
                </div>
              ) : (
                <div className="flex justify-end gap-2 w-full">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setIsCreateModalOpen(false)}
                    disabled={creating}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleCreateStaff}
                    loading={creating}
                  >
                    Create Account
                  </Button>
                </div>
              )
            }
          >
            {createdResult ? (
              <div className="flex flex-col gap-4 py-2">
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-green-900 font-semibold text-sm">
                    <Check size={18} className="text-green-600" />
                    Staff Account Created Successfully!
                  </div>
                  <p className="text-xs text-green-800">
                    A temporary password has been assigned. The staff member will be forced to change this password on their very first login.
                  </p>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500 font-medium">Username / Email:</span>
                    <span className="font-mono font-bold text-gray-900">{createdResult.username}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500 font-medium">Assigned Role:</span>
                    <Badge variant="blue">{createdResult.role}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs border-t border-gray-200 pt-2">
                    <span className="text-gray-500 font-medium">Temporary Password:</span>
                    <span className="font-mono font-bold text-blue-700 bg-white px-2 py-0.5 rounded border border-gray-300">
                      {createdResult.temporaryPassword}
                    </span>
                  </div>
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={copiedKey ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                  onClick={() =>
                    handleCopy(
                      `Laboratory System Login:\nUsername: ${createdResult.username}\nTemporary Password: ${createdResult.temporaryPassword}\nLogin Portal: http://localhost:3000/login`
                    )
                  }
                  className="w-full text-xs font-semibold"
                >
                  {copiedKey ? 'Credentials Copied!' : 'Copy Credentials for Staff'}
                </Button>
              </div>
            ) : (
              <form onSubmit={handleCreateStaff} className="flex flex-col gap-4 py-1">
                <FormInput
                  label="Username / Email Address"
                  type="email"
                  value={createUsername}
                  onChange={(e) => setCreateUsername(e.target.value)}
                  placeholder="e.g. nurse.sarah@hospital.com"
                  required
                  autoFocus
                />

                <FormSelect
                  label="System Role & Permissions"
                  value={createRole}
                  onChange={(e) => setCreateRole(e.target.value)}
                  options={roleOptions}
                  required
                />

                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">
                      Temporary Password <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setCreatePassword(generateRandomPassword())}
                      className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
                    >
                      <Sparkles size={12} />
                      Generate New
                    </button>
                  </div>
                  <FormInput
                    type="text"
                    value={createPassword}
                    onChange={(e) => setCreatePassword(e.target.value)}
                    placeholder="e.g. Temp1234!"
                    required
                  />
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Staff member must change this password immediately after their first login before accessing any laboratory data.
                  </p>
                </div>
              </form>
            )}
          </Modal>
        )}

        {/* ======================================================== */}
        {/* MODAL 2: RESET STAFF PASSWORD                            */}
        {/* ======================================================== */}
        {resetModalUser && (
          <Modal
            isOpen={Boolean(resetModalUser)}
            onClose={() => setResetModalUser(null)}
            title="Reset Staff Password"
            size="md"
            footer={
              resetSuccessData ? (
                <div className="flex justify-end w-full">
                  <Button variant="primary" size="sm" onClick={() => setResetModalUser(null)}>
                    Done
                  </Button>
                </div>
              ) : (
                <div className="flex justify-end gap-2 w-full">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setResetModalUser(null)}
                    disabled={resetting}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleConfirmResetPassword}
                    loading={resetting}
                  >
                    Issue New Password
                  </Button>
                </div>
              )
            }
          >
            {resetSuccessData ? (
              <div className="flex flex-col gap-4 py-2">
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-green-900 font-semibold text-sm">
                    <Check size={18} className="text-green-600" />
                    Temporary Password Issued!
                  </div>
                  <p className="text-xs text-green-800">
                    The previous password for <strong>{resetSuccessData.username}</strong> has been revoked. They must use this temporary password on their next login and immediately set a new one.
                  </p>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-center justify-between">
                  <span className="text-xs text-gray-600 font-medium">New Temporary Password:</span>
                  <span className="font-mono font-bold text-sm text-blue-700 bg-white px-2.5 py-1 rounded border border-gray-300">
                    {resetSuccessData.temporaryPassword}
                  </span>
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={copiedKey ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                  onClick={() =>
                    handleCopy(
                      `Laboratory System Password Reset:\nUsername: ${resetSuccessData.username}\nTemporary Password: ${resetSuccessData.temporaryPassword}\nLogin Portal: http://localhost:3000/login`
                    )
                  }
                  className="w-full text-xs font-semibold"
                >
                  {copiedKey ? 'Credentials Copied!' : 'Copy Credentials for Staff'}
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-4 py-1">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 flex items-start gap-2">
                  <Shield size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    Resetting password for <strong>{resetModalUser.username}</strong> ({resetModalUser.role}). This will invalidate their current password.
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">
                      New Temporary Password <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setResetTempPassword(generateRandomPassword())}
                      className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
                    >
                      <Sparkles size={12} />
                      Generate New
                    </button>
                  </div>
                  <FormInput
                    type="text"
                    value={resetTempPassword}
                    onChange={(e) => setResetTempPassword(e.target.value)}
                    placeholder="e.g. Temp5821!"
                    required
                  />
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    User will be forced to change this password on their next login.
                  </p>
                </div>
              </div>
            )}
          </Modal>
        )}

        {/* ======================================================== */}
        {/* MODAL 3: TOGGLE STATUS CONFIRMATION                      */}
        {/* ======================================================== */}
        {toggleStatusUser && (
          <ConfirmDialog
            isOpen={Boolean(toggleStatusUser)}
            onClose={() => setToggleStatusUser(null)}
            onConfirm={handleToggleStatus}
            loading={toggling}
            title={toggleStatusUser.isActive ? 'Disable Staff Account?' : 'Activate Staff Account?'}
            message={
              toggleStatusUser.isActive
                ? `Are you sure you want to disable the account for "${toggleStatusUser.username}"? They will immediately be blocked from logging into the hospital lab system.`
                : `Are you sure you want to reactivate the account for "${toggleStatusUser.username}"? They will be allowed to log in with their existing credentials.`
            }
            confirmLabel={toggleStatusUser.isActive ? 'Disable Account' : 'Activate Account'}
            variant={toggleStatusUser.isActive ? 'danger' : 'primary'}
          />
        )}
      </div>
    </Layout>
  );
};

export default AdminUserManagementPage;
