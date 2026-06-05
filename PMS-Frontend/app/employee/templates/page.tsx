'use client';

import { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  ExternalLink,
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
    (docTypeFullNames[t.doc_type] || '').toLowerCase().includes(searchQuery.toLowerCase())
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
             className="group text-slate-500 hover:text-indigo-600 font-semibold text-sm px-0 mb-2"
           >
             <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
             Back to Stream
           </Button>
           <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Master Templates</h1>
           <p className="text-slate-500 text-sm font-medium mt-1">Official Governance Artifacts & Standards</p>
        </div>

        <div className="relative w-full md:w-80 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
          <Input 
            placeholder="Filter standards..." 
            className="pl-11 h-11 rounded-xl bg-white border-slate-200 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm font-medium shadow-sm"
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
            <Card className="flex flex-col h-full border-slate-200 shadow-sm hover:shadow-md transition-all bg-white rounded-2xl group overflow-hidden">
              <CardHeader className="p-5 pb-3 border-b border-slate-100">
                <div className="mb-4">
                  <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600 w-fit">
                    <BookOpen className="h-6 w-6" />
                  </div>
                </div>
                <CardTitle className="text-lg font-bold text-slate-900 leading-tight mb-1 truncate" title={template.doc_type}>
                  {template.doc_type}
                </CardTitle>
                <p className="text-sm font-medium text-slate-500 truncate" title={docTypeFullNames[template.doc_type] || 'Standard Template'}>
                  {docTypeFullNames[template.doc_type] || 'Standard Template'}
                </p>
              </CardHeader>
              <CardContent className="p-5 pt-4 flex-grow flex flex-col justify-between space-y-5">
                
                {template.html_content && (
                   <div className="bg-slate-50/80 p-3.5 rounded-xl max-h-32 overflow-y-auto overflow-x-hidden border border-slate-100">
                     <p className="text-sm text-slate-600 font-medium leading-relaxed break-words whitespace-pre-wrap">
                        {template.html_content}
                     </p>
                   </div>
                )}



                <div className="flex gap-3">
                   {template.filename && (
                      <>
                        <Button 
                          onClick={async () => {
                            const newWindow = window.open('about:blank', '_blank');
                            if (newWindow) {
                               newWindow.document.write('<div style="font-family:sans-serif;padding:20px;text-align:center;">Loading document viewer...</div>');
                            }
                            try {
                              const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/templates/download/${encodeURIComponent(template.doc_type)}?inline=true`, {
                                headers: { Authorization: `Bearer ${token}` }
                              });
                              if (response.data?.url) {
                                 if (newWindow) {
                                    newWindow.location.href = response.data.url;
                                 } else {
                                    window.open(response.data.url, '_blank');
                                 }
                              } else {
                                 if (newWindow) newWindow.close();
                                 toast.error('Failed to retrieve document URL');
                              }
                            } catch (error) {
                              if (newWindow) newWindow.close();
                              toast.error('Failed to view document');
                            }
                          }}
                          className="flex-1 h-10 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View Document
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={() => handleDownload(template.doc_type, template.filename!)}
                          className="flex-1 h-10 rounded-lg border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                        >
                           <Download className="h-4 w-4 mr-2" />
                           Download
                        </Button>
                      </>
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
