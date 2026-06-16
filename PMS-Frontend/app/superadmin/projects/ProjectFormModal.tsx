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
  Loader2,
  Search
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
import { EnterpriseModalHeader } from '@/components/ui/enterprise-modal-header';
import { EnterpriseModalFooter } from '@/components/ui/enterprise-modal-footer';
import { FormSection } from '@/components/ui/form-section';
import { FormGrid } from '@/components/ui/form-grid';
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { projectService } from '@/services/projectService';
import { companyService } from '@/services/companyService';
import { Project, ReportingManager, Employee, Company } from '@/types';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '@/services/api';
import { handleApiError } from '@/utils/handleApiError';
import { ErrorState } from '@/components/ui/error-state';
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
  name: z.string({ required_error: 'This field is required' })
    .min(1, 'This field is required')
    .regex(/^[a-zA-Z _\-().&]+$/, 'Project name must not contain numbers or special characters'),
  code: z.string().optional().nullable(),
  description: z.string().optional(),
  status: z.enum(['planning', 'active', 'on-hold', 'completed'], { required_error: 'Please select an option' }),
  start_date: z.string().optional().nullable(),
  end_date: z.string().optional().nullable(),
  total_hours: z.coerce.number().optional(),
  reporting_manager_id: z.string().optional().nullable(),
  member_ids: z.array(z.number()),
  owner_company_id: z.string({ required_error: 'Please select an option' }).min(1, 'Please select an option'),
  participating_company_ids: z.array(z.string()).min(1, 'This field is required'),
}).superRefine((data, ctx) => {
  if (!data.participating_company_ids.includes(data.owner_company_id)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Owner Company must be one of the Participating Companies",
      path: ["owner_company_id"]
    });
  }
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
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [companies, setCompanies] = useState<Company[]>([]);

  useEffect(() => {
    companyService.getCompanies().then(setCompanies).catch(console.error);
  }, []);

  const filteredEmployees = employees.filter(emp =>
    (emp?.full_name?.toLowerCase().includes(employeeSearch.toLowerCase())) ||
    (emp?.designation?.toLowerCase().includes(employeeSearch.toLowerCase()))
  );

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
      owner_company_id: '',
      participating_company_ids: [],
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
          code: editingProject.code || '',
          description: editingProject.description || '',
          status: editingProject.status,
          start_date: editingProject.start_date ? format(new Date(editingProject.start_date), 'yyyy-MM-dd') : '',
          end_date: editingProject.end_date ? format(new Date(editingProject.end_date), 'yyyy-MM-dd') : '',
          total_hours: editingProject.total_hours || 0,
          reporting_manager_id: editingProject.reporting_manager_id?.toString() || '',
          member_ids: editingProject.members?.map(m => m.id) || [],
          owner_company_id: editingProject.owner_company_id?.toString() || '',
          participating_company_ids: editingProject.participating_companies?.map(c => c.id.toString()) || [],
        });

        setIsLoadingDocs(true);
        api.get(`/documents/project/${editingProject.id}`).then(res => {
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
          owner_company_id: '',
          participating_company_ids: [],
        });
        setProjectDocs([]);
      }

      setPendingDocs([]);
      setEmployeeSearch('');
    }
  }, [isOpen, editingProject, form, token]);

  const handleDownloadDoc = async (docId: number, filename: string) => {
    try {
      const response = await api.get(`/documents/download/${docId}`, {
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

      // Validate document types before initializing project
      const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.csv', '.xlsx', '.docx', '.zip', '.txt'];
      if (pendingDocs.length > 0) {
        const invalidDocs = pendingDocs.filter(doc => {
          const ext = doc.file.name.substring(doc.file.name.lastIndexOf('.')).toLowerCase();
          return !ALLOWED_EXTENSIONS.includes(ext);
        });

        if (invalidDocs.length > 0) {
          toast.error(`Unsupported document format. Supported formats are: ${ALLOWED_EXTENSIONS.join(', ')}`);
          setIsSubmitting(false);
          return;
        }
      }

      const payload = {
        ...values,
        total_hours: values.total_hours ? parseFloat(values.total_hours as unknown as string) : 0,
        reporting_manager_id: (values.reporting_manager_id && values.reporting_manager_id !== 'none') ? parseInt(values.reporting_manager_id) : null,
        start_date: values.start_date ? new Date(values.start_date).toISOString() : null,
        end_date: values.end_date ? new Date(values.end_date).toISOString() : null,
        owner_company_id: parseInt(values.owner_company_id),
        participating_company_ids: values.participating_company_ids.map(id => parseInt(id))
      };

      let projectId = editingProject?.id;
      if (editingProject) {
        await projectService.updateProject(editingProject.id, payload);
        toast.success('Project Details updated');
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

          return api.post(`/documents/upload`, formData, {
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
      <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden border-border gap-0">
        <EnterpriseModalHeader
          title={editingProject ? 'Edit Project' : 'Add New Project'}
          subtitle={editingProject ? 'Update project information' : 'Fill in the details to create a new project'}
          icon={Briefcase}
          intent="normal"
        />

        <div className="max-h-[70vh] overflow-y-auto p-6 bg-background custom-scrollbar">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormSection title="Project Details">
                <FormGrid>
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required className="text-sm font-semibold text-foreground">Project Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter project name..."
                            {...field}
                            onChange={(e) => {
                              const cleaned = e.target.value.replace(/[^a-zA-Z _\-().&]/g, '');
                              field.onChange(cleaned);
                            }}
                            className="h-10"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold text-foreground">Project ID (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. ARK-001" {...field} value={field.value || ''} className="h-10 uppercase" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </FormGrid>

                <div className="grid grid-cols-1 gap-4 mt-4">
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold text-foreground">
                          Project Description
                        </FormLabel>
                        <FormControl>
                          <textarea
                            placeholder="Detailed project description..."
                            {...field}
                            value={field.value || ''}
                            className="flex min-h-[100px] w-full rounded-md border border-border bg-background px-3 py-2 text-sm shadow-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormGrid className="mt-4">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required className="text-sm font-semibold text-foreground">Project Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-10 w-full">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="planning" className="text-blue-600">Planning</SelectItem>
                            <SelectItem value="active" className="text-emerald-600">Active</SelectItem>
                            <SelectItem value="on-hold" className="text-amber-600">On Hold</SelectItem>
                            <SelectItem value="completed" className="text-foreground">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="reporting_manager_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold text-foreground">Reporting Manager</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value ? String(field.value) : "none"}
                        >
                          <FormControl>
                            <SelectTrigger className="h-10 w-full">
                              <SelectValue placeholder="Assign a manager">
                                {field.value && field.value !== 'none'
                                  ? managers.find(m => String(m.id) === String(field.value))?.full_name || field.value
                                  : "Unassigned"}
                              </SelectValue>
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">Unassigned</SelectItem>
                            {managers.map(m => (
                              <SelectItem key={m.id} value={String(m.id)}>
                                {m.full_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </FormGrid>

                <FormGrid className="mt-4">
                  <FormField
                    control={form.control}
                    name="owner_company_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required className="text-sm font-semibold text-foreground">Owner Company</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="h-10 w-full">
                              <SelectValue placeholder="Select Owner Company" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {companies.map(c => (
                              <SelectItem key={c.id} value={String(c.id)}>
                                {c.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="participating_company_ids"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required className="text-sm font-semibold text-foreground">Participating Companies</FormLabel>
                        <div className="flex flex-col gap-2 max-h-[150px] overflow-y-auto p-2 border rounded-md custom-scrollbar bg-card">
                          {companies.map(c => (
                            <div key={c.id} className="flex flex-row items-center space-x-3">
                              <Checkbox
                                checked={field.value?.includes(String(c.id))}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    field.onChange([...(field.value || []), String(c.id)]);
                                  } else {
                                    field.onChange(field.value?.filter(id => id !== String(c.id)));
                                  }
                                }}
                              />
                              <span className="text-sm">{c.name}</span>
                            </div>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </FormGrid>
              </FormSection>

              <FormSection title="Timeline & Scope">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <FormField
                    control={form.control}
                    name="start_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold text-foreground">
                          Start Date
                        </FormLabel>
                        <FormControl>
                          <Input type="date" {...field} value={field.value || ''} className="h-10" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="end_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold text-foreground">
                          End Date
                        </FormLabel>
                        <FormControl>
                          <Input type="date" {...field} value={field.value || ''} className="h-10" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="space-y-2">
                    <FormLabel className="text-sm font-semibold text-foreground">
                      Duration (Days)
                    </FormLabel>
                    <div className="h-10 rounded-md border border-border bg-muted flex items-center px-3 text-sm text-muted-foreground shadow-sm cursor-not-allowed">
                      {calculatedDays > 0 ? `${calculatedDays} days` : '-'}
                    </div>
                  </div>
                  <FormField
                    control={form.control}
                    name="total_hours"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold text-foreground">
                          Total Hours
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            step="0.5"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))}
                            className="h-10"
                            placeholder="100"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </FormSection>

              <FormSection title="Team Members">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <FormLabel className="text-sm font-medium text-muted-foreground">
                    Team Members
                  </FormLabel>
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search team members..."
                      value={employeeSearch}
                      onChange={(e) => setEmployeeSearch(e.target.value)}
                      className="pl-9 h-9 rounded-md border-border text-sm bg-card"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 rounded-lg bg-muted border border-border max-h-[250px] overflow-y-auto custom-scrollbar">
                  {filteredEmployees.length > 0 ? filteredEmployees.map((employee) => (
                    <FormField
                      key={employee.id}
                      control={form.control}
                      name="member_ids"
                      render={({ field }) => {
                        const isSelected = field.value?.includes(employee.id);
                        return (
                          <FormItem
                            className={`flex flex-row items-center space-x-3 space-y-0 p-3 rounded-md border transition-all cursor-pointer shadow-sm ${isSelected ? 'bg-indigo-50 border-indigo-200' : 'bg-card border-border hover:border-slate-300'}`}
                            onClick={(e) => {
                              e.preventDefault();
                              const checked = !isSelected;
                              if (checked) {
                                field.onChange([...(field.value || []), employee.id]);

                                // Auto-select employee's company as participating company
                                if (employee.company_id) {
                                  const companyIdStr = employee.company_id.toString();
                                  const currentParticipating = form.getValues('participating_company_ids') || [];
                                  if (!currentParticipating.includes(companyIdStr)) {
                                    form.setValue('participating_company_ids', [...currentParticipating, companyIdStr], { shouldValidate: true });
                                  }
                                }
                              } else {
                                field.onChange(field.value?.filter((value) => value !== employee.id));
                              }
                            }}
                          >
                            <FormControl>
                              <Checkbox
                                checked={isSelected}
                                tabIndex={-1}
                                className="h-4 w-4 rounded-sm border-slate-300 data-[state=checked]:bg-primary data-[state=checked]:border-indigo-600 pointer-events-none"
                              />
                            </FormControl>
                            <div className="flex items-center gap-3 w-full">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-muted text-slate-600 text-xs font-medium border border-border">
                                  {employee?.full_name ? employee.full_name.split(' ').map(n => n[0]).join('').substring(0, 2) : 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col flex-1 min-w-0">
                                <span className="text-sm font-medium text-foreground leading-none mb-1 truncate" title={employee.full_name}>{employee.full_name}</span>
                                <span className="text-xs text-muted-foreground truncate" title={employee.company_name ? `${employee.designation || 'Specialist'} [${employee.company_name}]` : (employee.designation || 'Specialist')}>{employee.company_name ? `${employee.designation || 'Specialist'} [${employee.company_name}]` : (employee.designation || 'Specialist')}</span>
                              </div>
                            </div>
                          </FormItem>
                        )
                      }}
                    />
                  )) : (
                    <div className="col-span-1 md:col-span-2 py-8 text-center text-sm text-muted-foreground">
                      "No team members found matching "{employeeSearch}"
                    </div>
                  )}
                </div>
              </FormSection>

              {/* Project Documents Section */}
              <FormSection title="Project Documents">

                {/* Existing Documents */}
                {editingProject && (
                  <div className="space-y-3">
                    <span className="text-xs font-medium text-muted-foreground">Uploaded Documents</span>
                    {isLoadingDocs ? (
                      <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
                        <span>Loading documents...</span>
                      </div>
                    ) : projectDocs.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No documents uploaded for this project yet.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {projectDocs.map((doc: any) => (
                          <div
                            key={doc.id}
                            className="flex items-center justify-between p-3 rounded-md bg-card border border-border shadow-sm hover:shadow transition-all group"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="px-2 py-1 rounded-md bg-indigo-50 flex items-center justify-center text-primary shrink-0 text-xs font-semibold border border-indigo-100 whitespace-nowrap">
                                {doc.doc_type}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="text-sm font-medium text-foreground truncate" title={doc.display_name}>
                                  {doc.display_name}
                                </span>
                                <span className="text-xs text-muted-foreground">
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
                                className="h-8 w-8 text-muted-foreground hover:text-primary"
                                title="View Document"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                onClick={() => handleDownloadDoc(doc.id, doc.display_name || doc.filename)}
                                className="h-8 w-8 text-muted-foreground hover:text-primary"
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
                <div className="space-y-4 p-4 rounded-lg bg-muted border border-border">
                  <span className="text-xs font-medium text-muted-foreground block">Upload New Documents</span>

                  <div className="space-y-1.5">
                    <div className="relative group border border-dashed border-slate-300 hover:border-indigo-500 rounded-md p-6 transition-all bg-card cursor-pointer flex flex-col items-center justify-center gap-2">
                      <input
                        type="file"
                        multiple
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          if (files.length > 0) {
                            const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.csv', '.xlsx', '.docx', '.zip', '.txt'];
                            const validFiles = files.filter(file => {
                              const ext = file.name.includes('.') ? file.name.substring(file.name.lastIndexOf('.')).toLowerCase() : '';
                              return ALLOWED_EXTENSIONS.includes(ext);
                            });

                            if (validFiles.length !== files.length) {
                              toast.error(`Some files were removed. Supported formats are: ${ALLOWED_EXTENSIONS.join(', ')}`);
                            }

                            if (validFiles.length > 0) {
                              const newDocs: PendingDoc[] = validFiles.map(file => {
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
                          }
                          // Reset input value so same files can be re-selected if needed
                          e.target.value = '';
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <Upload className="h-6 w-6 text-muted-foreground group-hover:text-indigo-500" />
                      <span className="text-sm font-medium text-slate-600 group-hover:text-primary">
                        Click or drag files to upload
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Upload multiple files at once
                      </span>
                    </div>
                  </div>

                  {pendingDocs.length > 0 && (
                    <div className="space-y-3 mt-4">
                      {pendingDocs.map(doc => (
                        <div key={doc.id} className="p-4 rounded-md bg-card border border-border shadow-sm space-y-4 relative group">
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              setPendingDocs(prev => prev.filter(d => d.id !== doc.id));
                            }}
                            className="absolute right-2 top-2 h-6 w-6 text-muted-foreground hover:text-red-600 bg-card"
                          >
                            <X className="h-3 w-3" />
                          </Button>

                          <div className="flex items-center gap-2 pr-8">
                            <FileIcon className="h-4 w-4 text-indigo-500 shrink-0" />
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-medium text-slate-800 truncate" title={doc.file.name}>
                                {doc.file.name}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                {(doc.file.size / 1024).toFixed(1)} KB
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="space-y-1.5">
                              <label className="text-[10px] text-muted-foreground font-medium">Document Type</label>
                              <Select
                                onValueChange={(val) => {
                                  setPendingDocs(prev => prev.map(d => d.id === doc.id ? { ...d, docType: val || '' } : d));
                                }}
                                value={doc.docType}
                              >
                                <SelectTrigger className="h-8 w-full rounded-md border-border bg-card text-xs shadow-sm">
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent className="rounded-md border-border min-w-[240px]">
                                  {Object.entries(DOCUMENT_TYPE_LABELS).map(([key, label]) => (
                                    <SelectItem key={key} value={key} className="text-xs">
                                      {label} ({key})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] text-muted-foreground font-medium">Display Name</label>
                              <Input
                                value={doc.displayName}
                                onChange={(e) => {
                                  setPendingDocs(prev => prev.map(d => d.id === doc.id ? { ...d, displayName: e.target.value } : d));
                                }}
                                placeholder="Enter custom display name"
                                className="h-8 rounded-md border-border bg-card text-xs shadow-sm"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] text-muted-foreground font-medium">Preparation Date</label>
                              <Input
                                type="date"
                                value={doc.prepDate}
                                onChange={(e) => {
                                  setPendingDocs(prev => prev.map(d => d.id === doc.id ? { ...d, prepDate: e.target.value } : d));
                                }}
                                className="h-8 rounded-md border-border bg-card text-xs shadow-sm"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </FormSection>
            </form>
          </Form>
        </div>

        <EnterpriseModalFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="h-10 px-4"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            onClick={form.handleSubmit(onSubmit)}
            className="h-10 px-6"
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
        </EnterpriseModalFooter>
      </DialogContent>
    </Dialog>
  );
}
