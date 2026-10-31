import api from './api';
import { API_URLS } from '../constants';

/**
 * Authentication service for login, session handling, and mandatory password reset.
 */
const authService = {
  // Login standard endpoint
  login: async (username, password) => {
    try {
      const response = await api.post(API_URLS.AUTH_LOGIN, { username, password });
      return {
        token: response.data.token,
        role: response.data.role,
        isTempPassword: response.data.mustChangePassword
      };
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Invalid credentials or network error';
      throw new Error(message);
    }
  },

  // Mandatory first-login password update
  changePassword: async (newPassword) => {
    try {
      const response = await api.post(API_URLS.AUTH_CHANGE_PASSWORD, { newPassword });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to update password';
      throw new Error(message);
    }
  },

  // Admin: Get all users
  getUsers: async () => {
    const response = await api.get(API_URLS.AUTH_USERS);
    return response.data;
  },

  // Admin: Create a new user
  createUser: async (userData) => {
    const response = await api.post(API_URLS.AUTH_REGISTER, userData);
    return response.data;
  },

  // Admin: Reset password
  resetPassword: async (userId, temporaryPassword) => {
    const payload = temporaryPassword ? { temporaryPassword } : {};
    const response = await api.post(`${API_URLS.AUTH_USERS}/${userId}/reset-password`, payload);
    return response.data;
  }
};

export default authService;
