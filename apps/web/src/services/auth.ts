import axios from 'axios';
import { config } from '../config';

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    inboxes: string[];
    joinDate: string;
    subscription?: {
      plan: string;
      status: string;
      nextBilling: string | null;
    };
    preferences: {
      theme: 'Light' | 'Dark';
      emailDigest: boolean;
      notifications: boolean;
    };
  };
  token: string;
}

const api = axios.create({
  baseURL: config.baseApiUrl,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: true,
  validateStatus: (status) => status < 500 // Don't reject if status is not 500+
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Add response interceptor to handle errors
api.interceptors.response.use((response) => {
  return response;
}, (error) => {
  console.error('API Error:', error);
  return Promise.reject(error);
});

const register = async (data: RegisterData): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/account/register', data);
  if (response.data.token) {
    localStorage.setItem('token', response.data.token);
  }
  return response.data;
};

const login = async (data: LoginData): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/account/login', data);
  if (response.data.token) {
    localStorage.setItem('token', response.data.token);
  }
  return response.data;
};

const getProfile = async (): Promise<AuthResponse['user']> => {
  const response = await api.get<AuthResponse['user']>('/account/profile');
  return response.data;
};

const logout = () => {
  localStorage.removeItem('token');
};

const getToken = () => {
  return localStorage.getItem('token');
};

const isAuthenticated = () => {
  return !!getToken();
};

// Add this interface for preferences
interface UserPreferences {
  theme: 'Light' | 'Dark';
  emailDigest: boolean;
  notifications: boolean;
}

const updatePreferences = async (preferences: UserPreferences): Promise<AuthResponse['user']> => {
  const response = await api.patch<AuthResponse['user']>('/account/profile', {
    preferences
  });
  return response.data;
};

export const authService = {
  register,
  login,
  logout,
  getProfile,
  getToken,
  isAuthenticated,
  updatePreferences,
}; 