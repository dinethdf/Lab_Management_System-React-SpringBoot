import api from './api';
import { API_URLS } from '../constants';

/**
 * Service for interacting with the Result Entry & Verification backend endpoints.
 */
export const resultService = {
  /**
   * Fetches result form data by scanning container barcode or test sample code.
   * @param {string} code e.g. "TSC-00456-01-P1" or "TSC-00456-01"
   */
  getResultFormByCode: async (code) => {
    const response = await api.get(`/results/by-container/${encodeURIComponent(code)}`);
    return response.data;
  },

  /**
   * Saves or updates a draft result.
   */
  saveDraft: async (data) => {
    const response = await api.post(API_URLS.RESULTS, data);
    return response.data;
  },

  /**
   * Submits a draft result for Senior Lab Technician verification.
   */
  submitForVerification: async (resultId) => {
    const response = await api.post(`${API_URLS.RESULTS}/${resultId}/submit`);
    return response.data;
  },

  /**
   * Retrieves all results pending senior verification (SUBMITTED status).
   */
  getPendingVerification: async () => {
    const response = await api.get(API_URLS.RESULTS_PENDING_VERIFICATION);
    return response.data;
  },

  /**
   * Approves and releases a result (Senior Lab Tech only).
   */
  approveResult: async (resultId) => {
    const response = await api.post(`${API_URLS.RESULTS}/${resultId}/approve`);
    return response.data;
  },

  /**
   * Rejects a submitted result back to technician for corrections.
   */
  rejectResult: async (resultId, reason) => {
    const response = await api.post(`${API_URLS.RESULTS}/${resultId}/reject`, { reason });
    return response.data;
  },

  /**
   * Retrieves results entered by current technician.
   */
  getMyResults: async () => {
    const response = await api.get(API_URLS.RESULTS_MY_RESULTS);
    return response.data;
  },
};

export default resultService;
