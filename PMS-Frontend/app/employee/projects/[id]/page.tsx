'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Calendar, 
  Briefcase, 
  User, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Users,
  ExternalLink,
  Mail,
  Phone,
  Upload,
  Download,
  CloudUpload,
  Plus,
  Loader2,
  FileText,
  Eye,
  X,
  Trash2,
  Building2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import api from '@/services/api';
import { handleApiError } from '@/utils/handleApiError';
import { ErrorState } from '@/components/ui/error-state';
import { useAuthStore } from '@/store/authStore';
import { Project, ProjectDocument } from '@/types';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useWebSocketEvent } from '@/hooks/useWebSocketEvent';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { DeleteConfirmationModal } from "@/components/ui/delete-confirmation-modal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


const docTypeMap: Record<string, string> = {
  'PRD': 'Product Requirement Document',
  'Scope': 'Scope of Work',
  'JDR': 'Job Description Document',
  'BRD': 'Business Requirement Document',
  'FRS': 'Functional Requirement Specification',
  'Req Gathering': 'Requirements Gathering'
};

export default function ProjectDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { token, user } = useAuthStore();
  const [project, setProject] = useState<Project | null>(null);
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Upload State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [docToDelete, setDocToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  type FileDetail = {
    id: string;
    file: File;
    name: string;
    prepDate: string;
    type: string;
    otherType: string;
  };
  const [uploadFiles, setUploadFiles] = useState<FileDetail[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useWebSocketEvent(['PROJECTS_UPDATED', 'DOCUMENTS_UPDATED'], () => setRefreshTrigger(prev => prev + 1));

  const fetchProjectData = async () => {
    try {
      const [projRes, docRes, tempRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/documents/project/${id}`),
        api.get(`/templates/`)
      ]);
      setProject(projRes.data);
      setDocuments(docRes.data);
      setTemplates(tempRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load project details');
      router.push('/employee/projects');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token && id) {
      fetchProjectData();
    }
  }, [token, id, refreshTrigger]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newFiles = files.map(f => ({
      id: Math.random().toString(36).substring(7),
      file: f,
      name: f.name,
      prepDate: format(new Date(), 'yyyy-MM-dd'),
      type: 'PRD',
      otherType: ''
    }));
    setUploadFiles(prev => [...prev, ...newFiles]);
    e.target.value = '';
  };

  const handleFileUpload = async () => {
    if (uploadFiles.length === 0) {
      toast.error('Please select at least one file');
      return;
    }

    setIsUploading(true);
    let successCount = 0;
    
    try {
      await Promise.all(
        uploadFiles.map(async (fileData) => {
          const formData = new FormData();
          formData.append('file', fileData.file);
          formData.append('project_id', id as string);
          formData.append('doc_type', fileData.type === 'Other' ? (fileData.otherType || 'Other') : fileData.type);
          formData.append('display_name', fileData.name || fileData.file.name);
          formData.append('preparation_date', fileData.prepDate);
          
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || '/api'}/documents/upload`, {
            method: 'POST',
            headers: { 
              'Authorization': `Bearer ${token}`
            },
            body: formData
          });
          
          if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.detail ? (typeof errData.detail === 'string' ? errData.detail : errData.detail[0]?.msg) : 'Upload failed');
          }
          
          successCount++;
        })
      );
      toast.success(`Successfully uploaded ${successCount} document(s)`);
      setIsUploadModalOpen(false);
      setUploadFiles([]);
      fetchProjectData();
    } catch (error: any) {
      console.error('Upload error details:', error.response?.data || error.message || error);
      toast.error(`Failed to upload: ${error.response?.data?.detail?.[0]?.msg || 'Unknown error'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async (docId: number, filename: string) => {
    try {
      const response = await api.get(`/documents/download/${docId}?as_json=true&inline=false`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const url = response.data.url;
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

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground font-medium animate-pulse uppercase tracking-widest text-[10px]">Accessing Secure Stream Data...</p>
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Navigation */}
       <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <Button 
          variant="ghost" 
          onClick={() => router.back()}
          className="group text-muted-foreground hover:text-primary font-bold text-xs uppercase tracking-widest"
        >
          <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back
        </Button>
        <div className="flex items-center space-x-3">
           <Badge className={cn(
              "text-[10px] font-black uppercase tracking-widest border-none px-4 py-1.5 rounded-full shadow-sm",
              project.status === 'active' ? "bg-primary text-white" : 
              project.status === 'completed' ? "bg-emerald-600 text-white" :
              "bg-slate-200 text-slate-600"
            )}>
              {project.status}
            </Badge>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Project Overview */}
        <div className="lg:col-span-2 space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="bg-background p-6 rounded-xl border border-border shadow-2xl shadow-slate-200/50 dark:shadow-none relative overflow-hidden">
               {/* Decorative Background Element */}
               <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-50 dark:bg-indigo-900/20 rounded-full blur-3xl opacity-50" />
               
               <div className="relative z-10">
                  <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-3 block">{project.code}</span>
                  <h1 className="text-2xl md:text-3xl font-black text-foreground uppercase tracking-tight leading-none mb-4">
                    {project.name}
                  </h1>
                  <p className="text-muted-foreground text-sm font-medium leading-relaxed whitespace-pre-wrap break-all">
                    {project.description || 'No detailed description provided for this engagement stream.'}
                  </p>
                  
                  <div className="flex items-center gap-4 mt-8 pt-8 border-t border-slate-50">
                     <div className="flex items-center space-x-3">
                        <div className="p-3 bg-muted/30 rounded-xl">
                           <Calendar className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                           <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest block">Start Date</span>
                           <span className="text-base font-black text-foreground uppercase tracking-tight">
                             {project.start_date ? format(new Date(project.start_date), 'MMM yyyy') : 'TBD'}
                           </span>
                     </div>
                  </div>
               </div>
               </div>
            </div>
          </motion.div>

          {/* Time Tracking Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
             <div className="bg-background p-6 rounded-xl border border-border shadow-2xl shadow-slate-200/50 dark:shadow-none">
               <h2 className="text-xl font-black text-foreground uppercase tracking-tight mb-6">Time Tracking</h2>
               <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                 <div className="p-4 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl border border-indigo-100 dark:border-indigo-500/20 flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Total Allotted</span>
                    <span className="text-2xl font-black text-indigo-700 dark:text-indigo-400 break-all">
                      {Number((project.total_hours || 0).toFixed(2))}
                      <span className="text-sm font-bold opacity-70 ml-0.5">h</span>
                    </span>
                 </div>
                 <div className="p-4 bg-muted/30 rounded-xl border border-border flex flex-col items-center justify-center text-center overflow-hidden">
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Overall Consumed</span>
                    <span className="text-2xl font-black text-foreground break-all">
                      {Number((project.total_hours_worked || 0).toFixed(2))}
                      <span className="text-sm font-bold opacity-70 ml-0.5">h</span>
                    </span>
                 </div>
                 <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl border border-emerald-100 dark:border-emerald-500/20 flex flex-col items-center justify-center text-center overflow-hidden">
                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">My Contribution</span>
                    <span className="text-2xl font-black text-emerald-700 dark:text-emerald-400 break-all">
                      {Number((project.my_hours_worked || 0).toFixed(2))}
                      <span className="text-sm font-bold opacity-70 ml-0.5">h</span>
                    </span>
                 </div>
                 <div className={cn(
                    "p-4 rounded-xl border flex flex-col items-center justify-center text-center overflow-hidden",
                    ((project.total_hours_remaining ?? 0) < 0) ? "bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-500/20" : "bg-blue-50 dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/20"
                 )}>
                    <span className={cn(
                      "text-[10px] font-black uppercase tracking-widest mb-1",
                      ((project.total_hours_remaining ?? 0) < 0) ? "text-red-400" : "text-blue-400"
                    )}>
                      {((project.total_hours_remaining ?? 0) < 0) ? "Over Budget" : "Remaining"}
                    </span>
                    <span className={cn(
                      "text-2xl font-black break-all",
                      ((project.total_hours_remaining ?? 0) < 0) ? "text-red-600 dark:text-red-400" : "text-blue-700 dark:text-blue-400"
                    )}>
                      {Number((((project.total_hours_remaining ?? 0) < 0) ? (project.total_hours_remaining || 0) * -1 : project.total_hours_remaining || 0).toFixed(2))}
                      <span className="text-sm font-bold opacity-70 ml-0.5">h</span>
                    </span>
                 </div>
               </div>
             </div>
          </motion.div>

          {/* Project Documents Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
             <div className="bg-background p-4 sm:p-6 rounded-xl border border-border shadow-2xl shadow-slate-200/50 dark:shadow-none">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-8">
                  <div>
                     <h2 className="text-xl font-black text-foreground uppercase tracking-tight">Project Documents</h2>
                     <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mt-1">Managed Documentation Repository</p>
                  </div>
                  <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
                     <DialogTrigger 
                        render={
                           <Button className="h-9 px-4 rounded-xl bg-primary text-white text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
                              <CloudUpload className="h-3 w-3 mr-2" />
                              Upload Documents
                           </Button>
                        }
                     />
                      <DialogContent className="sm:max-w-[500px] rounded-[32px] border-border p-4 sm:p-8">
                        <DialogHeader>
                           <DialogTitle className="text-xl font-black uppercase tracking-tight text-foreground">Upload Documents</DialogTitle>
                           <p className="text-muted-foreground text-xs font-medium">Upload one or multiple documents to the stream.</p>
                        </DialogHeader>
                        
                        <div className="py-2">
                           <div className="relative group mb-4">
                              <Input 
                                 type="file"
                                 multiple
                                 onChange={handleFileSelect}
                                 className="h-11 rounded-xl border-border file:bg-indigo-50 dark:file:bg-indigo-500/10 file:text-primary file:border-none file:h-full file:mr-4 file:px-4 file:font-black file:text-[10px] file:uppercase cursor-pointer"
                              />
                           </div>

                           {uploadFiles.length > 0 && (
                             <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
                               {uploadFiles.map((fileData, index) => (
                                 <div key={fileData.id} className="p-4 border border-border rounded-xl bg-muted/30 relative group/file">
                                   <Button 
                                     variant="ghost" 
                                     size="icon"
                                     className="absolute top-2 right-2 h-6 w-6 text-muted-foreground hover:text-red-500 rounded-full hover:bg-red-50 dark:hover:bg-red-500/10"
                                     onClick={() => setUploadFiles(prev => prev.filter((_, i) => i !== index))}
                                   >
                                     <X className="h-4 w-4" />
                                   </Button>
                                   <div className="space-y-4 mt-2">
                                     <div className="space-y-1.5">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Document Title</Label>
                                        <Input 
                                           value={fileData.name}
                                           onChange={(e) => {
                                             const newFiles = [...uploadFiles];
                                             newFiles[index].name = e.target.value;
                                             setUploadFiles(newFiles);
                                           }}
                                           className="h-9 rounded-lg border-border focus:border-indigo-400 focus:ring-0 text-xs bg-background"
                                        />
                                     </div>
                                     <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                           <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Date</Label>
                                           <Input 
                                              type="date"
                                              value={fileData.prepDate}
                                              onChange={(e) => {
                                                const newFiles = [...uploadFiles];
                                                newFiles[index].prepDate = e.target.value;
                                                setUploadFiles(newFiles);
                                              }}
                                              className="h-9 rounded-lg border-border text-xs bg-background"
                                           />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Type</Label>
                                            <Select
                                               value={fileData.type}
                                               onValueChange={(val) => {
                                                 const newFiles = [...uploadFiles];
                                                 newFiles[index].type = val;
                                                 setUploadFiles(newFiles);
                                               }}
                                            >
                                               <SelectTrigger className="h-9 rounded-lg border-border text-xs">
                                                 <SelectValue placeholder="Select type" />
                                               </SelectTrigger>
                                               <SelectContent>
                                                 {Object.entries(docTypeMap).map(([key, value]) => (
                                                    <SelectItem key={key} value={key}>{key}</SelectItem>
                                                 ))}
                                                 <SelectItem value="Other">Other</SelectItem>
                                               </SelectContent>
                                            </Select>
                                        </div>
                                     </div>
                                     {fileData.type === 'Other' && (
                                        <div className="space-y-1.5">
                                           <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Specify Document Type</Label>
                                           <Input 
                                              placeholder="e.g. Architecture Diagram"
                                              value={fileData.otherType}
                                              onChange={(e) => {
                                                const newFiles = [...uploadFiles];
                                                newFiles[index].otherType = e.target.value;
                                                setUploadFiles(newFiles);
                                              }}
                                              className="h-9 rounded-lg border-border focus:border-indigo-400 focus:ring-0 text-xs bg-background"
                                           />
                                        </div>
                                     )}
                                   </div>
                                 </div>
                               ))}
                             </div>
                           )}
                        </div>
                        <DialogFooter>
                           <Button 
                              onClick={handleFileUpload} 
                              disabled={isUploading || uploadFiles.length === 0}
                              className="w-full h-12 bg-primary text-white rounded-xl font-black uppercase tracking-widest text-xs shadow-xl shadow-indigo-100 hover:bg-indigo-700"
                           >
                              {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Finalize Upload'}
                           </Button>
                        </DialogFooter>
                     </DialogContent>
                  </Dialog>
                </div>

               {documents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed border-border rounded-[2rem] bg-muted/30">
                     <div className="h-16 w-16 bg-background rounded-xl shadow-sm border border-border flex items-center justify-center mb-4">
                        <FileText className="h-8 w-8 text-slate-300" />
                     </div>
                     <span className="text-sm font-black text-foreground uppercase tracking-tight">No Documents Available</span>
                     <span className="text-xs font-medium text-muted-foreground mt-1">Documentation has not been uploaded to this stream yet.</span>
                  </div>
               ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {documents.map(doc => (
                        <div key={doc.id} className="group relative bg-background border border-border hover:border-indigo-300 p-5 rounded-[2rem] transition-all duration-300 hover:shadow-xl hover:shadow-indigo-100/50 flex flex-col justify-between">
                           <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-4">
                                 <div className="h-12 w-12 bg-indigo-50 dark:bg-indigo-500/10 text-primary rounded-xl flex items-center justify-center font-black text-xs uppercase tracking-wider shrink-0">
                                    {doc.doc_type}
                                 </div>
                                 <div className="flex flex-col overflow-hidden min-w-0">
                                    <span className="text-sm font-black text-foreground break-words" title={doc.display_name}>{doc.display_name}</span>
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">{docTypeMap[doc.doc_type as keyof typeof docTypeMap] || doc.doc_type}</span>
                                 </div>
                              </div>
                           </div>
                           <div className="flex items-center justify-between pt-4 border-t border-slate-50 mt-auto">
                              <div className="flex items-center text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                                 <Calendar className="h-3 w-3 mr-1.5" />
                                 {doc.preparation_date ? format(new Date(doc.preparation_date), 'dd MMM yyyy') : 'No Date'}
                              </div>
                              <div className="flex gap-1 shrink-0">
                                 <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 rounded-lg text-muted-foreground hover:text-primary hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors"
                                    onClick={() => window.open(`/employee/projects/view-doc?id=${doc.id}`, '_blank')}
                                 >
                                    <Eye className="h-4 w-4" />
                                 </Button>
                                 <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 rounded-lg text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors"
                                    onClick={() => handleDownload(doc.id, doc.filename)}
                                 >
                                    <Download className="h-4 w-4" />
                                 </Button>
                                 <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                                    onClick={() => setDocToDelete(doc.id)}
                                 >
                                    <Trash2 className="h-4 w-4" />
                                 </Button>
                              </div>
                           </div>
                        </div>
                     ))}
                  </div>
               )}

               <DeleteConfirmationModal
                 isOpen={docToDelete !== null}
                 onOpenChange={(open) => !open && setDocToDelete(null)}
                 onConfirm={handleDeleteDocument}
                 title="Delete Document?"
                 itemName="this document"
                 isDeleting={isDeleting}
               />
            </div>
          </motion.div>
        </div>

        {/* Right Column: Key Contacts & Sidebar */}
        <div className="space-y-8">
          {/* Reporting Manager Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Card className="rounded-xl border-none shadow-2xl shadow-slate-200/50 dark:shadow-none bg-slate-900 text-white overflow-hidden">
               <CardHeader className="p-6 pb-0">
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Direct Oversight</span>
                  <h2 className="text-xl font-black uppercase tracking-tight mt-1">Reporting Manager</h2>
               </CardHeader>
               <CardContent className="p-6">
                  <div className="flex items-center space-x-3 mb-6">
                     <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center text-lg font-black border-2 border-indigo-500/50">
                        {project.reporting_manager?.full_name.split(' ').map(n=>n[0]).join('') || 'RM'}
                     </div>
                     <div>
                        <h3 className="text-base font-black tracking-tight leading-tight">{project.reporting_manager?.full_name || 'Not Assigned'}</h3>
                        <p className="text-indigo-400 text-[10px] font-bold uppercase tracking-widest">{project.reporting_manager?.designation || 'Manager'}</p>
                     </div>
                  </div>
                  
                  <div className="space-y-3">
                     <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex items-center space-x-3">
                        <Mail className="h-4 w-4 text-indigo-400" />
                        <div className="flex flex-col">
                           <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-tighter">Corporate Email</span>
                           <span className="text-xs font-bold text-slate-200 truncate">{project.reporting_manager?.email || 'N/A'}</span>
                        </div>
                     </div>
                     <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex items-center space-x-3">
                        <Phone className="h-4 w-4 text-indigo-400" />
                        <div className="flex flex-col">
                           <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-tighter">Mobile Number</span>
                           <span className="text-xs font-bold text-slate-200">{project.reporting_manager?.mobile_number || 'N/A'}</span>
                        </div>
                     </div>
                  </div>
               </CardContent>
            </Card>
          </motion.div>

          {/* Team Members List */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="rounded-xl border-border shadow-2xl shadow-slate-200/50 dark:shadow-none bg-background">
               <CardHeader className="p-6 pb-3">
                  <h2 className="text-base font-black uppercase tracking-tight text-foreground">Assigned Team</h2>
                  <p className="text-muted-foreground text-[10px] font-medium">Core contributors to this stream</p>
               </CardHeader>
               <CardContent className="p-6 pt-2 space-y-3">
                  {project.members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-muted transition-colors group">
                       <div className="flex items-center space-x-3">
                          <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center font-black text-[10px] text-muted-foreground group-hover:bg-indigo-100 group-hover:text-primary transition-colors">
                             {member.full_name.split(' ').map(n=>n[0]).join('')}
                          </div>
                          <div>
                             <h4 className="text-xs font-black text-foreground uppercase tracking-tight leading-none mb-1">{member.full_name}</h4>
                             <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{member.designation || 'Specialist'}</p>
                          </div>
                       </div>
                    </div>
                  ))}
                  
                  {project.members.length === 0 && (
                    <p className="text-muted-foreground text-[10px] text-center py-4 italic">No other members assigned.</p>
                  )}
               </CardContent>
            </Card>
          </motion.div>
        </div>

      </div>
    </div>
  );
}
