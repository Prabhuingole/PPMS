'use client';

import { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Eye, 
  Loader2, 
  ArrowLeft,
  Search,
  BookOpen,
  Monitor
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { toast } from 'sonner';
import { DocumentTemplate } from '@/types';
import { motion } from 'motion/react';

const docTypeFullNames: Record<string, string> = {
  'PRD': 'Project Requirement Document',
  'Scope': 'Scope Document',
  'JDR': 'Joint Discussion Report',
  'BRD': 'Business Requirement Document',
  'FRS': 'Functionality Requirement Specification',
  'Req Gathering': 'Requirement Gathering Document'
};

export default function EmployeeTemplatesPage() {
  const { token } = useAuthStore();
  const router = useRouter();
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchTemplates = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/templates/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTemplates(response.data);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to load document templates');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchTemplates();
  }, [token]);

  const handleDownload = async (docType: string, filename: string) => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/templates/download/${docType}`, {
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
      toast.error('Failed to download template file');
    }
  };

  const filteredTemplates = templates.filter(t => 
    t.doc_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    docTypeFullNames[t.doc_type]?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600 mb-4" />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Accessing Artifact Library...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4 md:p-8">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
           <Button 
             variant="ghost" 
             onClick={() => router.back()}
             className="group text-slate-500 hover:text-indigo-600 font-bold text-[10px] uppercase tracking-widest px-0"
           >
             <ArrowLeft className="mr-2 h-3 w-3 transition-transform group-hover:-translate-x-1" />
             Back to Stream
           </Button>
           <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tight">Master Templates</h1>
           <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Official Governance Artifacts & Standards</p>
        </div>

        <div className="relative w-full md:w-80 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
          <Input 
            placeholder="Filter standards..." 
            className="pl-11 h-12 rounded-2xl border-slate-100 bg-white shadow-lg shadow-slate-100/50 focus:ring-2 focus:ring-indigo-600 transition-all text-xs font-bold uppercase tracking-widest"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {filteredTemplates.map((template, idx) => (
          <motion.div
            key={template.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <Card className="rounded-[32px] border-none shadow-2xl shadow-slate-200/50 hover:shadow-indigo-100/50 transition-all bg-white group h-full flex flex-col">
              <CardHeader className="p-8 pb-4">
                <div className="flex items-center justify-between mb-6">
                  <div className="p-4 bg-slate-50 rounded-2xl group-hover:bg-indigo-50 transition-colors">
                    <BookOpen className="h-8 w-8 text-indigo-600" />
                  </div>
                  <Badge className="bg-slate-900 text-white border-none px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em]">Matrix v1.0</Badge>
                </div>
                <CardTitle className="text-xl font-black text-slate-900 uppercase tracking-tight leading-none mb-2">{template.doc_type}</CardTitle>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                  {docTypeFullNames[template.doc_type]}
                </p>
              </CardHeader>
              <CardContent className="p-8 pt-4 flex-grow flex flex-col justify-between space-y-6">
                <div className="flex flex-wrap gap-2">
                   {template.html_content && (
                      <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest border-indigo-100 bg-indigo-50/30 text-indigo-600 px-3 py-1">
                         <Monitor className="h-3 w-3 mr-1.5" />
                         Interactive Viewer
                      </Badge>
                   )}
                   {template.filename && (
                      <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest border-emerald-100 bg-emerald-50/30 text-emerald-600 px-3 py-1">
                         <FileText className="h-3 w-3 mr-1.5" />
                         Asset Available
                      </Badge>
                   )}
                </div>

                <div className="flex gap-3">
                   {template.html_content && (
                      <Dialog>
                        <DialogTrigger asChild>
                           <Button className="flex-1 h-11 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200">
                             <Eye className="h-3.5 w-3.5 mr-2" />
                             View Standard
                           </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto rounded-[32px] p-8">
                           <DialogHeader>
                              <DialogTitle className="text-2xl font-black uppercase tracking-tight">{template.doc_type} Standard</DialogTitle>
                              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{docTypeFullNames[template.doc_type]}</p>
                           </DialogHeader>
                           <div className="mt-8 prose prose-slate max-w-none prose-sm font-medium leading-relaxed bg-slate-50 p-8 rounded-3xl border border-slate-100">
                              <div dangerouslySetInnerHTML={{ __html: template.html_content }} />
                           </div>
                        </DialogContent>
                      </Dialog>
                   )}
                   
                   {template.filename && (
                      <Button 
                        variant="outline"
                        onClick={() => handleDownload(template.doc_type, template.filename!)}
                        className="flex-1 h-11 rounded-xl border-slate-200 text-slate-600 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 hover:border-indigo-200 transition-all"
                      >
                         <Download className="h-3.5 w-3.5 mr-2" />
                         Get Asset
                      </Button>
                   )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
         <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-[40px] border border-dashed border-slate-200">
            <BookOpen className="h-12 w-12 text-slate-200 mb-4" />
            <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-xs">No Standards Found</p>
         </div>
      )}
    </div>
  );
}
