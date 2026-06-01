'use client';

import { useState, useEffect } from 'react';
import { 
  Briefcase,
  Calendar,
  Users,
  UserCheck,
  FileText,
  Filter,
  Clock,
  ShieldCheck,
  Download,
  Upload,
  File as FileIcon,
  X,
  Eye,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { projectService } from '@/services/projectService';
import { Project, ReportingManager, Employee } from '@/types';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import axios from 'axios';
import { format, differenceInDays } from 'date-fns';
import { useAuthStore } from '@/store/authStore';

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  'PRD': 'Product Requirement Document',
  'Scope': 'Scope of Work (SOW)',
  'JDR': 'Joint Design Record',
  'BRD': 'Business Requirement Document',
  'FRS': 'Functional Requirement Specification',
  'Req Gathering': 'Requirements Gathering',
  'Other': 'Other Document'
};

const projectSchema = z.object({
  name: z.string().min(2, 'Project Name is required'),
  code: z.string().min(2, 'Project ID is required'),
  description: z.string().optional(),
  status: z.enum(['planning', 'active', 'on-hold', 'completed']),
  start_date: z.string().optional().nullable(),
  end_date: z.string().optional().nullable(),
  total_hours: z.coerce.number().optional(),
  reporting_manager_id: z.string().optional().nullable(),
  member_ids: z.array(z.number()),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

interface ProjectFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingProject: Project | null;
  managers: ReportingManager[];
  employees: Employee[];
  onSuccess: () => void;
}

export function ProjectFormModal({
  isOpen,
  onClose,
  editingProject,
  managers,
  employees,
  onSuccess
}: ProjectFormModalProps) {
  const { token } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Document upload state
  type PendingDoc = {
    id: string;
    file: File;
    docType: string;
    displayName: string;
    prepDate: string;
  };
  const [pendingDocs, setPendingDocs] = useState<PendingDoc[]>([]);
  const [projectDocs, setProjectDocs] = useState<any[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState<boolean>(false);

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: '',
      code: '',
      description: '',
      status: 'planning',
      start_date: '',
      end_date: '',
      total_hours: 0,
      reporting_manager_id: '',
      member_ids: [],
    }
  });

  const startDate = form.watch('start_date');
  const endDate = form.watch('end_date');
  const calculatedDays = startDate && endDate 
    ? Math.max(0, differenceInDays(new Date(endDate), new Date(startDate))) 
    : 0;

  // Effect to populate form when modal opens or editingProject changes
  useEffect(() => {
    if (isOpen) {
      if (editingProject) {
        form.reset({
          name: editingProject.name,
          code: editingProject.code,
          description: editingProject.description || '',
          status: editingProject.status,
          start_date: editingProject.start_date ? format(new Date(editingProject.start_date), 'yyyy-MM-dd') : '',
          end_date: editingProject.end_date ? format(new Date(editingProject.end_date), 'yyyy-MM-dd') : '',
          total_hours: editingProject.total_hours || 0,
          reporting_manager_id: editingProject.reporting_manager_id?.toString() || '',
          member_ids: editingProject.members?.map(m => m.id) || [],
        });
        
        setIsLoadingDocs(true);
        axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/documents/project/${editingProject.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        }).then(res => {
          setProjectDocs(res.data);
        }).catch(console.error).finally(() => setIsLoadingDocs(false));
      } else {
        form.reset({
          name: '',
          code: `SAM-${Math.floor(1000 + Math.random() * 9000)}`,
          description: '',
          status: 'planning',
          start_date: '',
          end_date: '',
          total_hours: 0,
          reporting_manager_id: '',
          member_ids: [],
        });
        setProjectDocs([]);
      }
      
      setPendingDocs([]);
    }
  }, [isOpen, editingProject, form, token]);

  const handleDownloadDoc = async (docId: number, filename: string) => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/documents/download/${docId}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download document');
    }
  };

  const onSubmit = async (values: ProjectFormValues) => {
    try {
      setIsSubmitting(true);
      const payload = {
        ...values,
        total_hours: values.total_hours ? parseFloat(values.total_hours as unknown as string) : 0,
        reporting_manager_id: values.reporting_manager_id ? parseInt(values.reporting_manager_id) : null,
        start_date: values.start_date ? new Date(values.start_date).toISOString() : null,
        end_date: values.end_date ? new Date(values.end_date).toISOString() : null,
      };

      let projectId = editingProject?.id;
      if (editingProject) {
        await projectService.updateProject(editingProject.id, payload);
        toast.success('Project parameters updated');
      } else {
        const newProj = await projectService.createProject(payload);
        projectId = newProj.id;
        toast.success('New project initialized');
      }

      // Upload document if selected
      if (pendingDocs.length > 0 && projectId) {
        await Promise.all(pendingDocs.map(async (doc) => {
          const formData = new FormData();
          formData.append('file', doc.file);
          formData.append('project_id', projectId.toString());
          formData.append('doc_type', doc.docType);
          formData.append('display_name', doc.displayName || doc.file.name);
          formData.append('preparation_date', doc.prepDate);

          return axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/documents/upload`, formData, {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          });
        }));
        toast.success(`${pendingDocs.length} document(s) uploaded successfully`);
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to sync project');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden border-slate-200 shadow-xl rounded-xl bg-white">
        <div className="border-b border-slate-200 bg-white p-6 relative">
            <div className="flex items-center gap-4 relative z-10">
              <div className="flex h-10 w-10 bg-indigo-50 rounded-lg items-center justify-center border border-indigo-100">
                <Briefcase className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold text-slate-900">
                  {editingProject ? 'Edit Project' : 'Add New Project'}
                </DialogTitle>
                <DialogDescription className="text-sm text-slate-500 mt-1">
                  {editingProject ? 'Update project information' : 'Fill in the details to create a new project'}
                </DialogDescription>
              </div>
            </div>
        </div>
        
        <div className="max-h-[70vh] overflow-y-auto p-6 custom-scrollbar">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-sm font-medium text-slate-700">
                          Project Name <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Enter project name..." {...field} className="h-10 rounded-md border-slate-200 bg-white focus:bg-white text-sm shadow-sm" />
                      </FormControl>
                      <FormMessage className="text-xs text-red-500" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-sm font-medium text-slate-700">
                          Project ID <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. ARK-001" {...field} value={field.value || ''} className="h-10 rounded-md border-slate-200 bg-white focus:bg-white text-sm uppercase shadow-sm" />
                      </FormControl>
                      <FormMessage className="text-xs text-red-500" />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-sm font-medium text-slate-700">
                        Project Description
                    </FormLabel>
                    <FormControl>
                      <textarea 
                        placeholder="Detailed project description..." 
                        {...field} 
                        value={field.value || ''}
                        className="flex min-h-[100px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none" 
                      />
                    </FormControl>
                    <FormMessage className="text-xs text-red-500" />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-sm font-medium text-slate-700">
                          Project Status <span className="text-red-500">*</span>
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-10 w-full rounded-md border-slate-200 bg-white focus:ring-1 focus:ring-indigo-500 text-sm shadow-sm">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-md border-slate-200">
                          <SelectItem value="planning" className="text-blue-600">Planning</SelectItem>
                          <SelectItem value="active" className="text-emerald-600">Active</SelectItem>
                          <SelectItem value="on-hold" className="text-amber-600">On Hold</SelectItem>
                          <SelectItem value="completed" className="text-slate-900">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-xs text-red-500" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="reporting_manager_id"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-sm font-medium text-slate-700">
                          Reporting Manager
                      </FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value ? String(field.value) : ""}
                      >
                        <FormControl>
                          <SelectTrigger className="h-10 w-full rounded-md border-slate-200 bg-white text-sm shadow-sm focus:ring-1 focus:ring-indigo-500">
                            <SelectValue placeholder="Assign a manager">
                              {field.value 
                                ? managers.find(m => String(m.id) === String(field.value))?.full_name || field.value 
                                : ""}
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-md border-slate-200">
                          {managers.map(m => (
                            <SelectItem key={m.id} value={String(m.id)}>
                              {m.full_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <FormField
                  control={form.control}
                  name="start_date"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-sm font-medium text-slate-700">
                          Start Date
                      </FormLabel>
                      <FormControl>
                        <Input type="date" {...field} value={field.value || ''} className="h-10 rounded-md border-slate-200 bg-white text-sm shadow-sm" />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="end_date"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-sm font-medium text-slate-700">
                          End Date
                      </FormLabel>
                      <FormControl>
                        <Input type="date" {...field} value={field.value || ''} className="h-10 rounded-md border-slate-200 bg-white text-sm shadow-sm" />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
                <div className="space-y-1.5">
                  <FormLabel className="text-sm font-medium text-slate-700">
                      Duration (Days)
                  </FormLabel>
                  <div className="h-10 rounded-md border border-slate-200 bg-slate-50 flex items-center px-3 text-sm text-slate-500 shadow-sm cursor-not-allowed">
                    {calculatedDays > 0 ? `${calculatedDays} days` : '-'}
                  </div>
                </div>
                <FormField
                  control={form.control}
                  name="total_hours"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-sm font-medium text-slate-700">
                          Total Hours
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          step="0.5" 
                          {...field} 
                          onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))}
                          className="h-10 rounded-md border-slate-200 bg-white text-sm shadow-sm" 
                          placeholder="100" 
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-3">
                <FormLabel className="text-sm font-medium text-slate-700">
                    Team Members
                </FormLabel>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 rounded-lg bg-slate-50 border border-slate-200 max-h-[250px] overflow-y-auto custom-scrollbar">
                  {employees.map((employee) => (
                    <FormField
                      key={employee.id}
                      control={form.control}
                      name="member_ids"
                      render={({ field }) => {
                        return (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0 p-3 rounded-md bg-white border border-slate-200 hover:border-slate-300 transition-all cursor-pointer shadow-sm">
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
                                className="h-4 w-4 rounded-sm border-slate-300 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                              />
                            </FormControl>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200">
                                  {employee.full_name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col">
                                <span className="text-sm font-medium text-slate-900 leading-none mb-1">{employee.full_name}</span>
                                <span className="text-xs text-slate-500">{employee.designation || 'Specialist'}</span>
                              </div>
                            </div>
                          </FormItem>
                        )
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Project Documents Section */}
              <div className="space-y-4 pt-6 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-900">Project Documents</h4>
                </div>

                {/* Existing Documents */}
                {editingProject && (
                  <div className="space-y-3">
                    <span className="text-xs font-medium text-slate-500">Uploaded Documents</span>
                    {isLoadingDocs ? (
                      <div className="flex items-center gap-2 py-2 text-sm text-slate-500">
                        <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
                        <span>Loading documents...</span>
                      </div>
                    ) : projectDocs.length === 0 ? (
                      <p className="text-xs text-slate-400">No documents uploaded for this project yet.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {projectDocs.map((doc: any) => (
                          <div 
                            key={doc.id} 
                            className="flex items-center justify-between p-3 rounded-md bg-white border border-slate-200 shadow-sm hover:shadow transition-all group"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="px-2 py-1 rounded-md bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0 text-xs font-semibold border border-indigo-100 whitespace-nowrap">
                                {doc.doc_type}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="text-sm font-medium text-slate-900 truncate" title={doc.display_name}>
                                  {doc.display_name}
                                </span>
                                <span className="text-xs text-slate-500">
                                  {doc.preparation_date ? format(new Date(doc.preparation_date), 'dd MMM yyyy') : 'No Date'}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                onClick={() => window.open(`/superadmin/projects/view-doc?id=${doc.id}`, '_blank')}
                                className="h-8 w-8 text-slate-400 hover:text-indigo-600"
                                title="View Document"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                onClick={() => handleDownloadDoc(doc.id, doc.display_name || doc.filename)}
                                className="h-8 w-8 text-slate-400 hover:text-indigo-600"
                                title="Download"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Upload New Document Form */}
                <div className="space-y-4 p-4 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-xs font-medium text-slate-700 block">Upload New Documents</span>
                  
                  <div className="space-y-1.5">
                    <div className="relative group border border-dashed border-slate-300 hover:border-indigo-500 rounded-md p-6 transition-all bg-white cursor-pointer flex flex-col items-center justify-center gap-2">
                      <input
                        type="file"
                        multiple
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          if (files.length > 0) {
                            const newDocs: PendingDoc[] = files.map(file => {
                              const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
                              return {
                                id: Math.random().toString(36).substring(7),
                                file,
                                docType: 'PRD',
                                displayName: nameWithoutExt,
                                prepDate: format(new Date(), 'yyyy-MM-dd')
                              };
                            });
                            setPendingDocs(prev => [...prev, ...newDocs]);
                          }
                          // Reset input value so same files can be re-selected if needed
                          e.target.value = '';
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <Upload className="h-6 w-6 text-slate-400 group-hover:text-indigo-500" />
                      <span className="text-sm font-medium text-slate-600 group-hover:text-indigo-600">
                        Click or drag files to upload
                      </span>
                      <span className="text-xs text-slate-400">
                        Upload multiple files at once
                      </span>
                    </div>
                  </div>

                  {pendingDocs.length > 0 && (
                    <div className="space-y-3 mt-4">
                      {pendingDocs.map(doc => (
                        <div key={doc.id} className="p-4 rounded-md bg-white border border-slate-200 shadow-sm space-y-4 relative group">
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              setPendingDocs(prev => prev.filter(d => d.id !== doc.id));
                            }}
                            className="absolute right-2 top-2 h-6 w-6 text-slate-400 hover:text-red-600 bg-white"
                          >
                            <X className="h-3 w-3" />
                          </Button>

                          <div className="flex items-center gap-2 pr-8">
                            <FileIcon className="h-4 w-4 text-indigo-500 shrink-0" />
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-medium text-slate-800 truncate" title={doc.file.name}>
                                {doc.file.name}
                              </span>
                              <span className="text-[10px] text-slate-500">
                                {(doc.file.size / 1024).toFixed(1)} KB
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="space-y-1.5">
                              <label className="text-[10px] text-slate-500 font-medium">Document Type</label>
                              <Select 
                                onValueChange={(val) => {
                                  setPendingDocs(prev => prev.map(d => d.id === doc.id ? { ...d, docType: val || '' } : d));
                                }} 
                                value={doc.docType}
                              >
                                <SelectTrigger className="h-8 w-full rounded-md border-slate-200 bg-white text-xs shadow-sm">
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent className="rounded-md border-slate-200 min-w-[240px]">
                                  {Object.entries(DOCUMENT_TYPE_LABELS).map(([key, label]) => (
                                    <SelectItem key={key} value={key} className="text-xs">
                                      {label} ({key})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] text-slate-500 font-medium">Display Name</label>
                              <Input 
                                value={doc.displayName} 
                                onChange={(e) => {
                                  setPendingDocs(prev => prev.map(d => d.id === doc.id ? { ...d, displayName: e.target.value } : d));
                                }} 
                                placeholder="Enter custom display name" 
                                className="h-8 rounded-md border-slate-200 bg-white text-xs shadow-sm"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] text-slate-500 font-medium">Preparation Date</label>
                              <Input 
                                type="date" 
                                value={doc.prepDate} 
                                onChange={(e) => {
                                  setPendingDocs(prev => prev.map(d => d.id === doc.id ? { ...d, prepDate: e.target.value } : d));
                                }} 
                                className="h-8 rounded-md border-slate-200 bg-white text-xs shadow-sm"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-6 border-t border-slate-200">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onClose}
                  className="h-10 px-6 w-full sm:w-auto rounded-md text-sm font-medium text-slate-600 border-slate-200 hover:bg-slate-50"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="h-10 px-6 w-full sm:w-auto rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium shadow-sm transition-colors"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
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
  );
}
