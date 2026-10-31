import api from './api';
import { API_URLS } from '../constants';

/**
 * Service for interacting with the Test Catalog backend API.
 * Uses the configured Axios instance (with JWT authentication).
 */
export const catalogService = {
  /**
   * Fetches all active tests from the catalog.
   */
  getAllTests: async () => {
    const response = await api.get(API_URLS.CATALOG_TESTS);
    return response.data;
  },

  /**
   * Fetches full configuration details of a test by ID.
   */
  getTestById: async (id) => {
    const response = await api.get(`${API_URLS.CATALOG_TESTS}/${id}`);
    return response.data;
  },

  /**
   * Fetches all active container types (EDTA, Plain Tube, etc.).
   */
  getAllContainerTypes: async () => {
    const response = await api.get(API_URLS.CATALOG_CONTAINERS);
    return response.data;
  },

  /**
   * Creates a new lab test with parameters, reference ranges, and sample groups.
   */
  createTest: async (data) => {
    const response = await api.post(API_URLS.CATALOG_TESTS, data);
    return response.data;
  },

  /**
   * Updates an existing lab test catalog entry.
   */
  updateTest: async (id, data) => {
    const response = await api.put(`${API_URLS.CATALOG_TESTS}/${id}`, data);
    return response.data;
  },

  /**
   * Toggles the active status of a lab test.
   */
  toggleTestActive: async (id, active) => {
    const response = await api.patch(`${API_URLS.CATALOG_TESTS}/${id}/active`, { active });
    return response.data;
  },
};

export default catalogService;
