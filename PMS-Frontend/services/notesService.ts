import api from './api';
import { NoteWorkspace, NotePage, NoteChecklistItem, AdminWorkspaceOverview } from '@/types';

export const notesService = {
  // Employee Endpoints
  getWorkspace: async (): Promise<NoteWorkspace> => {
    const response = await api.get('/notes/workspace');
    return response.data;
  },

  getStats: async (): Promise<any> => {
    const response = await api.get('/notes/stats');
    return response.data;
  },

  getPages: async (params?: { project_id?: number; search?: string; archived?: boolean }): Promise<NotePage[]> => {
    const response = await api.get('/notes/pages', { params });
    return response.data;
  },

  createPage: async (data: { title?: string; project_id?: number; content?: string }): Promise<NotePage> => {
    const response = await api.post('/notes/pages', data);
    return response.data;
  },

  getPage: async (id: number): Promise<NotePage> => {
    const response = await api.get(`/notes/pages/${id}`);
    return response.data;
  },

  updatePage: async (id: number, data: Partial<NotePage>): Promise<NotePage> => {
    const response = await api.put(`/notes/pages/${id}`, data);
    return response.data;
  },

  deletePage: async (id: number): Promise<{ message: string }> => {
    const response = await api.delete(`/notes/pages/${id}`);
    return response.data;
  },

  addChecklistItem: async (pageId: number, data: { text: string }): Promise<NoteChecklistItem> => {
    const response = await api.post(`/notes/pages/${pageId}/checklist`, data);
    return response.data;
  },

  updateChecklistItem: async (id: number, data: Partial<NoteChecklistItem>): Promise<NoteChecklistItem> => {
    const response = await api.put(`/notes/checklist/${id}`, data);
    return response.data;
  },

  toggleChecklistItem: async (id: number): Promise<NoteChecklistItem> => {
    const response = await api.put(`/notes/checklist/${id}/toggle`);
    return response.data;
  },

  deleteChecklistItem: async (id: number): Promise<{ message: string }> => {
    const response = await api.delete(`/notes/checklist/${id}`);
    return response.data;
  },

  // Superadmin Endpoints
  // Superadmin Endpoints
  getAdminProjects: async (params?: { search?: string }): Promise<any[]> => {
    const response = await api.get('/notes/admin/projects', { params });
    return response.data;
  },

  getAdminProjectUsers: async (projectId: number): Promise<any[]> => {
    const response = await api.get(`/notes/admin/projects/${projectId}/users`);
    return response.data;
  },

  getAdminUserProjectPages: async (projectId: number, userId: number): Promise<NotePage[]> => {
    const response = await api.get(`/notes/admin/projects/${projectId}/users/${userId}/pages`);
    return response.data;
  },

  getAdminPage: async (pageId: number): Promise<NotePage> => {
    const response = await api.get(`/notes/admin/pages/${pageId}`);
    return response.data;
  }
};
