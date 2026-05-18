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
  UserPlus
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
import { format } from 'date-fns';

const projectSchema = z.object({
  name: z.string().min(2, 'Project Name is required'),
  code: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(['planning', 'active', 'on-hold', 'completed']),
  start_date: z.string().optional().nullable(),
  end_date: z.string().optional().nullable(),
  reporting_manager_id: z.string().optional().nullable(),
  member_ids: z.array(z.number()),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

export default function ProjectListPage() {
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

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: '',
      code: '',
      description: '',
      status: 'planning',
      start_date: '',
      end_date: '',
      reporting_manager_id: '',
      member_ids: [],
    }
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [projectData, managerData, employeeData] = await Promise.all([
        projectService.getProjects({ 
          page: 1, 
          limit: 1000, 
          search: searchTerm,
          status_filter: statusFilter === 'all' ? undefined : statusFilter,
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
  }, [searchTerm, statusFilter, managerFilter]);

  const onSubmit = async (values: ProjectFormValues) => {
    try {
      setIsSubmitting(true);
      const payload = {
        ...values,
        reporting_manager_id: values.reporting_manager_id ? parseInt(values.reporting_manager_id) : null,
        start_date: values.start_date ? new Date(values.start_date).toISOString() : null,
        end_date: values.end_date ? new Date(values.end_date).toISOString() : null,
      };

      if (editingProject) {
        await projectService.updateProject(editingProject.id, payload);
        toast.success('Project parameters updated');
      } else {
        await projectService.createProject(payload);
        toast.success('New project initialized');
      }
      setIsModalOpen(false);
      setEditingProject(null);
      form.reset();
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to sync project');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    form.reset({
      name: project.name,
      code: project.code,
      description: project.description || '',
      status: project.status,
      start_date: project.start_date ? format(new Date(project.start_date), 'yyyy-MM-dd') : '',
      end_date: project.end_date ? format(new Date(project.end_date), 'yyyy-MM-dd') : '',
      reporting_manager_id: project.reporting_manager_id?.toString() || '',
      member_ids: project.members?.map(m => m.id) || [],
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to terminate this project node?')) {
      try {
        await projectService.deleteProject(id);
        toast.success('Project decommissioned');
        fetchData();
      } catch (error) {
        toast.error('Failed to terminate node');
      }
    }
  };

  return (
    <div className="space-y-8 p-1">
      {/* Header Section */}
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-1">
             <div className="h-1.5 w-8 bg-blue-600 rounded-full"></div>
             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">Project Management</span>
          </div>
          <h2 className="text-4xl font-black tracking-tight text-slate-900 uppercase leading-none">
            Project <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">List</span>
          </h2>
          <p className="text-slate-500 font-medium text-base">Manage all company projects and team assignments.</p>
        </div>
        <div className="flex items-center gap-4">
          <Button 
            onClick={() => {
              setEditingProject(null);
              form.reset({
                name: '',
                code: '',
                description: '',
                status: 'planning',
                start_date: '',
                end_date: '',
                reporting_manager_id: '',
                member_ids: [],
              });
              setIsModalOpen(true);
            }}
            className="bg-slate-900 text-white hover:bg-slate-800 rounded-2xl h-14 px-8 shadow-2xl shadow-slate-900/10 transition-all hover:-translate-y-1 active:scale-95 group"
          >
            <Plus className="mr-2 h-5 w-5 group-hover:rotate-90 transition-transform" /> 
            <span className="font-bold uppercase tracking-wider text-xs">Add New Project</span>
          </Button>
        </div>
      </div>

      {/* Main Table Card */}
      <Card className="border-none rounded-[2.5rem] shadow-2xl shadow-slate-200/50 overflow-hidden bg-white/80 backdrop-blur-xl border border-white">
        <CardHeader className="bg-slate-50/40 p-8 border-b border-slate-100">
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative flex-1 min-w-[300px] group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                <Input 
                  placeholder="Search projects..." 
                  className="pl-14 h-14 bg-white rounded-2xl border-slate-200/60 focus-visible:ring-blue-500/20 text-sm font-medium transition-all shadow-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-3">
                <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val || 'all')}>
                  <SelectTrigger className="h-12 w-[140px] rounded-xl border-slate-200 bg-white hover:bg-slate-50 transition-all font-bold text-xs uppercase tracking-wider flex justify-between px-4 group">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-slate-100 shadow-2xl p-2">
                    <SelectItem value="all" className="rounded-xl py-2.5 font-bold text-xs uppercase tracking-wider">All</SelectItem>
                    <SelectItem value="planning" className="rounded-xl py-2.5 font-bold text-xs uppercase tracking-wider">Planning</SelectItem>
                    <SelectItem value="active" className="rounded-xl py-2.5 font-bold text-xs uppercase tracking-wider">Active</SelectItem>
                    <SelectItem value="on-hold" className="rounded-xl py-2.5 font-bold text-xs uppercase tracking-wider">On Hold</SelectItem>
                    <SelectItem value="completed" className="rounded-xl py-2.5 font-bold text-xs uppercase tracking-wider">Completed</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={managerFilter} onValueChange={(val) => setManagerFilter(val || 'all')}>
                  <SelectTrigger className="h-12 w-[160px] rounded-xl border-slate-200 bg-white hover:bg-slate-50 transition-all font-bold text-xs uppercase tracking-wider flex justify-between px-4">
                    <SelectValue placeholder="Manager" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-slate-100 shadow-2xl p-2">
                    <SelectItem value="all" className="rounded-xl py-2.5 font-bold text-xs uppercase tracking-wider">All</SelectItem>
                    {managers.map(m => (
                      <SelectItem key={m.id} value={m.id.toString()} className="rounded-xl py-2.5 font-bold text-xs uppercase tracking-wider">
                        {m.full_name.split(' ')[0]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="px-6 py-4 rounded-2xl bg-slate-900 text-white hidden sm:flex items-center gap-3 shadow-xl shadow-slate-900/10">
                   <Briefcase className="h-4 w-4 text-blue-400" />
                   <span className="text-[10px] font-black uppercase tracking-widest leading-none">{total} Projects</span>
                </div>
              </div>
            </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="border-slate-100 hover:bg-transparent">
                <TableHead className="text-[10px] uppercase font-black text-slate-400 py-6 px-10 tracking-[0.2em] w-[120px]">Code</TableHead>
                <TableHead className="text-[10px] uppercase font-black text-slate-400 py-6 tracking-[0.2em]">Project Name</TableHead>
                <TableHead className="text-[10px] uppercase font-black text-slate-400 py-6 tracking-[0.2em]">Reporting Manager</TableHead>
                <TableHead className="text-[10px] uppercase font-black text-slate-400 py-6 tracking-[0.2em]">Members</TableHead>
                <TableHead className="text-[10px] uppercase font-black text-slate-400 py-6 tracking-[0.2em]">Timeline</TableHead>
                <TableHead className="text-[10px] uppercase font-black text-slate-400 py-6 text-right px-10 tracking-[0.2em]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-slate-50">
                    <TableCell colSpan={6} className="h-24 text-center">
                       <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-200" />
                    </TableCell>
                  </TableRow>
                ))
              ) : projects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-60 text-center">
                    <div className="flex flex-col items-center justify-center space-y-4 opacity-40">
                       <Briefcase className="h-16 w-16 text-slate-300" />
                       <p className="text-sm font-bold text-slate-500 uppercase tracking-widest italic">Zero Projects Found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                projects.map((project, i) => (
                  <motion.tr
                    key={project.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.3 }}
                    className="group border-slate-50 hover:bg-blue-50/30 transition-all"
                  >
                    <TableCell className="py-6 px-10">
                      <span className="text-[11px] font-black bg-slate-900 text-white px-3 py-1.5 rounded-lg uppercase tracking-wider">{project.code}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className={cn("h-3 w-3 rounded-full shrink-0 shadow-sm", 
                          project.status === 'active' ? "bg-emerald-500 shadow-emerald-200" :
                          project.status === 'planning' ? "bg-blue-500 shadow-blue-200" :
                          project.status === 'on-hold' ? "bg-amber-500 shadow-amber-200" :
                          "bg-slate-900 shadow-slate-200"
                        )} title={project.status.toUpperCase()} />
                        <span className="text-base font-black text-slate-800 group-hover:text-blue-600 transition-colors tracking-tight leading-none">{project.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                        <UserCheck className="h-3.5 w-3.5 text-blue-500" /> 
                        {project.reporting_manager?.full_name.split(' ')[0] || 'Unassigned'}
                      </div>
                    </TableCell>
                    <TableCell>
                       <div className="flex flex-col">
                         <span className="text-[11px] font-black text-slate-800 uppercase leading-none">
                           {project.members.length > 0 
                             ? project.members.map(m => m.full_name.split(' ')[0]).slice(0, 2).join(', ') + (project.members.length > 2 ? '...' : '')
                             : 'Empty'}
                         </span>
                         <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-1">{project.members.length} Members</span>
                       </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                           <Calendar className="h-3 w-3 text-blue-400" />
                           {project.start_date ? format(new Date(project.start_date), 'dd MMM yy') : 'TBD'}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                           <Clock className="h-3 w-3 text-slate-300" />
                           {project.end_date ? format(new Date(project.end_date), 'dd MMM yy') : 'Ongoing'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right px-10">
                      <DropdownMenu>
                        <DropdownMenuTrigger className="h-10 w-10 rounded-xl flex items-center justify-center hover:bg-white hover:shadow-md text-slate-400 hover:text-blue-600 transition-all">
                          <MoreVertical className="h-5 w-5" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 rounded-[1.5rem] p-2 shadow-2xl border-slate-100">
                          <DropdownMenuItem 
                            onClick={() => handleEdit(project)}
                            className="text-xs font-bold py-3 px-4 rounded-xl cursor-pointer"
                          >
                            <Edit2 className="mr-3 h-4 w-4 text-blue-500" /> Edit Project
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="my-1 bg-slate-50" />
                          <DropdownMenuItem 
                            onClick={() => handleDelete(project.id)}
                            className="text-xs font-bold py-3 px-4 rounded-xl text-red-600 focus:bg-red-50 focus:text-red-700 cursor-pointer"
                          >
                            <Trash2 className="mr-3 h-4 w-4" /> Delete Project
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </motion.tr>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Deployment Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[850px] p-0 overflow-hidden border-none shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)] rounded-[2.5rem] bg-white">
          <div className="bg-gradient-to-br from-blue-700 to-indigo-900 p-10 text-white relative">
             <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
             <div className="flex items-center gap-8 relative z-10">
               <div className="h-20 w-20 bg-white/10 rounded-[2rem] backdrop-blur-md flex items-center justify-center border border-white/20 shadow-2xl">
                 <Briefcase className="h-10 w-10 text-white" />
               </div>
               <div>
                 <DialogTitle className="text-4xl font-black uppercase tracking-tight leading-tight">
                   {editingProject ? 'Edit Project' : 'Add New Project'}
                 </DialogTitle>
                 <DialogDescription className="text-blue-200 font-bold uppercase text-[10px] tracking-[0.2em] mt-2">
                   {editingProject ? 'Update project information' : 'Fill in the details to create a new project'}
                 </DialogDescription>
               </div>
             </div>
          </div>
          
          <div className="max-h-[65vh] overflow-y-auto p-12 custom-scrollbar">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="space-y-4">
                        <FormLabel className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] flex items-center gap-2">
                           <FileText className="h-3 w-3" /> Project Name <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Enter high-level name..." {...field} className="h-16 rounded-2xl border-slate-200/80 bg-slate-50/50 focus:bg-white text-base font-bold transition-all shadow-sm" />
                        </FormControl>
                        <FormMessage className="text-[10px] font-bold text-red-500" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem className="space-y-4">
                        <FormLabel className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] flex items-center gap-2">
                           <ShieldCheck className="h-3 w-3" /> System Code <span className="text-slate-300 font-medium lowercase">(Auto-generated if empty)</span>
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. ARK-001 (Optional)" {...field} value={field.value || ''} className="h-16 rounded-2xl border-slate-200/80 bg-slate-50/50 focus:bg-white text-base font-bold transition-all uppercase tracking-widest shadow-sm" />
                        </FormControl>
                        <FormMessage className="text-[10px] font-bold text-red-500" />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem className="space-y-4">
                        <FormLabel className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] flex items-center gap-2">
                           <Filter className="h-3 w-3" /> Project Status <span className="text-red-500">*</span>
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-16 w-full rounded-2xl border-slate-200/80 bg-slate-50/50 focus:ring-0 text-base font-bold shadow-sm">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="rounded-2xl shadow-2xl border-slate-100">
                            <SelectItem value="planning" className="py-3 px-4 font-bold text-blue-600 focus:bg-blue-50">Planning</SelectItem>
                            <SelectItem value="active" className="py-3 px-4 font-bold text-emerald-600 focus:bg-emerald-50">Active</SelectItem>
                            <SelectItem value="on-hold" className="py-3 px-4 font-bold text-amber-600 focus:bg-amber-50">On Hold</SelectItem>
                            <SelectItem value="completed" className="py-3 px-4 font-bold text-slate-900 focus:bg-slate-100">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-[10px] font-bold text-red-500" />
                      </FormItem>
                    )}
                  />
                  <div className="hidden md:block"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <FormField
                    control={form.control}
                    name="start_date"
                    render={({ field }) => (
                      <FormItem className="space-y-4">
                        <FormLabel className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] flex items-center gap-2">
                           <Calendar className="h-3 w-3" /> Start Date
                        </FormLabel>
                        <FormControl>
                          <Input type="date" {...field} value={field.value || ''} className="h-16 rounded-2xl border-slate-200/80 bg-slate-50/50 text-base font-bold shadow-sm" />
                        </FormControl>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="end_date"
                    render={({ field }) => (
                      <FormItem className="space-y-4">
                        <FormLabel className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] flex items-center gap-2">
                           <Clock className="h-3 w-3" /> End Date
                        </FormLabel>
                        <FormControl>
                          <Input type="date" {...field} value={field.value || ''} className="h-16 rounded-2xl border-slate-200/80 bg-slate-50/50 text-base font-bold shadow-sm" />
                        </FormControl>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="reporting_manager_id"
                  render={({ field }) => (
                    <FormItem className="space-y-4">
                      <FormLabel className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] flex items-center gap-2">
                         <UserCheck className="h-3 w-3" /> Select Reporting Manager
                      </FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value ? String(field.value) : ""}
                      >
                        <FormControl>
                          <SelectTrigger className="h-16 w-full rounded-2xl border-slate-200/80 bg-slate-50/50 text-base font-bold shadow-sm">
                            <SelectValue placeholder="Assign a manager" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-2xl shadow-2xl border-slate-100">
                          {managers.map(m => (
                            <SelectItem key={m.id} value={String(m.id)} className="py-3 px-4 font-bold">
                              {m.full_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />

                <div className="space-y-6">
                  <FormLabel className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] flex items-center gap-2">
                     <Users className="h-3 w-3" /> Select Team Members
                  </FormLabel>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-8 rounded-[2.5rem] bg-slate-50/50 border border-slate-100 max-h-[350px] overflow-y-auto custom-scrollbar">
                    {employees.map((employee) => (
                      <FormField
                        key={employee.id}
                        control={form.control}
                        name="member_ids"
                        render={({ field }) => {
                          return (
                            <FormItem className="flex flex-row items-center space-x-4 space-y-0 p-5 rounded-2xl hover:bg-white transition-all cursor-pointer border border-transparent hover:border-slate-100 hover:shadow-xl hover:shadow-slate-200/50">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(employee.id)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, employee.id])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== employee.id
                                          )
                                        )
                                  }}
                                  className="h-5 w-5 rounded-md border-slate-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                />
                              </FormControl>
                              <div className="flex items-center gap-4">
                                <Avatar className="h-10 w-10 border-none shadow-sm">
                                  <AvatarFallback className="bg-slate-200 text-slate-600 text-[10px] font-black uppercase">
                                    {employee.full_name.split(' ').map(n => n[0]).join('')}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                  <span className="text-sm font-black text-slate-800 leading-none mb-1">{employee.full_name.split(' ')[0]}</span>
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{employee.designation || 'Specialist'}</span>
                                </div>
                              </div>
                            </FormItem>
                          )
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-6 pt-10 border-t border-slate-100">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={() => setIsModalOpen(false)}
                    className="h-16 px-10 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] text-slate-400 hover:text-slate-900 transition-colors"
                  >
                    Discard Changes
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="h-16 px-12 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-[11px] tracking-[0.2em] shadow-2xl shadow-blue-200 transition-all hover:-translate-y-1 active:scale-95 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-3">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>{editingProject ? 'Saving...' : 'Creating...'}</span>
                      </div>
                    ) : (
                      editingProject ? 'Save Changes' : 'Create Project'
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
