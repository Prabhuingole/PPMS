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
  Trash2
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
import axios from 'axios';
import { useAuthStore } from '@/store/authStore';
import { useWebSocketEvent } from '@/hooks/useWebSocketEvent';
import { toast } from 'sonner';
import { ProjectFormModal } from '../ProjectFormModal';
import { DeleteConfirmationModal } from "@/components/ui/delete-confirmation-modal";

export default function ProjectDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const { token } = useAuthStore();

  const [project, setProject] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [timesheets, setTimesheets] = useState<any[]>([]);
  const [managers, setManagers] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTimesheets, setTotalTimesheets] = useState(0);
  const [docToDelete, setDocToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const fetchTimesheets = async (page: number) => {
    if (!token || !projectId) return;
    try {
      const tsRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/timesheets/project/${projectId}?page=${page}&limit=10`, {
        headers: { Authorization: `Bearer ${token}` }
      });
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
      const [projRes, docRes, mgrRes, empRes] = await Promise.all([
        axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/projects/${projectId}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/documents/project/${projectId}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/reporting-managers/?status_filter=active&limit=1000`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/employees/?status_filter=true&limit=1000`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setProject(projRes.data);
      setDocuments(docRes.data);
      setManagers(mgrRes.data.items || mgrRes.data);
      setEmployees(empRes.data.items || empRes.data);
    } catch (error) {
      console.error('Error fetching project details:', error);
      toast.error('Failed to load project details');
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
      if (backPath && backPath.includes('/reporting-managers')) {
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
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/documents/download/${docId}`,
        { headers: { Authorization: `Bearer ${token}` } }
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
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/documents/${docToDelete}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
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
      <div className="flex-1 p-8 bg-slate-50 flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex-1 p-8 bg-slate-50 flex flex-col items-center justify-center min-h-[calc(100vh-4rem)]">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-800">Project Not Found</h2>
        <Button onClick={() => router.push('/superadmin/projects')} className="mt-4">
          Return to Projects
        </Button>
      </div>
    );
  }



  return (
    <div className="flex-1 p-4 sm:p-8 bg-slate-50 overflow-y-auto">
      {/* Header */}
      <div className="mb-8">
        <Button 
          variant="ghost" 
          onClick={() => router.push(backConfig.path)}
          className="mb-4 text-slate-500 hover:text-slate-800 -ml-2 h-8 px-2"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          <span className="text-xs font-bold uppercase tracking-widest">
            {backConfig.label}
          </span>
        </Button>

        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">{project.name}</h1>
              <Badge className={
                project.status === 'active' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-0' :
                project.status === 'on-hold' ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 border-0' :
                'bg-slate-100 text-slate-700 hover:bg-slate-200 border-0'
              }>
                {project.status === 'active' ? <CheckCircle2 className="w-3 h-3 mr-1" /> :
                 project.status === 'on-hold' ? <PauseCircle className="w-3 h-3 mr-1" /> :
                 <ShieldCheck className="w-3 h-3 mr-1" />}
                {project.status.toUpperCase()}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-500 font-medium">
              <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-md border border-slate-200 shadow-sm">
                <Briefcase className="h-4 w-4 text-blue-500" />
                <span className="font-mono text-xs">{project.code}</span>
              </div>
              {project.client_name && (
                <div className="flex items-center gap-1.5">
                  <Building2 className="h-4 w-4" />
                  <span>{project.client_name}</span>
                </div>
              )}
            </div>
          </div>
          
          <Button 
            onClick={() => setIsEditModalOpen(true)}
            variant="outline"
            className="border-slate-200 text-slate-600 bg-white hover:bg-slate-50 shadow-sm"
          >
            Edit Project Details
          </Button>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <Card className="border-0 shadow-sm bg-white overflow-hidden rounded-2xl">
          <CardContent className="p-6 relative h-full flex flex-col justify-center">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-bl-full -mr-4 -mt-4 opacity-50 pointer-events-none" />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Team Size</span>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-black text-slate-800">{project.members?.length || 0}</span>
                <span className="text-sm font-semibold text-slate-400 mb-1">Members</span>
              </div>
            </div>
            <Users className="absolute bottom-6 right-6 h-6 w-6 text-blue-400 opacity-50" />
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-white overflow-hidden rounded-2xl md:col-span-2 lg:col-span-2">
          <CardContent className="p-6 relative h-full flex flex-col justify-center">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-bl-full -mr-4 -mt-4 opacity-50 pointer-events-none" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Time Tracking</span>
            <div className="grid grid-cols-3 gap-4 w-full relative z-10">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Allotted</span>
                <span className="text-2xl font-black text-slate-800">{project.total_hours || 0}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Consumed</span>
                <span className="text-2xl font-black text-slate-800">{project.total_hours_worked || 0}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Remaining</span>
                <div className="flex items-end gap-1">
                  <span className={`text-2xl font-black ${(project.total_hours_remaining ?? 0) < 0 ? "text-red-500" : "text-emerald-500"}`}>
                    {(project.total_hours_remaining ?? 0) < 0 ? (project.total_hours_remaining || 0) * -1 : (project.total_hours_remaining || 0)}
                  </span>
                  {(project.total_hours_remaining ?? 0) < 0 && <span className="text-[10px] font-black uppercase text-red-500 mb-1">Over</span>}
                </div>
              </div>
            </div>
            <Clock className="absolute bottom-6 right-6 h-6 w-6 text-emerald-400 opacity-50" />
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-white overflow-hidden rounded-2xl">
          <CardContent className="p-6 relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-50 to-indigo-100/50 rounded-bl-full -mr-4 -mt-4 opacity-50 pointer-events-none" />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Documents</span>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-black text-slate-800">{documents.length}</span>
                <span className="text-sm font-semibold text-slate-400 mb-1">Files</span>
              </div>
            </div>
            <FileText className="absolute bottom-6 right-6 h-6 w-6 text-indigo-400 opacity-50" />
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-white overflow-hidden rounded-2xl">
          <CardContent className="p-6 relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-bl-full -mr-4 -mt-4 opacity-50 pointer-events-none" />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Timeline</span>
              <div className="flex flex-col mt-1">
                <span className="text-sm font-bold text-slate-800">
                  {project.start_date && project.end_date 
                    ? `${differenceInDays(new Date(project.end_date), new Date(project.start_date))} Days` 
                    : 'Duration N/A'}
                </span>
                <span className="text-xs font-medium text-slate-400 mt-0.5">
                  {project.start_date ? format(new Date(project.start_date), 'MMM d, yy') : 'N/A'} - {project.end_date ? format(new Date(project.end_date), 'MMM d, yy') : 'N/A'}
                </span>
              </div>
            </div>
            <Calendar className="absolute bottom-6 right-6 h-6 w-6 text-purple-400 opacity-50" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-0 shadow-sm rounded-3xl overflow-hidden bg-white">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 px-6 py-5">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-emerald-500" />
                Reporting Manager
              </h3>
            </CardHeader>
            <CardContent className="p-6">
              {project.reporting_manager ? (
                <div 
                  onClick={() => router.push(`/superadmin/reporting-managers/${project.reporting_manager.id}?backPath=/superadmin/projects/${project.id}`)}
                  className="flex items-center gap-4 p-3 -m-3 rounded-2xl cursor-pointer hover:bg-slate-50 transition-colors group"
                >
                  <Avatar className="h-16 w-16 border-2 border-emerald-100 group-hover:border-emerald-300 transition-colors">
                    <AvatarFallback className="bg-emerald-50 text-emerald-700 font-bold text-xl group-hover:bg-emerald-100 transition-colors">
                      {project.reporting_manager.full_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h4 className="text-lg font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{project.reporting_manager.full_name}</h4>
                    <p className="text-sm font-medium text-slate-500">{project.reporting_manager.email}</p>
                    {project.reporting_manager.designation && (
                      <Badge variant="secondary" className="mt-2 text-xs bg-slate-100 text-slate-600 group-hover:bg-slate-200">
                        {project.reporting_manager.designation}
                      </Badge>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-slate-400 italic">No reporting manager assigned.</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm rounded-3xl overflow-hidden bg-white">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 px-6 py-5">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-500" />
                Project Description
              </h3>
            </CardHeader>
            <CardContent className="p-6">
              {project.description ? (
                <p className="text-slate-600 leading-relaxed whitespace-pre-wrap break-words">{project.description}</p>
              ) : (
                <p className="text-slate-400 italic">No description provided for this project.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Team Members */}
        <Card className="border-0 shadow-sm rounded-3xl overflow-hidden bg-white lg:col-span-1">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 px-6 py-5 flex flex-row items-center justify-between sticky top-0">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              Team Members
            </h3>
            <Badge variant="outline" className="font-mono text-xs">{project.members?.length || 0}</Badge>
          </CardHeader>
          <CardContent className="p-0 overflow-y-auto max-h-[500px]">
            {project.members && project.members.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {project.members.map((member: any) => (
                  <div 
                    key={member.id} 
                    onClick={() => router.push(`/superadmin/employees/${member.id}`)}
                    className="p-4 flex items-center gap-3 hover:bg-slate-50 transition-colors cursor-pointer group"
                  >
                    <Avatar className="h-10 w-10 border border-slate-200 group-hover:border-blue-300 transition-colors">
                      <AvatarFallback className="bg-blue-50 text-blue-700 font-bold text-sm group-hover:bg-blue-100 transition-colors">
                        {member.full_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-800 truncate group-hover:text-blue-600 transition-colors">{member.full_name}</p>
                      <p className="text-xs font-medium text-slate-500 truncate">{member.email}</p>
                    </div>
                    {member.designation && (
                      <Badge variant="outline" className="text-[10px] uppercase tracking-wider text-slate-400 shrink-0 group-hover:border-blue-200 group-hover:text-blue-500 transition-colors">
                        {member.designation}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm italic">No team members assigned</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Documents Section */}
      <Card className="border-0 shadow-sm rounded-3xl overflow-hidden bg-white mb-8">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 px-6 py-5 flex flex-row items-center justify-between">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-500" /> Project Documents
          </h3>
        </CardHeader>
        <CardContent className="p-6">
          {documents.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {documents.map((doc: any) => (
                <div 
                  key={doc.id} 
                  className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100/60 hover:bg-white hover:shadow-md transition-all group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0 font-bold text-[10px]">
                      {doc.doc_type || 'DOC'}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-bold text-slate-800 truncate" title={doc.display_name}>
                        {doc.display_name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {doc.preparation_date ? format(new Date(doc.preparation_date), 'dd MMM yyyy') : 'No Date'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => window.open(`/superadmin/projects/view-doc?id=${doc.id}`, '_blank')}
                      className="h-8 w-8 rounded-xl hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition-colors"
                      title="View Document"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDownloadDoc(doc.id, doc.display_name || doc.filename)}
                      className="h-8 w-8 rounded-xl hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors"
                      title="Download Document"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => setDocToDelete(doc.id)}
                      className="h-8 w-8 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                      title="Delete Document"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center flex flex-col items-center">
              <File className="h-12 w-12 text-slate-300 mb-4" />
              <h3 className="text-lg font-bold text-slate-700">No Documents</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-md">This project doesn't have any uploaded documents yet.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity & Timesheets Section */}
      <Card className="border-0 shadow-sm rounded-3xl overflow-hidden bg-white mb-8">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 px-6 py-5">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-500" /> Timesheet Logs
          </h3>
        </CardHeader>
        <CardContent className="p-0">
          {timesheets.length > 0 ? (
            <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow className="hover:bg-transparent border-slate-100">
                    <TableHead className="font-black text-xs text-slate-500 uppercase tracking-widest pl-6">Date</TableHead>
                    <TableHead className="font-black text-xs text-slate-500 uppercase tracking-widest">Team Member</TableHead>
                    <TableHead className="font-black text-xs text-slate-500 uppercase tracking-widest">Task</TableHead>
                    <TableHead className="font-black text-xs text-slate-500 uppercase tracking-widest">Hours</TableHead>
                    <TableHead className="font-black text-xs text-slate-500 uppercase tracking-widest pr-6">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {timesheets.map((ts) => (
                        <TableRow key={ts.id} className="border-slate-50 hover:bg-slate-50/80 transition-colors">
                          <TableCell className="font-medium text-slate-700 text-sm align-top py-4 pl-6">
                            {format(new Date(ts.date), 'dd MMM yyyy')}
                          </TableCell>
                          <TableCell className="align-top py-4">
                            <div className="flex items-center gap-2 mt-0.5">
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="bg-indigo-100 text-indigo-700 text-[10px] font-bold">
                                  {ts.user_name?.charAt(0) || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-semibold text-slate-800">{ts.user_name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[300px] align-top py-4">
                            <div className="text-sm font-medium text-slate-700 break-words whitespace-pre-wrap">
                              {ts.task_title}
                            </div>
                            <div className="text-xs text-slate-400 break-words whitespace-pre-wrap mt-1">
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
                  <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/30">
                    <span className="text-xs text-slate-500 font-medium">
                      Showing {Math.min((currentPage - 1) * 10 + 1, totalTimesheets)} to {Math.min(currentPage * 10, totalTimesheets)} of {totalTimesheets} entries
                    </span>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        className="bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                      >
                        Previous
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        disabled={currentPage === totalPages || totalPages === 0}
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        className="bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="p-12 text-center flex flex-col items-center">
                <Clock className="h-12 w-12 text-slate-300 mb-4" />
                <h3 className="text-lg font-bold text-slate-700">No Activity Logged</h3>
                <p className="text-sm text-slate-500 mt-1 max-w-md">There are no timesheets submitted for this project yet.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <DeleteConfirmationModal
          isOpen={docToDelete !== null}
          onOpenChange={(open) => !open && setDocToDelete(null)}
          onConfirm={handleDeleteDocument}
          title="Delete Artifact?"
          itemName="this document"
          isDeleting={isDeleting}
        />
        
        <ProjectFormModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          editingProject={project}
          managers={managers}
          employees={employees}
          onSuccess={() => {
            fetchData();
          }}
        />
    </div>
  );
}
