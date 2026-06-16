import api from './api';

export interface BillingReport {
  total_hours: number;
  billable_hours: number;
  non_billable_hours: number;
  utilization_percentage: number;
  
  total_cost: number;
  cost_by_project: { project_id: number; project_name: string; cost: number }[];
  cost_by_consultant: { user_id: number; consultant_name: string; cost: number }[];
  cost_by_company: { company_id: number; company_name: string; cost: number }[];
  monthly_cost_trends: { month: string; cost: number }[];

  active_consultants: number;
  assigned_consultants: number;
  unassigned_consultants: number;
  open_projects: number;
}

export interface Invoice {
  id: number;
  invoice_number: string;
  vendor_company_id: number;
  client_company_id: number;
  total_amount: number;
  currency: string;
  status: string;
  subtotal?: number;
  tax_amount?: number;
  created_by_id?: number;
  issued_by_id?: number;
  paid_by_id?: number;
  timesheets?: any[];
}

export const billingService = {
  getBillingReports: async (params?: { vendor_id?: number; client_id?: number; project_id?: number }) => {
    const response = await api.get('/billing/reports', { params });
    return response.data as BillingReport;
  },

  listInvoices: async (params?: { vendor_id?: number; client_id?: number; status?: string }) => {
    const response = await api.get('/billing/invoices', { params });
    return response.data as Invoice[];
  },

  getInvoice: async (id: number) => {
    const response = await api.get(`/billing/invoices/${id}`);
    return response.data;
  },

  createInvoice: async (payload: { vendor_company_id: number; client_company_id: number; timesheet_ids: number[] }) => {
    const response = await api.post('/billing/invoices', payload);
    return response.data;
  },

  issueInvoice: async (id: number) => {
    const response = await api.post(`/billing/invoices/${id}/issue`);
    return response.data;
  },

  payInvoice: async (id: number) => {
    const response = await api.post(`/billing/invoices/${id}/pay`);
    return response.data;
  },

  cancelInvoice: async (id: number) => {
    const response = await api.post(`/billing/invoices/${id}/cancel`);
    return response.data;
  }
};
