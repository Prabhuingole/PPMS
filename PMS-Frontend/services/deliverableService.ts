import api from './api';
import { Deliverable } from '@/types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Axios functions
export const fetchDeliverables = async (projectId: number): Promise<Deliverable[]> => {
  const response = await api.get(`/deliverables/project/${projectId}`);
  return response.data.items || response.data;
};

export const createDeliverable = async (data: Partial<Deliverable>): Promise<Deliverable> => {
  const response = await api.post('/deliverables/', data);
  return response.data;
};

export const updateDeliverable = async (id: number, data: Partial<Deliverable>): Promise<Deliverable> => {
  const response = await api.put(`/deliverables/${id}`, data);
  return response.data;
};

export const deleteDeliverable = async (id: number): Promise<void> => {
  await api.delete(`/deliverables/${id}`);
};

// React Query Hooks
export const useDeliverables = (projectId: number) => {
  return useQuery({
    queryKey: ['deliverables', projectId],
    queryFn: () => fetchDeliverables(projectId),
    enabled: !!projectId,
  });
};

export const useCreateDeliverable = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createDeliverable,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['deliverables', variables.project_id] });
    },
  });
};

export const useUpdateDeliverable = (projectId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Deliverable> }) => updateDeliverable(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliverables', projectId] });
    },
  });
};

export const useDeleteDeliverable = (projectId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteDeliverable,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliverables', projectId] });
    },
  });
};
