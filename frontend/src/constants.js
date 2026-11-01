// All API endpoint URLs used across the React app
// Reads from REACT_APP_API_BASE_URL (configured in Vercel or .env) or falls back to local backend
export const API_URLS = {
  BASE: process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api',

  // --- Catalog Module ---
  CATALOG_TESTS: '/catalog/tests',           // GET all active tests / POST create new test
  CATALOG_CONTAINERS: '/catalog/containers', // GET all active container types

  // --- Auth / User Management Module ---
  AUTH_LOGIN: '/auth/login',                 // POST login
  AUTH_USERS: '/auth/users',                 // GET all staff users
  AUTH_REGISTER: '/auth/register',           // POST create new staff account
  AUTH_CHANGE_PASSWORD: '/auth/change-password', // POST update current user password

  // --- Results & Verification Module ---
  RESULTS: '/results',
  RESULTS_PENDING_VERIFICATION: '/results/pending-verification',
  RESULTS_MY_RESULTS: '/results/my-results',

  // --- Sample Collection Module ---
  COLLECTION: '/collection',
  COLLECTION_ORDER: '/collection/order',
  COLLECTION_LINK: '/collection/link',
  COLLECTION_RECEIVE: '/collection/receive',
  COLLECTION_RECEIVE_ALL: '/collection/receive-all',
  COLLECTION_REJECT: '/collection/reject',
  COLLECTION_PENDING: '/collection/pending',
};

// All role names used for permission checks in the UI
export const ROLES = {
  ADMIN: 'ADMIN',
  LAB_TECHNICIAN: 'LAB_TECHNICIAN',
  SENIOR_LAB_TECHNICIAN: 'SENIOR_LAB_TECHNICIAN',
  RECEPTIONIST: 'RECEPTIONIST',
};
