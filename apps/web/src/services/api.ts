import axios from 'axios';
import { config } from '../config';
import { authService } from './auth';

// Create a shared axios instance with common configuration
const api = axios.create({
  baseURL: config.baseApiUrl,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: true
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
  const token = authService.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Don't log cancelled requests
    if (axios.isAxiosError(error) && error.code === 'ERR_CANCELED') {
      return Promise.reject(error);
    }
    
    // Log other errors
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export default api; 