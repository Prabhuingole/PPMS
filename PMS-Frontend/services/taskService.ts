import api from './api';
import { Task } from '@/types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface TaskFilters {
  project_id?: number;
  assignee_id?: number;
  status?: string;
  deliverable_id?: number;
}

// Axios functions
export const fetchTasks = async (filters: TaskFilters): Promise<Task[]> => {
  const response = await api.get('/tasks/', { params: filters });
  return response.data.items || response.data;
};

export interface PaginatedTasks {
  items: Task[];
  total: number;
  page: number;
  pages: number;
}

export const fetchMyTasks = async (filterType?: string, page: number = 1): Promise<PaginatedTasks> => {
  const response = await api.get('/tasks/my-tasks', { params: { filterType, page } });
  return response.data;
};

export const createTask = async (data: Partial<Task>): Promise<Task> => {
  const response = await api.post('/tasks/', data);
  return response.data;
};

export const updateTask = async (id: number, data: Partial<Task>): Promise<Task> => {
  const response = await api.put(`/tasks/${id}`, data);
  return response.data;
};

export const deleteTask = async (id: number): Promise<void> => {
  await api.delete(`/tasks/${id}`);
};

// React Query Hooks
export const useTasks = (filters: TaskFilters) => {
  return useQuery({
    queryKey: ['tasks', filters],
    queryFn: () => fetchTasks(filters),
    enabled: !!filters.project_id || !!filters.assignee_id,
  });
};

export const useMyTasks = (filterType: string = 'active', page: number = 1) => {
  return useQuery({
    queryKey: ['my-tasks', filterType, page],
    queryFn: () => fetchMyTasks(filterType, page),
  });
};

export const useCreateTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTask,
    onSuccess: (_, variables) => {
      if (variables.project_id) {
        queryClient.invalidateQueries({ queryKey: ['tasks', { project_id: variables.project_id }] });
      }
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] });
    },
  });
};

export const useUpdateTask = (projectId?: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Task> }) => updateTask(id, data),
    onSuccess: () => {
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: ['tasks', { project_id: projectId }] });
      }
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] });
    },
  });
};

export const useDeleteTask = (projectId?: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: ['tasks', { project_id: projectId }] });
      }
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] });
    },
  });
};
