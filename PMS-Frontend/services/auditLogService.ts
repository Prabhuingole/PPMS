import api from './api';

export interface AuditLog {
  id: number;
  user_id: number | null;
  user_name: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  old_values: Record<string, any> | null;
  new_values: Record<string, any> | null;
  timestamp: string;
  ip_address: string | null;
  metadata_info: Record<string, any> | null;
}

export const auditLogService = {
  getAll: async (params?: { entity_type?: string; user_id?: number; skip?: number; limit?: number }) => {
    const response = await api.get('/audit-logs', { params });
    return response.data;
  },

  getPaginated: async (params: { page: number; size: number; entity_type?: string; search?: string }) => {
    const response = await api.get('/audit-logs/paginated', { params });
    return response.data;
  },

  getByEntity: async (entityType: string, entityId: string) => {
    const response = await api.get(`/audit-logs/${entityType}/${entityId}`);
    return response.data;
  }
};
