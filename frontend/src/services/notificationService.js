import api from './api';
import { API_URLS } from '../constants';

/**
 * Service for In-App Notifications (FR-8.3, FR-8.6).
 * Handles fetching notifications, unread counts, and marking items as read.
 */
export const notificationService = {
  /**
   * Fetches all notifications for the currently authenticated staff member.
   * @returns {Promise<Array>} List of notification DTOs
   */
  getMyNotifications: async () => {
    const response = await api.get(API_URLS.NOTIFICATIONS);
    return response.data || [];
  },

  /**
   * Fetches the unread notification count for the top nav badge counter.
   * Polled every 30 seconds.
   * @returns {Promise<number>} Unread count
   */
  getUnreadCount: async () => {
    const response = await api.get(API_URLS.NOTIFICATIONS_UNREAD_COUNT);
    return response.data?.count || 0;
  },

  /**
   * Marks a single notification as read by its ID.
   * @param {number} notificationId
   */
  markAsRead: async (notificationId) => {
    const response = await api.put(`${API_URLS.NOTIFICATIONS}/${notificationId}/read`);
    return response.data;
  },

  /**
   * Marks all notifications as read for the current user.
   */
  markAllAsRead: async () => {
    const response = await api.put(API_URLS.NOTIFICATIONS_READ_ALL);
    return response.data;
  },
};
