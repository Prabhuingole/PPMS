'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Briefcase, 
  Calendar, 
  Clock, 
  FileText, 
  Users, 
  UserCheck, 
  Building2, 
  Loader2, 
  CheckCircle2, 
  PauseCircle, 
  ShieldCheck,
  Eye,
  Download,
  AlertCircle,
  File,
  Trash2,
  Circle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { format, differenceInDays } from 'date-fns';
import api from '@/services/api';
import { handleApiError } from '@/utils/handleApiError';
import { ErrorState } from '@/components/ui/error-state';
import { useAuthStore } from '@/store/authStore';
import { useWebSocketEvent } from '@/hooks/useWebSocketEvent';
import { toast } from 'sonner';
import { ProjectFormModal } from '../ProjectFormModal';
import { DeleteConfirmationModal } from "@/components/ui/delete-confirmation-modal";
import { DocumentViewerModal } from '@/components/documents/DocumentViewerModal';
import { useTasks } from '@/services/taskService';
import { TasksTab } from '@/components/projects/TasksTab';

const EmployeeTaskView = ({ projectId, userId, token }: { projectId: string, userId: string, token: string | null }) => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        const pagesRes = await api.get(`/notes/admin/projects/${projectId}/users/${userId}/pages`);
        const pagesWithTasks = pagesRes.data.filter((p: any) => p.checklist_total > 0);
        
        const taskPromises = pagesWithTasks.map((p: any) => 
          api.get(`/notes/admin/pages/${p.id}`)
        );
        
        const pageDetailsResponses = await Promise.all(taskPromises);
        
        let allTasks: any[] = [];
        pageDetailsResponses.forEach(res => {
          if (res.data && res.data.checklist_items) {
             const items = res.data.checklist_items.map((item: any) => ({
                ...item,
                page_title: res.data.title
             }));
             allTasks = [...allTasks, ...items];
          }
        });
        
        setTasks(allTasks);
      } catch (error) {
        console.error("Error fetching tasks for user:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTasks();
  }, [projectId, userId, token]);

  if (loading) return <div className="p-4 flex justify-center"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>;
  if (tasks.length === 0) return null;

  return (
    <div className="space-y-2 mt-3 pt-3 border-t border-border">
      {tasks.map(task => (
         <div key={task.id} className="flex items-start gap-3 p-3 bg-background rounded-lg border border-border">
           <div className="mt-0.5 shrink-0">
             {task.is_completed ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
             ) : (
                <Circle className="w-4 h-4 text-muted-foreground/30" />
             )}
           </div>
           <div className="flex-1 min-w-0">
             <p className={`text-sm ${task.is_completed ? 'text-muted-foreground line-through' : 'text-foreground'}`}>{task.text}</p>
             <p className="text-[10px] text-muted-foreground mt-1">From page: {task.page_title}</p>
           </div>
         </div>
      ))}
    </div>
  );
};
export default function ProjectDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const { token, user } = useAuthStore();

  const canEdit = user?.role === 'superadmin' || user?.role === 'admin' || user?.role === 'reporting_manager';

  const [project, setProject] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [timesheets, setTimesheets] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [reportingManagers, setReportingManagers] = useState<any[]>([]);
  const [userTasks, setUserTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTimesheets, setTotalTimesheets] = useState(0);
  const [docToDelete, setDocToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerDocId, setViewerDocId] = useState<number | null>(null);
  const [viewerDocType, setViewerDocType] = useState<'project' | 'timesheet'>('project');

  const [taskFilters, setTaskFilters] = useState({
    status: 'all',
    priority: 'all',
    assignee_id: 'all',
    search: ''
  });

  const { data: tasks = [] } = useTasks({ 
    project_id: Number(projectId),
    ...(taskFilters.status !== 'all' && { status: taskFilters.status }),
    ...(taskFilters.priority !== 'all' && { priority: taskFilters.priority }),
    ...(taskFilters.assignee_id !== 'all' && { assignee_id: Number(taskFilters.assignee_id) }),
  });

  const fetchTimesheets = async (page: number) => {
    if (!token || !projectId) return;
    try {
      const tsRes = await api.get(`/timesheets/project/${projectId}?page=${page}&limit=10`);
      if (tsRes.data.items) {
        setTimesheets(tsRes.data.items);
        setTotalTimesheets(tsRes.data.total || 0);
        setTotalPages(Math.ceil((tsRes.data.total || 0) / 10) || 1);
      } else {
        setTimesheets(tsRes.data);
        setTotalTimesheets(tsRes.data.length);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('Error fetching timesheets:', error);
    }
  };

  const fetchData = async () => {
    if (!token || !projectId) return;
    try {
      setLoading(true);
      const [projRes, docRes, empRes, rmRes, userTasksRes] = await Promise.all([
        api.get(`/projects/${projectId}`),
        api.get(`/documents/project/${projectId}`),
        api.get(`/employees/?status_filter=true`),
        api.get(`/employees/?is_reporting_manager=true&status_filter=true`),
        api.get(`/notes/admin/projects/${projectId}/users`).catch(() => ({ data: [] }))
      ]);

      if (projRes.data) {
        setProject(projRes.data);
      }
      setDocuments(docRes.data);
      if (empRes.data.items) {
        setEmployees(empRes.data.items);
      }
      if (rmRes.data.items) {
        setReportingManagers(rmRes.data.items);
      }
      setUserTasks(userTasksRes.data);
    } catch (error: any) {
      if (error.response?.status === 404 || error.response?.status === 422) {
        setProject(null);
      } else {
        console.error('Error fetching project details:', error.message || error);
        toast.error('Failed to load project details');
      }
    } finally {
      setLoading(false);
    }
  };

  const [backConfig, setBackConfig] = useState({ path: '/superadmin/projects', label: 'Back to Projects' });

  useEffect(() => {
    fetchData();
  }, [projectId, token]);

  useEffect(() => {
    if (token && projectId) {
      fetchTimesheets(currentPage);
    }
  }, [currentPage, token, projectId]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const backPath = searchParams.get('backPath');
      if (backPath && (backPath.includes('/reporting-managers') || backPath.includes('/employees'))) {
        setBackConfig({ path: backPath, label: 'Back to Profile' });
      }
    }
  }, []);

  useWebSocketEvent('TIMESHEETS_UPDATED', () => {
    if (token && projectId) {
      fetchTimesheets(currentPage);
    }
  });

  const handleDownloadDoc = async (docId: number, filename: string) => {
    try {
      const res = await api.get(
        `/documents/download/${docId}?inline=true`
      );
      if (res.data.url) {
        const a = document.createElement('a');
        a.href = res.data.url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (error) {
      toast.error('Failed to download document');
    }
  };

  const handleDeleteDocument = async () => {
    if (!docToDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/documents/${docToDelete}`);
      toast.success('Document deleted successfully');
      setDocuments(prev => prev.filter(d => d.id !== docToDelete));
      setDocToDelete(null);
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete document');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading || !project) {
    return (
      <div className="flex-1 p-8 bg-muted/30 flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex-1 p-8 bg-muted/30 flex flex-col items-center justify-center min-h-[calc(100vh-4rem)]">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-foreground">Project Not Found</h2>
        <Button onClick={() => router.push('/superadmin/projects')} className="mt-4">
          Return to Projects
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-[1440px] mx-auto w-full">
      <div className="mb-4">
        <Button 
          variant="ghost" 
          onClick={() => router.push(backConfig.path)}
          className="text-muted-foreground hover:text-foreground -ml-2 h-8 px-2 mb-2"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          <span className="text-xs font-bold uppercase tracking-widest">
            {backConfig.label}
          </span>
        </Button>
      </div>

      <div className="bg-background rounded-xl shadow-sm border border-border p-6 md:p-8 mb-6 flex flex-col md:flex-row md:items-start justify-between gap-4 min-w-0">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3 mb-2 min-w-0">
            <h1 className="text-3xl font-black text-foreground tracking-tight truncate">{project.name}</h1>
            <Badge className={
              project.status === 'active' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-0 shrink-0' :
              project.status === 'on-hold' ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 border-0 shrink-0' :
              'bg-muted text-muted-foreground hover:bg-slate-200 border-0 shrink-0'
            }>
              {project.status === 'active' ? <CheckCircle2 className="w-3 h-3 mr-1" /> :
                project.status === 'on-hold' ? <PauseCircle className="w-3 h-3 mr-1" /> :
                <ShieldCheck className="w-3 h-3 mr-1" />}
              {project.status.toUpperCase()}
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground font-medium">
            <div className="flex items-center gap-1.5 bg-background px-2.5 py-1 rounded-md border border-border shadow-sm">
              <Briefcase className="h-4 w-4 text-blue-500" />
              <span className="font-mono text-xs">{project.code}</span>
            </div>
            
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border shadow-sm text-xs font-semibold uppercase tracking-wider ${project.client_company ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-indigo-50 text-indigo-700 border-indigo-200'}`}>
              <Building2 className="h-3.5 w-3.5" />
              {project.client_company ? 'Client Project' : 'In-House Project'}
            </div>

            {project.client_company?.name && (
              <div className="flex items-center gap-1.5 bg-background px-2.5 py-1 rounded-md border border-border shadow-sm text-xs">
                <span className="text-muted-foreground font-semibold uppercase tracking-widest text-[9px]">Client:</span>
                <span className="font-semibold text-foreground">{project.client_company.name}</span>
              </div>
            )}

            {project.owner_company_name && (
              <div className="flex items-center gap-1.5 bg-background px-2.5 py-1 rounded-md border border-border shadow-sm text-xs">
                <span className="text-muted-foreground font-semibold uppercase tracking-widest text-[9px]">Managed By:</span>
                <span className="font-semibold text-foreground">{project.owner_company_name}</span>
              </div>
            )}
          </div>
        </div>
        {canEdit && (
          <Button 
            onClick={() => setIsEditModalOpen(true)}
            variant="outline"
            className="border-border text-foreground bg-background hover:bg-muted shadow-sm shrink-0"
          >
            Edit Project Details
          </Button>
        )}
      </div>

      {/* Custom Tabs Navigation */}
      <div className="flex flex-wrap border-b border-border mb-8 gap-1">
        {['overview', 'tasks', 'timesheets'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 text-sm font-bold uppercase tracking-wider border-b-2 transition-all ${
              activeTab === tab 
                ? 'border-primary text-primary bg-primary/5' 
                : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="w-full">
        {activeTab === 'overview' && (
          <>
          <Card className="rounded-xl shadow-sm border border-border bg-background overflow-hidden mb-8 w-full">
            <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-12 w-full">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-10 min-w-0">
            {/* Project Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full">
              <div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Team Size</span>
                <div className="flex items-end gap-1.5">
                  <span className="text-xl font-black text-foreground">{project.members?.length || 0}</span>
                  <span className="text-sm font-semibold text-muted-foreground mb-0.5">Members</span>
                </div>
              </div>
              <div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Documents</span>
                <div className="flex items-end gap-1.5">
                  <span className="text-xl font-black text-foreground">{documents.length}</span>
                  <span className="text-sm font-semibold text-muted-foreground mb-0.5">Files</span>
                </div>
              </div>
              <div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Duration</span>
                <div className="flex items-end gap-1.5">
                  <span className="text-xl font-black text-foreground">
                    {project.start_date && project.end_date 
                      ? differenceInDays(new Date(project.end_date), new Date(project.start_date))
                      : '-'}
                  </span>
                  <span className="text-sm font-semibold text-muted-foreground mb-0.5">Days</span>
                </div>
              </div>
              <div className="col-span-2 md:col-span-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Timeline</span>
                <span className="text-sm font-semibold text-foreground block">
                  {project.start_date ? format(new Date(project.start_date), 'MMM d, yy') : 'N/A'} - {project.end_date ? format(new Date(project.end_date), 'MMM d, yy') : 'N/A'}
                </span>
              </div>
            </div>

            <div className="h-px bg-muted" />

            {/* Time Tracking */}
            <div>
              <h3 className="font-bold text-foreground flex items-center gap-2 mb-4">
                <Clock className="h-5 w-5 text-blue-500" />
                Time Tracking
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-muted/30 border border-border flex flex-col overflow-hidden">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Allocated Hours</span>
                  <span className="text-2xl font-black text-foreground break-all">
                    {Number((project.total_hours || 0).toFixed(2))}
                    <span className="text-sm font-bold opacity-70 ml-0.5">hr</span>
                  </span>
                </div>
                <div className="p-4 rounded-xl bg-muted/30 border border-border flex flex-col overflow-hidden">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Consumed Hours</span>
                  <span className="text-2xl font-black text-foreground break-all">
                    {Number((project.total_hours_worked || 0).toFixed(2))}
                    <span className="text-sm font-bold opacity-70 ml-0.5">hr</span>
                  </span>
                </div>
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex flex-col relative overflow-hidden">
                  <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-1/4 translate-y-1/4">
                    <Clock className="w-16 h-16 text-emerald-600" />
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1 relative z-10">Remaining Hours</span>
                  <div className="flex items-end gap-1 relative z-10">
                    <span className={`text-2xl font-black break-all ${(project.total_hours_remaining ?? 0) < 0 ? "text-red-600" : "text-emerald-700"}`}>
                      {Number((((project.total_hours_remaining ?? 0) < 0) ? (project.total_hours_remaining || 0) * -1 : (project.total_hours_remaining || 0)).toFixed(2))}
                      <span className="text-sm font-bold opacity-70 ml-0.5">hr</span>
                    </span>
                    {(project.total_hours_remaining ?? 0) < 0 && <span className="text-[10px] font-black uppercase text-red-600 mb-1">Over</span>}
                  </div>
                </div>
              </div>
            </div>

            <div className="h-px bg-muted" />

            {/* Project Description */}
            <div>
              <h3 className="font-bold text-foreground flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5 text-indigo-500" />
                Project Description
              </h3>
              {project.description ? (
                <p className="text-foreground leading-relaxed whitespace-pre-wrap break-words text-sm">{project.description}</p>
              ) : (
                <p className="text-muted-foreground italic text-sm">No description provided for this project.</p>
              )}
            </div>

            <div className="h-px bg-muted" />

            {/* Documents */}
            <div>
              <h3 className="font-bold text-foreground flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5 text-indigo-500" /> 
                Project Documents
                <Badge variant="outline" className="font-mono text-[10px] ml-2 bg-muted/30">{documents.length}</Badge>
              </h3>
              {documents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {documents.map((doc: any) => (
                    <div 
                      key={doc.id} 
                      className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/60 hover:bg-background hover:shadow-sm transition-all group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center text-primary shrink-0 font-bold text-[8px]">
                          {doc.doc_type || 'DOC'}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-bold text-foreground truncate" title={doc.display_name}>
                            {doc.display_name}
                          </span>
                          <span className="text-[9px] text-muted-foreground font-medium">
                            {doc.preparation_date ? format(new Date(doc.preparation_date), 'dd MMM yyyy') : 'No Date'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5 shrink-0 ">
                        <Button type="button" size="icon" variant="ghost" onClick={() => { setViewerDocId(doc.id); setViewerDocType('project'); setViewerOpen(true); }} className="h-6 w-6 rounded-md hover:bg-emerald-50 text-muted-foreground hover:text-emerald-600" title="View Document">
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button type="button" size="icon" variant="ghost" onClick={() => handleDownloadDoc(doc.id, doc.display_name || doc.filename)} className="h-6 w-6 rounded-md hover:bg-blue-50 text-muted-foreground hover:text-blue-600" title="Download Document">
                          <Download className="h-3 w-3" />
                        </Button>
                        <Button type="button" size="icon" variant="ghost" onClick={() => setDocToDelete(doc.id)} className="h-6 w-6 rounded-md hover:bg-red-50 text-muted-foreground hover:text-red-600" title="Delete Document">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center bg-muted/30 rounded-xl border border-dashed border-border">
                  <File className="h-6 w-6 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-xs font-medium text-muted-foreground">No documents uploaded yet.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Reporting Manager */}
            <div>
              <h3 className="font-bold text-foreground flex items-center gap-2 mb-4">
                <UserCheck className="h-5 w-5 text-emerald-500" />
                Reporting Manager
              </h3>
              {project.reporting_manager ? (
                <div 
                  onClick={() => router.push(`/superadmin/reporting-managers/${project.reporting_manager.id}?backPath=/superadmin/projects/${project.id}`)}
                  className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border cursor-pointer hover:bg-background hover:shadow-sm transition-all group"
                >
                  <Avatar className="h-12 w-12 border-2 border-emerald-100 group-hover:border-emerald-300 transition-colors">
                    <AvatarFallback className="bg-emerald-50 text-emerald-700 font-bold group-hover:bg-emerald-100 transition-colors">
                      {project.reporting_manager.full_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-foreground truncate group-hover:text-blue-600 transition-colors">{project.reporting_manager.full_name}</h4>
                    <p className="text-xs font-medium text-muted-foreground truncate">{project.reporting_manager.email}</p>
                    {project.reporting_manager.designation && (
                      <Badge variant="secondary" className="mt-1 text-[9px] bg-background border border-border text-foreground">
                        {project.reporting_manager.designation}
                      </Badge>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-4 text-center bg-muted/30 rounded-xl border border-dashed border-border">
                  <p className="text-xs font-medium text-muted-foreground italic">No reporting manager assigned.</p>
                </div>
              )}
            </div>

            {/* Team Members */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-foreground flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-500" />
                  Team Members
                </h3>
                <Badge variant="outline" className="font-mono text-[10px] bg-muted/30">{project.members?.length || 0}</Badge>
              </div>
              
              <div className="bg-muted/30 border border-border rounded-xl overflow-hidden">
                {project.members && project.members.length > 0 ? (
                  <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
                    {project.members.map((member: any) => {
                      const uTask = userTasks.find((u: any) => u.user_id === member.id);
                      const hasTasks = uTask && uTask.total_tasks > 0;
                      
                      return (
                        <div 
                          key={member.id} 
                          onClick={() => router.push(`/superadmin/employees/${member.id}`)}
                          className="p-3 flex items-start gap-3 hover:bg-background transition-colors cursor-pointer group"
                        >
                          <Avatar className="h-10 w-10 border border-border group-hover:border-blue-300 transition-colors shrink-0">
                            <AvatarFallback className="bg-blue-50 text-blue-700 font-bold text-sm group-hover:bg-blue-100 transition-colors">
                              {member.full_name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-foreground truncate group-hover:text-blue-600 transition-colors">{member.full_name}</p>
                            <p className="text-xs font-medium text-muted-foreground truncate mb-1">{member.email}</p>
                            <div className="flex flex-wrap items-center gap-1.5">
                              {member.designation && (
                                <Badge variant="outline" className="text-[9px] uppercase tracking-wider text-muted-foreground bg-background group-hover:border-blue-200 group-hover:text-blue-500 transition-colors">
                                  {member.designation}
                                </Badge>
                              )}
                              {member.company_name && (
                                <Badge variant="outline" className="text-[9px] uppercase tracking-wider text-indigo-500 border-indigo-200 bg-indigo-50/50 group-hover:bg-indigo-100 transition-colors">
                                  {member.company_name}
                                </Badge>
                              )}
                              {hasTasks && (
                                <div className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground bg-slate-100/80 px-1.5 py-0.5 rounded-sm">
                                  <CheckCircle2 className={`w-3 h-3 ${uTask.completed_tasks === uTask.total_tasks ? 'text-emerald-500' : 'text-muted-foreground'}`} />
                                  <span>{uTask.completed_tasks}/{uTask.total_tasks} Tasks</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="p-6 text-center">
                    <p className="text-xs italic text-muted-foreground">No team members assigned</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        </Card>

        {/* Employee To-Do Lists Section */}
        <Card className="border-0 shadow-sm rounded-xl overflow-hidden bg-background mb-8">
          <CardHeader className="bg-muted/30 border-b border-border px-6 py-5">
            <h3 className="font-bold text-foreground flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Team Member To-Do Lists
            </h3>
          </CardHeader>
          <CardContent className="p-6 bg-muted/30">
            {userTasks && userTasks.filter(u => u.total_tasks > 0).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userTasks.filter(u => u.total_tasks > 0).map(u => (
                  <div key={u.user_id} className="bg-muted/30 rounded-xl border border-border p-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border border-border shrink-0">
                        <AvatarFallback className="bg-blue-50 text-blue-700 font-bold text-sm">
                          {u.user_name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-foreground truncate">{u.user_name}</p>
                        <div className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground mt-0.5">
                          <CheckCircle2 className={`w-3 h-3 ${u.completed_tasks === u.total_tasks ? 'text-emerald-500' : 'text-muted-foreground'}`} />
                          <span>{u.completed_tasks}/{u.total_tasks} Tasks Completed</span>
                        </div>
                      </div>
                    </div>
                    <EmployeeTaskView projectId={projectId} userId={u.user_id} token={token} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-8 text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3 opacity-50" />
                <p className="text-sm font-medium">No tasks assigned to team members for this project.</p>
              </div>
            )}
          </CardContent>
        </Card>
        </>
        )}

        {activeTab === 'tasks' && (
          <TasksTab 
            projectId={Number(projectId)}
            tasks={tasks}
            deliverables={[]}
            teamMembers={project.members}
            canEdit={canEdit}
            filters={taskFilters}
            setFilters={setTaskFilters}
          />
        )}

        {activeTab === 'timesheets' && (
        <Card className="border-0 shadow-sm rounded-xl overflow-hidden bg-background mb-8">
          <CardHeader className="bg-muted/30 border-b border-border px-6 py-5">
            <h3 className="font-bold text-foreground flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-500" /> Timesheet Logs
            </h3>
          </CardHeader>
          <CardContent className="p-0">
            {timesheets.length > 0 ? (
              <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="pl-6">Date</TableHead>
                      <TableHead>Team Member</TableHead>
                      <TableHead>Task</TableHead>
                      <TableHead>Hours</TableHead>
                      <TableHead className="pr-6">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {timesheets.map((ts) => (
                          <TableRow key={ts.id} className="transition-colors">
                            <TableCell className="font-medium text-muted-foreground text-sm align-top py-4 pl-6">
                              {format(new Date(ts.date), 'dd MMM yyyy')}
                            </TableCell>
                            <TableCell className="align-top py-4">
                              <div className="flex items-center gap-2 mt-0.5">
                                <Avatar className="h-6 w-6">
                                  <AvatarFallback className="bg-indigo-100 text-indigo-700 text-[10px] font-bold">
                                    {ts.user_name?.charAt(0) || 'U'}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm font-semibold text-foreground">{ts.user_name}</span>
                              </div>
                            </TableCell>
                            <TableCell className="max-w-[300px] align-top py-4">
                              <div className="text-sm font-medium text-muted-foreground break-words whitespace-pre-wrap">
                                {ts.task_title}
                              </div>
                              <div className="text-xs text-muted-foreground break-words whitespace-pre-wrap mt-1">
                                {ts.description}
                              </div>
                            </TableCell>
                            <TableCell className="align-top py-4">
                              <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100 mt-0.5">
                                {ts.hours} hrs
                              </Badge>
                            </TableCell>
                            <TableCell className="align-top py-4 pr-6">
                              <Badge className={`mt-0.5 ${
                                ts.status === 'approved' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-0' :
                                ts.status === 'rejected' ? 'bg-red-100 text-red-700 hover:bg-red-200 border-0' :
                                'bg-amber-100 text-amber-700 hover:bg-amber-200 border-0'
                              }`}>
                                {ts.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {totalPages > 1 && (
                    <div className="p-4 border-t border-border flex items-center justify-between bg-muted/50/30">
                      <span className="text-xs text-muted-foreground font-medium">
                        Showing {Math.min((currentPage - 1) * 10 + 1, totalTimesheets)} to {Math.min(currentPage * 10, totalTimesheets)} of {totalTimesheets} entries
                      </span>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          disabled={currentPage === 1}
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          className="bg-background border-border text-foreground hover:bg-muted"
                        >
                          Previous
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          disabled={currentPage === totalPages || totalPages === 0}
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          className="bg-background border-border text-foreground hover:bg-muted"
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="p-12 text-center flex flex-col items-center">
                  <Clock className="h-12 w-12 text-muted-foreground/30 mb-4" />
                  <h3 className="text-lg font-bold text-foreground">No Activity Logged</h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-md">There are no timesheets submitted for this project yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

        <DeleteConfirmationModal
          isOpen={docToDelete !== null}
          onOpenChange={(open) => !open && setDocToDelete(null)}
          onConfirm={handleDeleteDocument}
          title="Delete Document"
          description="Are you sure you want to delete this document? This action cannot be undone."
          isDeleting={isDeleting}
        />

        <DocumentViewerModal 
          isOpen={viewerOpen} 
          onClose={() => setViewerOpen(false)} 
          docId={viewerDocId} 
          docType={viewerDocType} 
        />
        
        <ProjectFormModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          editingProject={project}
          employees={employees}
          reportingManagers={reportingManagers}
          onSuccess={() => {
            fetchData();
          }}
        />
    </div>
  );
}
