import api from './api';
import { API_URLS } from '../constants';

/**
 * DashboardService — Fetches real-time aggregated metrics for the Administrator Dashboard.
 * Connects directly to the backend Spring Boot GET /api/dashboard/admin-stats endpoint.
 */
export const dashboardService = {
  /**
   * Retrieves live operational statistics from MySQL:
   * - Total and today's registered patients
   * - Active staff member count
   * - Active diagnostic tests in catalog
   * - Total and today's orders
   * - Pending verification backlog
   * - Order status pipeline breakdown
   * - Recent 5 orders activity list
   */
  getAdminStats: async () => {
    const response = await api.get(API_URLS.DASHBOARD_ADMIN_STATS);
    return response.data;
  },

  // Backwards-compatible alias for existing components
  getStats: async () => {
    const response = await api.get(API_URLS.DASHBOARD_ADMIN_STATS);
    return response.data;
  },

  /**
   * Retrieves laboratory analytics datasets for a specified date range (or defaults to last 7 days):
   * - Summary cards (total tests, completed, pending, average TAT)
   * - Daily test volume (bar chart dataset)
   * - Tests by category (pie chart dataset)
   * - Turnaround time trend (line chart dataset)
   *
   * @param {string} [startDate] - Start date in 'YYYY-MM-DD' format
   * @param {string} [endDate]   - End date in 'YYYY-MM-DD' format
   */
  getAnalyticsStats: async (startDate, endDate) => {
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const response = await api.get(API_URLS.DASHBOARD_ANALYTICS, { params });
    return response.data;
  },
};

export default dashboardService;
