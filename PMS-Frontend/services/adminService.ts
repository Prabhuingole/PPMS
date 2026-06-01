import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const getHeaders = () => {
  const token = useAuthStore.getState().token;
  return {
    Authorization: `Bearer ${token}`,
  };
};

export const adminService = {
  getAdmins: async (params?: { page?: number; limit?: number; search?: string; status_filter?: string }) => {
    const response = await axios.get(`${API_URL}/admins/`, {
      params,
      headers: getHeaders(),
    });
    return response.data;
  },

  createAdmin: async (data: any) => {
    const response = await axios.post(`${API_URL}/admins/`, data, {
      headers: getHeaders(),
    });
    return response.data;
  },

  deleteAdmin: async (id: number) => {
    const response = await axios.delete(`${API_URL}/admins/${id}`, {
      headers: getHeaders(),
    });
    return response.data;
  },
};
