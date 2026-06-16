import api from './api';
import { useQuery } from '@tanstack/react-query';

export interface ResourceSummary {
  active_consultants: number;
  assigned_consultants: number;
  unassigned_consultants: number;
  open_projects: number;
  total_capacity_hours: number;
  total_allocated_hours: number;
  available_capacity_hours: number;
  utilization_percentage: number;
}

export interface ConsultantUtilization {
  user_id: number;
  consultant_name: string;
  weekly_capacity_hours: number;
  allocated_hours: number;
  logged_hours: number;
  utilization_percentage: number;
  status: string;
}

export interface ProjectHealth {
  project_id: number;
  project_name: string;
  financial_burn_rate: number;
  execution_progress: number;
  variance: number;
  risk: string;
}

export const fetchResourceSummary = async (): Promise<ResourceSummary> => {
  const res = await api.get('/resource-reports/resource-summary');
  return res.data;
};

export const fetchUtilization = async (): Promise<ConsultantUtilization[]> => {
  const res = await api.get('/resource-reports/utilization');
  return res.data;
};

export const fetchProjectHealth = async (): Promise<ProjectHealth[]> => {
  const res = await api.get('/resource-reports/project-health');
  return res.data;
};

export const useResourceSummary = () => {
  return useQuery({
    queryKey: ['resource-summary'],
    queryFn: fetchResourceSummary,
  });
};

export const useUtilization = () => {
  return useQuery({
    queryKey: ['utilization'],
    queryFn: fetchUtilization,
  });
};

export const useProjectHealth = () => {
  return useQuery({
    queryKey: ['project-health'],
    queryFn: fetchProjectHealth,
  });
};
