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
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import axios from 'axios';
import { useAuthStore } from '@/store/authStore';
import { Project, ProjectDocument } from '@/types';
import { toast } from 'sonner';
import { format } from 'date-fns';
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

const docTypeMap: Record<string, string> = {
  'PRD': 'Project Requirement Document',
  'Scope': 'Scope Document',
  'JDR': 'Joint Discussion Report',
  'BRD': 'Business Requirement Document',
  'FRS': 'Functionality Requirement Specification',
  'Req Gathering': 'Requirement Gathering Document'
};

export default function ProjectDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { token, user } = useAuthStore();
  const [project, setProject] = useState<Project | null>(null);
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Upload State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    name: '',
    prepDate: format(new Date(), 'yyyy-MM-dd'),
    type: 'PRD',
    file: null as File | null
  });

  const fetchProjectData = async () => {
    try {
      const [projRes, docRes] = await Promise.all([
        axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/projects/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/documents/project/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      setProject(projRes.data);
      setDocuments(docRes.data);
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
  }, [token, id]);

  const handleFileUpload = async () => {
    if (!uploadForm.file) {
      toast.error('Please select a file');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', uploadForm.file);
    formData.append('project_id', id as string);
    formData.append('doc_type', uploadForm.type);
    formData.append('display_name', uploadForm.name || uploadForm.file.name);
    formData.append('preparation_date', uploadForm.prepDate);

    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/documents/upload`, formData, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      toast.success('Document uploaded successfully');
      setIsUploadModalOpen(false);
      setUploadForm({
        name: '',
        prepDate: format(new Date(), 'yyyy-MM-dd'),
        type: 'PRD',
        file: null
      });
      fetchProjectData();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload document');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async (docId: number, filename: string) => {
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

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
        <p className="text-slate-500 font-medium animate-pulse uppercase tracking-widest text-[10px]">Accessing Secure Stream Data...</p>
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Navigation */}
      <div className="flex items-center justify-between">
        <Button 
          variant="ghost" 
          onClick={() => router.back()}
          className="group text-slate-500 hover:text-indigo-600 font-bold text-xs uppercase tracking-widest"
        >
          <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back to Stream
        </Button>
        <div className="flex items-center space-x-3">
           <Badge className={cn(
              "text-[10px] font-black uppercase tracking-widest border-none px-4 py-1.5 rounded-full shadow-sm",
              project.status === 'active' ? "bg-indigo-600 text-white" : 
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
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-2xl shadow-slate-200/50 relative overflow-hidden">
               {/* Decorative Background Element */}
               <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-50" />
               
               <div className="relative z-10">
                  <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em] mb-3 block">{project.code}</span>
                  <h1 className="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-tight leading-none mb-4">
                    {project.name}
                  </h1>
                  <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-2xl">
                    {project.description || 'No detailed description provided for this engagement stream.'}
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8 pt-8 border-t border-slate-50">
                     <div className="flex items-center space-x-3">
                        <div className="p-3 bg-slate-50 rounded-xl">
                           <Briefcase className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div>
                           <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Primary Client</span>
                           <span className="text-base font-black text-slate-800 uppercase tracking-tight">{project.client_name || 'Internal'}</span>
                        </div>
                     </div>
                     <div className="flex items-center space-x-3">
                        <div className="p-3 bg-slate-50 rounded-xl">
                           <Calendar className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div>
                           <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Timeline</span>
                           <span className="text-base font-black text-slate-800 uppercase tracking-tight">
                             {project.start_date ? format(new Date(project.start_date), 'MMM yy') : 'TBD'} — {project.end_date ? format(new Date(project.end_date), 'MMM yy') : 'Ongoing'}
                           </span>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          </motion.div>

          {/* Project Artifacts Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-2xl shadow-slate-200/50">
               <div className="flex items-center justify-between mb-8">
                  <div>
                     <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Project Artifacts</h2>
                     <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Managed Documentation Repository</p>
                  </div>
                  
                  <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
                     <DialogTrigger 
                        render={
                           <Button className="h-9 px-4 rounded-xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
                              <CloudUpload className="h-3 w-3 mr-2" />
                              Secure Upload
                           </Button>
                        }
                     />
                     <DialogContent className="sm:max-w-[425px] rounded-[32px] border-slate-100 p-8">
                        <DialogHeader>
                           <DialogTitle className="text-xl font-black uppercase tracking-tight text-slate-900">Upload Artifact</DialogTitle>
                           <p className="text-slate-400 text-xs font-medium">Add metadata and secure your document.</p>
                        </DialogHeader>
                        <div className="grid gap-6 py-6">
                           <div className="space-y-2">
                              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Document Title</Label>
                              <Input 
                                 placeholder="e.g. V1.0 Client Signoff"
                                 value={uploadForm.name}
                                 onChange={(e) => setUploadForm({...uploadForm, name: e.target.value})}
                                 className="h-11 rounded-xl border-slate-200 focus:border-indigo-400 focus:ring-0"
                              />
                           </div>
                           <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                 <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Preparation Date</Label>
                                 <Input 
                                    type="date"
                                    value={uploadForm.prepDate}
                                    onChange={(e) => setUploadForm({...uploadForm, prepDate: e.target.value})}
                                    className="h-11 rounded-xl border-slate-200"
                                 />
                              </div>
                              <div className="space-y-2">
                                 <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Artifact Category</Label>
                                 <select 
                                    value={uploadForm.type}
                                    onChange={(e) => setUploadForm({...uploadForm, type: e.target.value})}
                                    className="w-full h-11 rounded-xl border border-slate-200 px-3 text-xs font-bold bg-white"
                                 >
                                    {Object.entries(docTypeMap).map(([key, value]) => (
                                       <option key={key} value={key}>{key}</option>
                                    ))}
                                 </select>
                              </div>
                           </div>
                           <div className="space-y-2">
                              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Secure File</Label>
                              <div className="relative group">
                                 <Input 
                                    type="file"
                                    onChange={(e) => setUploadForm({...uploadForm, file: e.target.files?.[0] || null})}
                                    className="h-11 rounded-xl border-slate-200 file:bg-indigo-50 file:text-indigo-600 file:border-none file:h-full file:mr-4 file:px-4 file:font-black file:text-[10px] file:uppercase cursor-pointer"
                                 />
                              </div>
                           </div>
                        </div>
                        <DialogFooter>
                           <Button 
                              onClick={handleFileUpload} 
                              disabled={isUploading}
                              className="w-full h-12 bg-indigo-600 text-white rounded-xl font-black uppercase tracking-widest text-xs shadow-xl shadow-indigo-100 hover:bg-indigo-700"
                           >
                              {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Finalize Upload'}
                           </Button>
                        </DialogFooter>
                     </DialogContent>
                  </Dialog>
               </div>

               <div className="grid grid-cols-1 gap-6">
                  {Object.entries(docTypeMap).map(([key, fullName]) => {
                     const docs = documents.filter(d => d.doc_type === key);
                     return (
                        <div key={key} className="p-5 rounded-3xl border border-slate-50 bg-slate-50/30 group hover:border-indigo-100 hover:bg-white transition-all shadow-sm">
                           <div className="flex items-center justify-between mb-6">
                              <div className="flex items-center space-x-3">
                                 <div className="p-2.5 bg-white rounded-xl shadow-sm border border-slate-100">
                                    <FileText className="h-5 w-5 text-indigo-600" />
                                 </div>
                                 <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">{key}</span>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{fullName}</span>
                                 </div>
                              </div>
                              <Badge className="bg-indigo-50 text-indigo-600 border-none text-[9px] font-black uppercase px-3 py-1 rounded-lg">{docs.length} Artifacts</Badge>
                           </div>
                           
                           <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                              {docs.map(doc => (
                                 <div key={doc.id} className="flex items-center justify-between p-3 rounded-2xl bg-white border border-slate-100 group/item hover:border-indigo-200 hover:shadow-md transition-all">
                                    <div className="flex flex-col overflow-hidden mr-2">
                                       <span className="text-[10px] font-black text-slate-800 truncate" title={doc.display_name}>{doc.display_name}</span>
                                       <div className="flex items-center space-x-2 mt-1">
                                          <div className="flex items-center text-[8px] font-bold text-slate-400 uppercase tracking-tighter">
                                             <Calendar className="h-2.5 w-2.5 mr-1" />
                                             {doc.preparation_date ? format(new Date(doc.preparation_date), 'dd MMM yy') : 'No Date'}
                                          </div>
                                       </div>
                                    </div>
                                    <Button 
                                       variant="ghost" 
                                       size="icon" 
                                       className="h-8 w-8 rounded-xl text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 shrink-0"
                                       onClick={() => handleDownload(doc.id, doc.filename)}
                                    >
                                       <Download className="h-4 w-4" />
                                    </Button>
                                 </div>
                              ))}
                              {docs.length === 0 && (
                                 <div className="md:col-span-2 xl:col-span-3 flex flex-col items-center justify-center py-8 border-2 border-dashed border-slate-100 rounded-2xl bg-white/50">
                                    <Plus className="h-5 w-5 text-slate-200 mb-2" />
                                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Awaiting Stream Data</span>
                                 </div>
                              )}
                           </div>
                        </div>
                     )
                  })}
               </div>
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
            <Card className="rounded-3xl border-none shadow-2xl shadow-slate-200/50 bg-slate-900 text-white overflow-hidden">
               <CardHeader className="p-6 pb-0">
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Direct Oversight</span>
                  <h2 className="text-xl font-black uppercase tracking-tight mt-1">Reporting Manager</h2>
               </CardHeader>
               <CardContent className="p-6">
                  <div className="flex items-center space-x-3 mb-6">
                     <div className="h-12 w-12 rounded-xl bg-indigo-600 flex items-center justify-center text-lg font-black border-2 border-indigo-500/50">
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
                           <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">Corporate Email</span>
                           <span className="text-xs font-bold text-slate-200 truncate">{project.reporting_manager?.email || 'N/A'}</span>
                        </div>
                     </div>
                     <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex items-center space-x-3">
                        <Phone className="h-4 w-4 text-indigo-400" />
                        <div className="flex flex-col">
                           <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">Mobile Number</span>
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
            <Card className="rounded-3xl border-slate-100 shadow-2xl shadow-slate-200/50 bg-white">
               <CardHeader className="p-6 pb-3">
                  <h2 className="text-base font-black uppercase tracking-tight text-slate-800">Assigned Team</h2>
                  <p className="text-slate-400 text-[10px] font-medium">Core contributors to this stream</p>
               </CardHeader>
               <CardContent className="p-6 pt-2 space-y-3">
                  {project.members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-colors group">
                       <div className="flex items-center space-x-3">
                          <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center font-black text-[10px] text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                             {member.full_name.split(' ').map(n=>n[0]).join('')}
                          </div>
                          <div>
                             <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight leading-none mb-1">{member.full_name}</h4>
                             <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{member.designation || 'Specialist'}</p>
                          </div>
                       </div>
                    </div>
                  ))}
                  
                  {project.members.length === 0 && (
                    <p className="text-slate-400 text-[10px] text-center py-4 italic">No other members assigned.</p>
                  )}
               </CardContent>
            </Card>
          </motion.div>
        </div>

      </div>
    </div>
  );
}
