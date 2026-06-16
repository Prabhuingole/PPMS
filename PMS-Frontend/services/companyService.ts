import api from './api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Company } from '@/types';

export interface CompanyListResponse {
  items: Company[];
  total: number;
  page: number;
  pages: number;
}

export interface FetchCompaniesParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

export const fetchCompanies = async (params: FetchCompaniesParams = {}): Promise<CompanyListResponse> => {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.search) queryParams.append('search', params.search);
  if (params.status) queryParams.append('status', params.status);

  const res = await api.get(`/companies/?${queryParams.toString()}`);
  return res.data;
};

export const fetchCompany = async (id: number): Promise<Company> => {
  const res = await api.get(`/companies/${id}`);
  return res.data;
};

export const createCompany = async (data: Partial<Company>): Promise<Company> => {
  const res = await api.post('/companies/', data);
  return res.data;
};

export const updateCompany = async (data: { id: number; payload: Partial<Company> }): Promise<Company> => {
  const res = await api.put(`/companies/${data.id}`, data.payload);
  return res.data;
};

export const deactivateCompany = async (id: number): Promise<void> => {
  await api.delete(`/companies/${id}?hard=false`);
};

export const deleteCompany = async (id: number): Promise<void> => {
  await api.delete(`/companies/${id}?hard=true`);
};

export const useCompanies = (params: FetchCompaniesParams = {}) => {
  return useQuery({
    queryKey: ['companies', params],
    queryFn: () => fetchCompanies(params),
  });
};

export const useCompany = (id: number) => {
  return useQuery({
    queryKey: ['company', id],
    queryFn: () => fetchCompany(id),
    enabled: !!id,
  });
};

export const useCreateCompany = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCompany,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
  });
};

export const useUpdateCompany = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateCompany,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['company', variables.id] });
    },
  });
};

export const useDeactivateCompany = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deactivateCompany,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
  });
};

export const useDeleteCompany = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteCompany,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
  });
};

export const companyService = {
  getCompanies: async () => {
    const res = await fetchCompanies({ limit: 1000 });
    return res.items;
  },
  getCompany: fetchCompany,
  createCompany,
  updateCompany,
  deactivateCompany,
  deleteCompany,
};
