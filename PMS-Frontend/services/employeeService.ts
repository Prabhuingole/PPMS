import api from './api';
import { Employee, EmployeeListResponse } from '@/types';

export const employeeService = {
  getEmployees: async (params?: { 
    page?: number; 
    limit?: number; 
    search?: string; 
    user_type?: string; 
    status_filter?: boolean; 
  }) => {
    const response = await api.get<EmployeeListResponse>('/employees/', { params });
    return response.data;
  },

  getEmployee: async (id: number) => {
    const response = await api.get<Employee>(`/employees/${id}`);
    return response.data;
  },

  createEmployee: async (data: any) => {
    const response = await api.post('/employees/', data);
    return response.data;
  },

  updateEmployee: async (id: number, data: any) => {
    const response = await api.put(`/employees/${id}`, data);
    return response.data;
  },

  deleteEmployee: async (id: number) => {
    const response = await api.delete(`/employees/${id}`);
    return response.data;
  },

  toggleStatus: async (id: number, is_active: boolean) => {
    const response = await api.patch(`/employees/${id}/status`, null, { params: { is_active } });
    return response.data;
  },
};
