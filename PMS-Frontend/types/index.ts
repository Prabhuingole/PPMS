export type UserRole = 'superadmin' | 'admin' | 'reporting_manager' | 'employee' | 'team_member' | 'intern' | 'consultant';

export interface Company {
  id: number;
  name: string;
  code: string;
  status: string;
  address?: string;
  city?: string;
  gst_number?: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  logo_url?: string;
  created_at?: string;
  updated_at?: string;
  metrics?: {
    team_member_count: number;
    consultant_count: number;
    reporting_manager_count: number;
    project_count: number;
  };
}

export interface User {
  id: string;
  employee_id?: string;
  full_name: string;
  email: string;
  role: UserRole;
  designation?: string;
  bio?: string;
  mobile_number?: string;
  joining_date?: string;
  is_active: boolean;
  must_change_password?: boolean;
  password_updated_at?: string;
  is_mfa_enabled?: boolean;
  account_status?: string;
  last_login_at?: string;
  company_id?: number;
  company_name?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  mfaEmail: string | null;
}

export interface Employee {
  id: number;
  employee_id: string;
  full_name: string;
  email: string;
  mobile_number: string;
  role: UserRole;
  designation: string;
  is_active: boolean;
  joining_date: string;
  company_id?: number;
  company_name?: string;
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
  company_name?: string;
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
  total_hours?: number;
  total_hours_worked?: number;
  total_hours_remaining?: number;
  my_hours_worked?: number;
  owner_company_id?: number;
  owner_company_name?: string;
  participating_companies?: Company[];
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
  company_id?: number;
  company_name?: string;
}

export interface ManagedProjectBase {
  id: number;
  name: string;
  code: string;
  status: string;
}

export interface ReportingManager {
  id: number;
  full_name: string;
  email: string;
  mobile_number?: string;
  designation?: string;
  status: 'active' | 'inactive';
  company_id?: number;
  company_name?: string;
  created_at: string;
  updated_at: string;
  managed_projects?: ManagedProjectBase[];
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

export interface NoteWorkspace {
  id: number;
  user_id: number;
  page_count: number;
  created_at: string;
  updated_at: string;
}

export interface NotePage {
  id: number;
  workspace_id: number;
  title: string;
  content: string | null;
  category: string;
  is_pinned: boolean;
  is_archived: boolean;
  checklist_items: NoteChecklistItem[];
  created_at: string;
  updated_at: string;
}

export interface NoteChecklistItem {
  id: number;
  page_id: number;
  text: string;
  is_completed: boolean;
  completed_at: string | null;
  sort_order: number;
}

export interface AdminWorkspaceOverview {
  id: number;
  user_id: number;
  user_name: string;
  email: string;
  designation: string | null;
  page_count: number;
  total_tasks: number;
  completed_tasks: number;
  last_activity: string | null;
}

// Phase 12B/C New Types

export type TaskStatus = 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'BLOCKED' | 'REVIEW' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Deliverable {
  id: number;
  project_id: number;
  name: string;
  description?: string;
  status: string;
  is_active: boolean;
  target_date?: string;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: number;
  project_id: number;
  deliverable_id?: number;
  assignee_id?: number;
  creator_id: number;
  title: string;
  description?: string;
  estimated_hours: number;
  actual_hours: number;
  status: TaskStatus;
  priority: TaskPriority;
  is_active: boolean;
  due_date?: string;
  created_at: string;
  updated_at: string;
  
  // Relations mapped by API (optional)
  deliverable?: Deliverable;
}

export interface ResourceAllocation {
  id: number;
  project_id: number;
  user_id: number;
  allocated_hours_per_week: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TaskComment {
  id: number;
  task_id: number;
  user_id: number;
  comment: string;
  created_at: string;
  updated_at: string;
  user?: Partial<User>; // populated by API if needed, or matched manually
}
