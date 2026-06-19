import api from './api';
import { Project, ProjectListResponse } from '@/types';

export const projectService = {
  getProjects: async (params?: { 
    page?: number; 
    limit?: number; 
    search?: string; 
    status?: string; 
    manager_id?: number;
    client_company_id?: number;
    owner_company_id?: number;
  }) => {
    const response = await api.get<ProjectListResponse>('/projects/', { params });
    return response.data;
  },

  getProject: async (id: number) => {
    const response = await api.get<Project>(`/projects/${id}`);
    return response.data;
  },

  createProject: async (data: any) => {
    const response = await api.post<Project>('/projects/', data);
    return response.data;
  },

  updateProject: async (id: number, data: any) => {
    const response = await api.put<Project>(`/projects/${id}`, data);
    return response.data;
  },

  deleteProject: async (id: number) => {
    const response = await api.delete(`/projects/${id}`);
    return response.data;
  },
};
