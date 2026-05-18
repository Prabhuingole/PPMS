'use client';

import { useState, useEffect } from 'react';
import { 
  FileText, 
  Upload, 
  Download, 
  Eye, 
  Loader2, 
  CheckCircle2, 
  Code,
  FileCode
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { useAuthStore } from '@/store/authStore';
import axios from 'axios';
import { toast } from 'sonner';
import { DocumentTemplate } from '@/types';
import { format } from 'date-fns';

const docTypes = [
  { key: 'PRD', name: 'Project Requirement Document' },
  { key: 'Scope', name: 'Scope Document' },
  { key: 'JDR', name: 'Joint Discussion Report' },
  { key: 'BRD', name: 'Business Requirement Document' },
  { key: 'FRS', name: 'Functionality Requirement Specification' },
  { key: 'Req Gathering', name: 'Requirement Gathering Document' }
];

export default function TemplateManagementPage() {
  const { token } = useAuthStore();
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  
  // Modal State
  const [activeType, setActiveType] = useState<{key: string, name: string} | null>(null);
  const [htmlContent, setHtmlContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fetchTemplates = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/templates/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTemplates(response.data);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchTemplates();
  }, [token]);

  const handleUpdate = async () => {
    if (!activeType) return;
    setIsUploading(true);

    const formData = new FormData();
    formData.append('doc_type', activeType.key);
    if (htmlContent) formData.append('html_content', htmlContent);
    if (selectedFile) formData.append('file', selectedFile);

    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/templates/update`, formData, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      toast.success(`${activeType.key} template updated`);
      setActiveType(null);
      setHtmlContent('');
      setSelectedFile(null);
      fetchTemplates();
    } catch (error) {
      console.error('Update error:', error);
      toast.error('Failed to update template');
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600 mb-4" />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Synchronizing Template Matrix...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto p-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Template Governance</h1>
        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Global Master Artifact Management System</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {docTypes.map((type) => {
          const template = templates.find(t => t.doc_type === type.key);
          return (
            <Card key={type.key} className="rounded-3xl border-slate-100 shadow-2xl shadow-slate-200/50 hover:shadow-indigo-100 transition-all group">
              <CardHeader className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-slate-50 rounded-2xl group-hover:bg-indigo-50 transition-colors">
                    <FileText className="h-6 w-6 text-indigo-600" />
                  </div>
                  {template ? (
                    <Badge className="bg-emerald-50 text-emerald-600 border-none px-3 py-1 rounded-lg text-[8px] font-black uppercase">Active Matrix</Badge>
                  ) : (
                    <Badge className="bg-slate-100 text-slate-400 border-none px-3 py-1 rounded-lg text-[8px] font-black uppercase">Awaiting Draft</Badge>
                  )}
                </div>
                <CardTitle className="text-sm font-black text-slate-800 uppercase tracking-tight leading-none mb-1">{type.key}</CardTitle>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{type.name}</p>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <div className="space-y-4">
                   <div className="flex items-center space-x-3">
                      {template?.html_content && (
                         <div className="flex items-center text-[8px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2 py-1 rounded-md">
                            <Code className="h-3 w-3 mr-1" />
                            HTML Template
                         </div>
                      )}
                      {template?.filename && (
                         <div className="flex items-center text-[8px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-1 rounded-md">
                            <FileCode className="h-3 w-3 mr-1" />
                            PDF Asset
                         </div>
                      )}
                   </div>

                  <Dialog open={activeType?.key === type.key} onOpenChange={(open) => {
                    if (open) {
                       setActiveType(type);
                       setHtmlContent(template?.html_content || '');
                    } else {
                       setActiveType(null);
                    }
                  }}>
                    <DialogTrigger 
                      render={
                        <Button className="w-full h-10 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg shadow-slate-200">
                          Configure Template
                        </Button>
                      }
                    />
                    <DialogContent className="sm:max-w-[600px] rounded-[32px] p-8 border-slate-100 shadow-3xl">
                      <DialogHeader>
                        <DialogTitle className="text-2xl font-black uppercase tracking-tight text-slate-900">Configure {type.key}</DialogTitle>
                        <p className="text-slate-400 text-xs font-medium uppercase tracking-widest mt-1">Artifact Standard Definition</p>
                      </DialogHeader>
                      <div className="grid gap-6 py-6">
                        <div className="space-y-3">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">HTML Structure (Interactive Viewer)</Label>
                          <Textarea 
                            placeholder="Enter HTML template content for in-app viewing..."
                            className="min-h-[200px] rounded-2xl border-slate-200 font-mono text-xs focus:ring-2 focus:ring-indigo-600 transition-all"
                            value={htmlContent}
                            onChange={(e) => setHtmlContent(e.target.value)}
                          />
                        </div>
                        <div className="space-y-3">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Master Asset Upload (PDF/Word)</Label>
                          <div className="relative group">
                            <Input 
                              type="file" 
                              className="h-12 rounded-2xl border-slate-200 file:bg-indigo-50 file:text-indigo-600 file:border-none file:h-full file:mr-4 file:px-4 file:font-black file:text-[10px] file:uppercase cursor-pointer"
                              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                            />
                            {template?.filename && (
                               <p className="mt-2 text-[9px] font-bold text-emerald-600 uppercase tracking-widest flex items-center">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Current Asset: {template.filename}
                               </p>
                            )}
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button 
                          onClick={handleUpdate} 
                          disabled={isUploading}
                          className="w-full h-12 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all"
                        >
                          {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Synchronize Template'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
