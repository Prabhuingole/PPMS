import api from './api';
import { ReportingManager, ReportingManagerListResponse } from '@/types';

export const reportingManagerService = {
  getReportingManagers: async (params?: { 
    page?: number; 
    limit?: number; 
    search?: string; 
    status_filter?: string; 
  }) => {
    const response = await api.get<ReportingManagerListResponse>('/reporting-managers/', { params });
    return response.data;
  },

  getReportingManager: async (id: number) => {
    const response = await api.get<ReportingManager>(`/reporting-managers/${id}`);
    return response.data;
  },

  createReportingManager: async (data: any) => {
    const response = await api.post<ReportingManager>('/reporting-managers/', data);
    return response.data;
  },

  updateReportingManager: async (id: number, data: any) => {
    const response = await api.put<ReportingManager>(`/reporting-managers/${id}`, data);
    return response.data;
  },

  deleteReportingManager: async (id: number) => {
    const response = await api.delete(`/reporting-managers/${id}`);
    return response.data;
  },
};
