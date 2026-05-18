export type UserRole = 'superadmin' | 'employee' | 'intern';

export interface User {
  id: string;
  employee_id?: string;
  username?: string;
  full_name: string;
  email: string;
  role: UserRole;
  designation?: string;
  bio?: string;
  mobile_number?: string;
  joining_date?: string;
  is_active: boolean;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

export interface Employee {
  id: number;
  employee_id: string;
  username: string;
  full_name: string;
  email: string;
  mobile_number: string;
  role: UserRole;
  designation: string;
  is_active: boolean;
  joining_date: string;
}

export interface EmployeeListResponse {
  items: Employee[];
  total: number;
  page: number;
  pages: number;
}

export interface ProjectMember {
  id: number;
  full_name: string;
  email: string;
  role: string;
  designation?: string;
}

export interface Project {
  id: number;
  name: string;
  code: string;
  description?: string;
  client_name?: string;
  status: 'planning' | 'active' | 'on-hold' | 'completed';
  start_date?: string;
  end_date?: string;
  reporting_manager_id?: number;
  reporting_manager?: ReportingManager;
  members: ProjectMember[];
  documents?: ProjectDocument[];
  created_at: string;
  updated_at: string;
}

export interface ProjectDocument {
  id: number;
  filename: string;
  display_name?: string;
  doc_type: string;
  preparation_date?: string;
  project_id: number;
  uploaded_by_id: number;
  created_at: string;
}

export interface ProjectListResponse {
  items: Project[];
  total: number;
  page: number;
  pages: number;
}

export interface Timesheet {
  id: string;
  employeeId: string;
  projectId: string;
  date: string;
  hours: number;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  overtime: boolean;
  downtime: boolean;
}

export interface ReportingManager {
  id: number;
  full_name: string;
  email: string;
  mobile_number?: string;
  designation?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ReportingManagerListResponse {
  items: ReportingManager[];
  total: number;
  page: number;
  pages: number;
}

export interface DocumentTemplate {
  id: number;
  doc_type: string;
  filename?: string;
  html_content?: string;
  updated_at: string;
}
