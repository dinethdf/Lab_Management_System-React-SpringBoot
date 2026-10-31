import api from './api';
import { API_URLS } from '../constants';

/**
 * Service for interacting with Staff User Management backend API.
 * Uses the configured Axios instance (with JWT authentication).
 */
export const adminUserService = {
  /**
   * Fetches all registered staff members.
   * @returns {Promise<Array>} List of users (id, username, role, isActive, mustChangePassword, createdAt)
   */
  getAllStaff: async () => {
    const response = await api.get(API_URLS.AUTH_USERS);
    return response.data;
  },

  /**
   * Registers a new staff user with a temporary password.
   * @param {Object} data { username, password, role }
   * @returns {Promise<Object>} Created user details
   */
  createStaff: async (data) => {
    const response = await api.post(API_URLS.AUTH_REGISTER, data);
    return response.data;
  },

  /**
   * Toggles active/disabled status for a staff account.
   * @param {number} id User ID
   * @param {boolean} isActive Target active status
   * @returns {Promise<Object>} Updated user details
   */
  updateStaffStatus: async (id, isActive) => {
    const response = await api.patch(`${API_URLS.AUTH_USERS}/${id}/status`, { isActive });
    return response.data;
  },

  /**
   * Admin-mediated password reset: issues a new temporary password.
   * Forces the user to change password on their next login.
   * @param {number} id User ID
   * @param {string} [temporaryPassword] Optional custom temporary password
   * @returns {Promise<Object>} Reset confirmation message and issued temporary password
   */
  resetStaffPassword: async (id, temporaryPassword) => {
    const payload = temporaryPassword ? { temporaryPassword } : {};
    const response = await api.post(`${API_URLS.AUTH_USERS}/${id}/reset-password`, payload);
    return response.data;
  }
};

export default adminUserService;
