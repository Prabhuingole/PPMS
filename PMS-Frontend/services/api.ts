import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    let token = useAuthStore.getState().token;
    
    // Fallback to cookie if token is lost in new tab (empty sessionStorage)
    if (!token && typeof document !== 'undefined') {
      const match = document.cookie.match(/(?:^|;)\s*auth_token=([^;]+)/);
      if (match) {
        token = match[1];
      }
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Skip global interceptor logic for auth routes (handled locally)
    if (error.config?.url?.includes('/auth/login') || 
        error.config?.url?.includes('/auth/verify-mfa') || 
        error.config?.url?.includes('/auth/forgot-password') || 
        error.config?.url?.includes('/auth/update-password')) {
       return Promise.reject(error);
    }

    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    } else if (error.response?.status === 403) {
      const detail = error.response?.data?.detail;
      if (typeof detail === 'string' && detail.toLowerCase().includes('deactivated')) {
        useAuthStore.getState().logout();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
