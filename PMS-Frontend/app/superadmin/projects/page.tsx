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
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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
import { reportingManagerService } from '@/services/reportingManagerService';
import { employeeService } from '@/services/employeeService';
import { Project, ReportingManager, Employee } from '@/types';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import axios from 'axios';
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
  const [managers, setManagers] = useState<ReportingManager[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
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
      const [projectData, managerData, employeeData] = await Promise.all([
        projectService.getProjects({ 
          page: 1, 
          limit: 1000, 
          search: searchTerm,
          status: statusFilter === 'all' ? undefined : statusFilter,
          manager_id: managerFilter === 'all' ? undefined : Number(managerFilter)
        }),
        reportingManagerService.getReportingManagers({ limit: 1000, status_filter: 'active' }),
        employeeService.getEmployees({ limit: 1000, status_filter: true })
      ]);

      setProjects(projectData.items);
      setTotal(projectData.total);
      setManagers(managerData.items);
      setEmployees(employeeData.items);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load data');
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
    <div className="space-y-8 p-1">
      {/* Header Section */}
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Projects
          </h2>
          <p className="text-slate-500 text-sm">Manage all company projects and team assignments.</p>
        </div>
        <div className="flex items-center gap-4">
          <Button 
            onClick={() => {
              setEditingProject(null);
              setIsModalOpen(true);
            }}
            className="bg-indigo-600 text-white hover:bg-indigo-700 rounded-md h-9 px-4 shadow-sm transition-all hover:-translate-y-0.5 active:scale-95 group"
          >
            <Plus className="mr-2 h-4 w-4" /> 
            <span className="text-sm font-medium">Add Project</span>
          </Button>
        </div>
      </div>

      {/* Main Table Card */}
      <Card className="border border-slate-200 rounded-xl shadow-sm overflow-hidden bg-white">
        <CardHeader className="bg-white p-4 sm:p-6 border-b border-slate-100">
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
              <div className="flex flex-col sm:flex-row flex-wrap items-center gap-3 w-full xl:w-auto">
                <div className="relative w-full sm:w-64 shrink-0">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    placeholder="Search projects..." 
                    className="pl-9 h-9 rounded-md border-slate-200 text-sm focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="w-full sm:w-[140px] shrink-0">
                  <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val || 'all')}>
                    <SelectTrigger className="w-full h-9 rounded-md border-slate-200 text-sm font-medium text-slate-700 text-left min-w-0">
                      <SelectValue placeholder="Project Status" className="truncate">
                        {statusFilter === 'all' ? 'Project Status' : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1).replace('-', ' ')}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="rounded-md border-slate-200 shadow-lg max-h-[300px]">
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
                    <SelectTrigger className="w-full h-9 rounded-md border-slate-200 text-sm font-medium text-slate-700 text-left min-w-0">
                      <SelectValue placeholder="Reporting Manager" className="truncate">
                        {managerFilter === 'all' 
                          ? 'Reporting Manager' 
                          : managers?.find(m => m.id.toString() === managerFilter)?.full_name || 'Reporting Manager'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="rounded-md border-slate-200 shadow-lg max-h-[300px] w-[90vw] sm:w-[250px]">
                      <SelectItem value="all" className="text-sm font-medium">Reporting Manager</SelectItem>
                      {managers?.map(m => (
                        <SelectItem key={m.id} value={m.id.toString()} className="text-sm font-medium">
                          {m.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="px-3 py-1.5 rounded-md bg-slate-50 text-slate-600 hidden sm:flex items-center gap-2 border border-slate-200 shrink-0">
                 <Briefcase className="h-4 w-4 text-slate-400" />
                 <span className="text-sm font-semibold">{total} Projects</span>
              </div>
            </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50 border-b border-slate-200">
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="text-xs font-semibold text-slate-500 py-4 px-6 w-[120px]">Project ID</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 py-4">Project Name</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 py-4">Reporting Manager</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 py-4">Team Size</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 py-4">Hours</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 py-4">Timeline</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 py-4 text-right px-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-slate-50">
                    <TableCell colSpan={7} className="h-24 text-center">
                       <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-200" />
                    </TableCell>
                  </TableRow>
                ))
              ) : !projects || projects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-60 text-center">
                    <div className="flex flex-col items-center justify-center space-y-4 opacity-40">
                       <Briefcase className="h-16 w-16 text-slate-300" />
                       <p className="text-sm font-bold text-slate-500 uppercase tracking-widest italic">Zero Projects Found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                projects.map((project, i) => (
                  <TableRow
                    key={project.id}
                    onClick={() => router.push(`/superadmin/projects/${project.id}`)}
                    className="group border-b border-slate-100 hover:bg-slate-50/50 transition-colors cursor-pointer"
                  >
                    <TableCell className="py-4 px-6">
                      <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-2 py-1 rounded-md">{project.code}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className={cn("h-2 w-2 rounded-full shrink-0", 
                          project.status === 'active' ? "bg-emerald-500" :
                          project.status === 'planning' ? "bg-indigo-500" :
                          project.status === 'on-hold' ? "bg-amber-500" :
                          "bg-slate-500"
                        )} title={project.status.toUpperCase()} />
                        <span className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">{project.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <UserCheck className="h-4 w-4 text-slate-400" /> 
                        {project.reporting_manager?.full_name.split(' ')[0] || 'Unassigned'}
                      </div>
                    </TableCell>
                     <TableCell>
                       <div className="flex items-center gap-2">
                         <Users className="h-4 w-4 text-slate-400" />
                         <span className="text-sm font-medium text-slate-700">
                           {project.members?.length || 0} {(project.members?.length === 1) ? 'Member' : 'Members'}
                         </span>
                       </div>
                    </TableCell>
                     <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-medium text-slate-700">
                            {project.total_hours_worked || 0} / {project.total_hours || 0} hrs
                          </span>
                          {((project.total_hours_remaining ?? 0) < 0) ? (
                            <span className="text-xs font-medium text-red-500 flex items-center gap-1">
                              <AlertCircle className="w-3.5 h-3.5" /> Over budget ({(project.total_hours_remaining || 0) * -1})
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">
                              {project.total_hours_remaining || 0} left
                            </span>
                          )}
                        </div>
                     </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                           <Calendar className="h-3.5 w-3.5 text-slate-400" />
                           {project.start_date ? format(new Date(project.start_date), 'dd MMM yy') : 'TBD'}
                        </div>
                        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                           <Clock className="h-3.5 w-3.5 text-slate-300" />
                           {project.end_date ? format(new Date(project.end_date), 'dd MMM yy') : 'Ongoing'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right px-6">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/superadmin/projects/${project.id}`);
                          }}
                          className="h-8 w-8 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(project);
                          }}
                          className="h-8 w-8 rounded-md text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                          title="Edit Project"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            confirmDelete(project);
                          }}
                          className="h-8 w-8 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>

      {/* Deployment Modal */}
      <ProjectFormModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingProject={editingProject}
        managers={managers}
        employees={employees}
        onSuccess={fetchData}
      />

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        onConfirm={handleDelete}
        itemName={`Project "${projectToDelete?.name}"`}
        isDeleting={isDeleting}
      />
    </div>
  );
}
