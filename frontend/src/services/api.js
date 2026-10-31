import axios from 'axios';
import { API_URLS } from '../constants';

/**
 * The Central API Service.
 * This file configures Axios to automatically attach the JWT token 
 * to every request going to the Spring Boot backend.
 */
const api = axios.create({
  baseURL: API_URLS.BASE,
});

// Intercept requests before they are sent
api.interceptors.request.use(
  (config) => {
    // Look for the token we saved during login
    const token = localStorage.getItem('token');
    
    // If it exists, add it to the Authorization header
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
