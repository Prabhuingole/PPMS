'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Trash2,
  Edit2,
  Loader2,
  Briefcase,
  Calendar,
  Users,
  UserCheck,
  Building2,
  FileText,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  PauseCircle,
  ShieldCheck,
  ChevronRight,
  UserPlus,
  Download,
  Upload,
  File,
  X,
  Eye,
  MoreHorizontal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/ui/data-table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { ManagementLayout } from '@/components/layout/ManagementLayout';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { DeleteConfirmationModal } from "@/components/ui/delete-confirmation-modal";
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { projectService } from '@/services/projectService';
import { employeeService } from '@/services/employeeService';
import { Project, ReportingManager, Employee } from '@/types';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '@/services/api';
import { handleApiError } from '@/utils/handleApiError';
import { ErrorState } from '@/components/ui/error-state';
import { format } from 'date-fns';
import { useWebSocketEvent } from '@/hooks/useWebSocketEvent';
import { useAuthStore } from '@/store/authStore';
import { useRouter, useSearchParams } from 'next/navigation';
import { ProjectFormModal } from './ProjectFormModal';

export default function ProjectListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token } = useAuthStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [reportingManagers, setReportingManagers] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isError, setIsError] = useState(false);
  const [managerFilter, setManagerFilter] = useState<string>('all');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useWebSocketEvent('PROJECTS_UPDATED', () => setRefreshTrigger(prev => prev + 1));

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setIsError(false);
      const [projectData, employeeData, rmData] = await Promise.all([
        projectService.getProjects({ 
          page: 1, 
          limit: 1000, 
          search: searchTerm,
          status: statusFilter === 'all' ? undefined : statusFilter,
          manager_id: managerFilter === 'all' ? undefined : Number(managerFilter)
        }),
        employeeService.getEmployees({ limit: 1000, status_filter: true }),
        employeeService.getEmployees({ limit: 1000, is_reporting_manager: true, status_filter: true })
      ]);

      setProjects(projectData.items);
      setTotal(projectData.total);
      setEmployees(employeeData.items);
      setReportingManagers(rmData.items);
    } catch (error) {
      setIsError(true);
      toast.error('Failed to load projects data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, statusFilter, managerFilter, refreshTrigger]);

  useEffect(() => {
    if (projects.length > 0) {
      const editId = searchParams.get('edit');
      if (editId) {
        const proj = projects.find(p => p.id.toString() === editId);
        if (proj) {
          handleEdit(proj);
          window.history.replaceState({}, '', '/superadmin/projects');
        }
      }
    }
  }, [projects, searchParams]);

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setIsModalOpen(true);
  };

  const confirmDelete = (project: Project) => {
    setProjectToDelete(project);
    setTimeout(() => setDeleteModalOpen(true), 0);
  };

  const handleDelete = async () => {
    if (!projectToDelete) return;
    setIsDeleting(true);
    try {
      await projectService.deleteProject(projectToDelete.id);
      toast.success('Project decommissioned');
      fetchData();
    } catch (error) {
      toast.error('Failed to terminate node');
    } finally {
      setIsDeleting(false);
      setDeleteModalOpen(false);
      setProjectToDelete(null);
    }
  };

  return (
    <>
    <ManagementLayout
      title="Projects"
      description="Manage all company projects and team assignments."
      headerActions={
        <Button 
          onClick={() => {
            setEditingProject(null);
            setIsModalOpen(true);
          }}
          className="bg-primary text-white hover:bg-indigo-700 rounded-lg h-10 px-5 shadow-sm transition-all text-sm font-semibold"
        >
          <Plus className="mr-2 h-4 w-4" /> Add Project
        </Button>
      }
    >
      <DataTable
        data={projects}
        isLoading={loading}
        searchPlaceholder="Search projects..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        filters={
          <>
            <div className="w-full sm:w-[140px] shrink-0">
              <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val || 'all')}>
                <SelectTrigger className="w-full h-10 bg-background rounded-lg border-border text-sm font-medium text-muted-foreground text-left min-w-0 shadow-sm">
                  <SelectValue placeholder="Project Status" className="truncate">
                    {statusFilter === 'all' ? 'Project Status' : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1).replace('-', ' ')}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="rounded-md border-border shadow-lg max-h-[300px]">
                  <SelectItem value="all" className="text-sm font-medium">Project Status</SelectItem>
                  <SelectItem value="planning" className="text-sm font-medium">Planning</SelectItem>
                  <SelectItem value="active" className="text-sm font-medium">Active</SelectItem>
                  <SelectItem value="on-hold" className="text-sm font-medium">On Hold</SelectItem>
                  <SelectItem value="completed" className="text-sm font-medium">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-full sm:w-[160px] lg:w-[200px] shrink-0">
              <Select value={managerFilter} onValueChange={(val) => setManagerFilter(val || 'all')}>
                <SelectTrigger className="w-full h-10 bg-background rounded-lg border-border text-sm font-medium text-muted-foreground text-left min-w-0 shadow-sm">
                  <SelectValue placeholder="Reporting Manager" className="truncate">
                    {managerFilter === 'all' 
                      ? 'Reporting Manager' 
                      : reportingManagers?.find((m: any) => m.id.toString() === managerFilter)?.full_name || 'Reporting Manager'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="rounded-md border-border shadow-lg max-h-[300px] w-[90vw] sm:w-[250px]">
                  <SelectItem value="all" className="text-sm font-medium">Reporting Manager</SelectItem>
                  {reportingManagers?.map((m: any) => (
                    <SelectItem key={m.id} value={m.id.toString()} className="text-sm font-medium">
                      {m.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        }
        toolbarActions={
          <div className="h-10 px-4 flex items-center justify-center rounded-lg bg-background border border-border text-muted-foreground shadow-sm shrink-0 font-medium text-sm">
            Total: {total}
          </div>
        }
        emptyState={
          isError ? (
            <ErrorState title="Failed to load projects" description="We encountered an error while trying to retrieve project data." onRetry={fetchData} />
          ) : (
            <EmptyState
              icon={Briefcase}
              title="No Projects Found"
              description="There are currently no projects matching your criteria."
              className="border-0 rounded-none w-full min-h-[400px]"
            />
          )
        }
        onRowClick={(project) => router.push(`/superadmin/projects/${project.id}`)}
        columns={[
          {
            header: 'Project ID',
            accessorKey: 'code',
            sortable: true,
            width: '120px',
            cell: (project) => (
              <span className="text-xs font-semibold bg-muted text-foreground px-2 py-1 rounded-md">{project.code}</span>
            )
          },
          {
            header: 'Project Name',
            accessorKey: 'name',
            sortable: true,
            cell: (project) => (
              <div className="flex items-center gap-3">
                <div className={cn("h-2.5 w-2.5 rounded-full shrink-0 shadow-sm", 
                  project.status === 'active' ? "bg-emerald-500" :
                  project.status === 'planning' ? "bg-indigo-500" :
                  project.status === 'on-hold' ? "bg-amber-500" :
                  "bg-muted/300"
                )} title={project.status.toUpperCase()} />
                <span className="text-sm font-black text-foreground group-hover:text-primary transition-colors">{project.name}</span>
              </div>
            )
          },
          {
            header: 'Reporting Manager',
            accessorKey: 'reporting_manager',
            sortable: true,
            hideOnMobile: true,
            cell: (project) => (
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                <UserCheck className="h-3.5 w-3.5 text-muted-foreground" /> 
                {project.reporting_manager?.full_name.split(' ')[0] || 'Unassigned'}
              </div>
            )
          },
          {
            header: 'Team Size',
            accessorKey: 'members',
            sortable: true,
            hideOnMobile: true,
            cell: (project) => (
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                <span>
                  {project.members?.length || 0} {(project.members?.length === 1) ? 'Member' : 'Members'}
                </span>
              </div>
            )
          },
          {
            header: 'Hours',
            accessorKey: 'total_hours',
            sortable: true,
            cell: (project) => (
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-foreground">
                  {Number((project.total_hours_worked || 0).toFixed(2))} / {Number((project.total_hours || 0).toFixed(2))} <span className="opacity-70 font-bold ml-0.5">hr</span>
                </span>
                {((project.total_hours_remaining ?? 0) < 0) ? (
                  <span className="text-[10px] font-bold text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" /> <span className="truncate">Over budget ({Number(((project.total_hours_remaining || 0) * -1).toFixed(2))}<span className="opacity-70 font-bold ml-0.5">hr</span>)</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold text-muted-foreground">
                    {Number((project.total_hours_remaining || 0).toFixed(2))}<span className="opacity-70 font-bold ml-0.5">hr</span> left
                  </span>
                )}
              </div>
            )
          },
          {
            header: 'Timeline',
            accessorKey: 'start_date',
            sortable: true,
            hideOnMobile: true,
            cell: (project) => (
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-600">
                   <Calendar className="h-3 w-3 text-muted-foreground" />
                   {project.start_date ? format(new Date(project.start_date), 'dd MMM yy') : 'TBD'}
                </div>
                <div className="flex items-center gap-2 text-[10px] font-semibold text-muted-foreground">
                   <Clock className="h-3 w-3 text-slate-300" />
                   {project.end_date ? format(new Date(project.end_date), 'dd MMM yy') : 'Ongoing'}
                </div>
              </div>
            )
          },
          {
            header: 'Actions',
            align: 'right',
            width: '50px',
            cell: (project) => (
              <div onClick={(e) => e.stopPropagation()} className="flex items-center justify-end ">
                <DropdownMenu>
                  <DropdownMenuTrigger className="h-8 w-8 p-0 inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground">
<span className="sr-only">Open menu</span>
<MoreHorizontal className="h-4 w-4" />
</DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/superadmin/projects/${project.id}`);
                      }}
                      className="cursor-pointer"
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(project);
                      }}
                      className="cursor-pointer"
                    >
                      <Edit2 className="mr-2 h-4 w-4" />
                      Edit Project
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.stopPropagation();
                        confirmDelete(project);
                      }}
                      className="cursor-pointer text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )
          }
        ]}
      />
    </ManagementLayout>

      {/* Deployment Modal */}
      <ProjectFormModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingProject={editingProject}
        employees={employees}
        reportingManagers={reportingManagers}
        onSuccess={fetchData}
      />

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        onConfirm={handleDelete}
        itemName={`Project "${projectToDelete?.name}"`}
        isDeleting={isDeleting}
      />
    </>
  );
}

