import api from './api';
import { TaskComment } from '@/types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export const fetchTaskComments = async (taskId: number): Promise<TaskComment[]> => {
  const response = await api.get(`/task-comments/`, { params: { task_id: taskId } });
  return response.data.items || response.data;
};

export const createTaskComment = async (data: { task_id: number; comment: string }): Promise<TaskComment> => {
  const response = await api.post('/task-comments/', data);
  return response.data;
};

export const deleteTaskComment = async (id: number): Promise<void> => {
  await api.delete(`/task-comments/${id}`);
};

// React Query Hooks
export const useTaskComments = (taskId: number) => {
  return useQuery({
    queryKey: ['task-comments', taskId],
    queryFn: () => fetchTaskComments(taskId),
    enabled: !!taskId,
  });
};

export const useCreateTaskComment = (taskId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTaskComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-comments', taskId] });
    },
  });
};

export const useDeleteTaskComment = (taskId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTaskComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-comments', taskId] });
    },
  });
};
