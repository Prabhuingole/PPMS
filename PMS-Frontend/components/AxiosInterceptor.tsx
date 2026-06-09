'use client';

import { useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

/**
 * @deprecated This component is deprecated as of Phase 5.3.
 * All API calls should now route through `@/services/api.ts`, which handles its own interception.
 * This file will be removed after migration is complete and zero dependencies remain.
 */
export function AxiosInterceptor() {
  const logout = useAuthStore(state => state.logout);

  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          const config = error.config;
          // Ignore auth errors from the login endpoint so we can show specific error toasts (like Invalid credentials or Deactivation reason)
          if (config && config.url && config.url.includes('/auth/login')) {
             return Promise.reject(error);
          }

          // Token is invalid, expired, or user has been deactivated
          logout();
          localStorage.removeItem('auth-storage');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [logout]);

  return null;
}
