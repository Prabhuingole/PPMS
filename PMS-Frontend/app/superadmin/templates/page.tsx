'use client';

import { useState, useEffect } from 'react';
import { 
  FileText, 
  Upload, 
  Download, 
  Loader2, 
  CheckCircle2, 
  FileCode,
  Plus,
  X,
  Edit2,
  Trash2,
  Eye,
  Clock,
  Search
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
import { useWebSocketEvent } from '@/hooks/useWebSocketEvent';
import { DeleteConfirmationModal } from "@/components/ui/delete-confirmation-modal";

export default function TemplateManagementPage() {
  const { token } = useAuthStore();
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal State
  const [activeType, setActiveType] = useState<{key: string, name: string} | null>(null);
  const [editTemplateName, setEditTemplateName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [removeFile, setRemoveFile] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useWebSocketEvent('TEMPLATES_UPDATED', () => setRefreshTrigger(prev => prev + 1));

  const dynamicDocTypes = templates.map(t => ({ key: t.doc_type, name: t.doc_type }));

  // Sort: prioritize templates WITH files, then sort by updated_at descending
  dynamicDocTypes.sort((a, b) => {
    const tA = templates.find(t => t.doc_type === a.key);
    const tB = templates.find(t => t.doc_type === b.key);
    
    const hasFileA = !!tA?.filename;
    const hasFileB = !!tB?.filename;
    
    if (hasFileA && !hasFileB) return -1;
    if (!hasFileA && hasFileB) return 1;

    const dateA = tA?.updated_at ? new Date(tA.updated_at).getTime() : 0;
    const dateB = tB?.updated_at ? new Date(tB.updated_at).getTime() : 0;
    return dateB - dateA;
  });

  const filteredDocTypes = dynamicDocTypes.filter(type => 
    type.key.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (templates.find(t => t.doc_type === type.key)?.html_content || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  const confirmDelete = (docType: string) => {
    setTemplateToDelete(docType);
    setDeleteModalOpen(true);
  };

  const handleDeleteTemplate = async () => {
    if (!templateToDelete) return;
    try {
      setIsDeleting(true);
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/templates/delete/${encodeURIComponent(templateToDelete)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`${templateToDelete} template deleted`);
      setActiveType(null);
      fetchTemplates();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete template');
    } finally {
      setIsDeleting(false);
      setDeleteModalOpen(false);
      setTemplateToDelete(null);
    }
  };

  const handleViewDocument = async (docType: string, action: 'view' | 'download' = 'view') => {
    let newWindow: Window | null = null;
    if (action === 'view') {
       newWindow = window.open('about:blank', '_blank');
       if (newWindow) {
          newWindow.document.write('<div style="font-family:sans-serif;padding:20px;text-align:center;">Loading document viewer...</div>');
       }
    }
    
    try {
      const isInline = action === 'view';
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/templates/download/${encodeURIComponent(docType)}?inline=${isInline}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data?.url) {
        if (action === 'download') {
          window.open(response.data.url, '_blank');
        } else {
           if (newWindow) {
              newWindow.location.href = response.data.url;
           } else {
              window.open(response.data.url, '_blank');
           }
        }
      } else {
        if (newWindow) newWindow.close();
        toast.error('Failed to retrieve document URL');
      }
    } catch (error) {
      if (newWindow) newWindow.close();
      console.error('Error viewing document:', error);
      toast.error('Failed to view document');
    }
  };

  useEffect(() => {
    if (token) fetchTemplates();
  }, [token, refreshTrigger]);

  const handleUpdate = async () => {
    if (!activeType) return;
    setIsUploading(true);

    const formData = new FormData();
    formData.append('doc_type', editTemplateName || activeType.key);
    formData.append('old_doc_type', activeType.key);
    if (description) formData.append('html_content', description);
    if (removeFile) formData.append('remove_file', 'true');
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
      setDescription('');
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
    <div className="space-y-8 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Premium Hero Section */}
      <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-8 sm:p-10 shadow-2xl">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl"></div>
        <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl"></div>
        
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight mb-2">
              Template Governance
            </h1>
            <p className="text-indigo-200 text-xs sm:text-sm font-bold uppercase tracking-widest flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Global Master Artifact Management System
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
              <Input 
                placeholder="Search templates..." 
                className="pl-9 h-12 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:ring-white/30 rounded-2xl"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Dialog open={isCreatingNew} onOpenChange={(open) => {
             setIsCreatingNew(open);
             if (!open) {
                setNewTemplateName('');
                setDescription('');
                setSelectedFile(null);
             }
          }}>
             <DialogTrigger 
                render={
                   <Button className="h-12 px-6 rounded-2xl bg-indigo-500 hover:bg-indigo-400 text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-indigo-500/20 transition-all hover:scale-105 active:scale-95">
                      <Plus className="h-4 w-4 mr-2" />
                      New Template
                   </Button>
                }
             />
             <DialogContent className="sm:max-w-[600px] rounded-[32px] p-4 sm:p-8 border-slate-100 shadow-3xl">
                <DialogHeader>
                   <DialogTitle className="text-2xl font-black uppercase tracking-tight text-slate-900">Create New Template</DialogTitle>
                   <p className="text-slate-400 text-xs font-medium uppercase tracking-widest mt-1">Define custom artifact</p>
                </DialogHeader>
                <div className="grid gap-6 py-6">
                   <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Template Name</Label>
                      <Input 
                         placeholder="e.g. Weekly Report"
                         className="h-12 rounded-2xl border-slate-200"
                         value={newTemplateName}
                         onChange={(e) => setNewTemplateName(e.target.value)}
                      />
                   </div>
                   <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Template Description</Label>
                      <Textarea 
                         placeholder="Enter a brief description of what this template is used for..."
                         className="min-h-[100px] rounded-2xl border-slate-200 font-medium text-xs focus:ring-2 focus:ring-indigo-600 transition-all"
                         value={description}
                         onChange={(e) => setDescription(e.target.value)}
                      />
                   </div>
                   <div className="space-y-3">
                       <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Master Asset Upload (HTML / PDF / Word / Excel) <span className="text-red-500">*</span>
                       </Label>
                      {selectedFile ? (
                         <div className="flex items-center justify-between p-4 rounded-2xl border border-indigo-100 bg-indigo-50/50">
                            <div className="flex items-center">
                               <FileCode className="h-4 w-4 text-indigo-600 mr-2" />
                               <span className="text-xs font-bold text-indigo-900">{selectedFile.name}</span>
                            </div>
                            <Button 
                               variant="ghost" 
                               className="h-8 w-8 p-0 text-indigo-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                               onClick={() => setSelectedFile(null)}
                            >
                               <X className="h-4 w-4" />
                            </Button>
                         </div>
                      ) : (
                          <>
                            <Input 
                               type="file" 
                               className="h-12 rounded-2xl border-slate-200 file:bg-indigo-50 file:text-indigo-600 file:border-none file:h-full file:mr-4 file:px-4 file:font-black file:text-[10px] file:uppercase cursor-pointer"
                               onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                            />
                            <p className="text-[10px] text-red-400 font-bold mt-1">
                              A document is required to create a template.
                            </p>
                          </>
                      )}
                   </div>
                </div>
                <DialogFooter>
                   <Button 
                      onClick={async () => {
                         if (!newTemplateName) {
                            toast.error('Template Name is required');
                            return;
                         }
                         if (!selectedFile) {
                            toast.error('Please upload a document to create the template');
                            return;
                         }
                         setIsUploading(true);
                         const formData = new FormData();
                         formData.append('doc_type', newTemplateName);
                         if (description) formData.append('html_content', description);
                         if (selectedFile) formData.append('file', selectedFile);
                         try {
                            await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/templates/update`, formData, {
                               headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
                            });
                            toast.success(`${newTemplateName} template created`);
                            setIsCreatingNew(false);
                            fetchTemplates();
                         } catch (error) {
                            toast.error('Failed to create template');
                         } finally {
                            setIsUploading(false);
                         }
                      }} 
                      disabled={isUploading}
                      className="w-full h-12 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all"
                   >
                      {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Template'}
                   </Button>
                </DialogFooter>
             </DialogContent>
          </Dialog>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDocTypes.map((type) => {
          const template = templates.find(t => t.doc_type === type.key);
          return (
            <Card key={type.key} className="rounded-[32px] border border-slate-100 bg-white/60 backdrop-blur-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(79,70,229,0.12)] hover:-translate-y-2 transition-all duration-500 group overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
              
              <div className="p-4 sm:p-8 pb-4 sm:pb-6 relative z-10">
                {/* Header: Icon & Badge */}
                <div className="flex items-start justify-between mb-8">
                  <div className="flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-50 to-white shadow-inner border border-indigo-100/50 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500">
                    <FileText className="h-6 w-6 text-indigo-600" />
                  </div>

                  {template?.filename ? (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100/50 text-[10px] font-black uppercase tracking-widest text-emerald-600 shadow-sm">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                      Ready
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200/50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <div className="h-1.5 w-1.5 rounded-full bg-slate-300"></div>
                      Pending
                    </div>
                  )}
                </div>

                {/* Content: Title, Desc, Date */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-black text-slate-800 tracking-tight leading-tight group-hover:text-indigo-600 transition-colors line-clamp-1 break-all mb-2">
                      {type.key}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 break-all leading-relaxed min-h-[32px]">
                      {template?.html_content || 'No detailed description provided for this template yet.'}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 pt-2">
                    <Clock className="h-3.5 w-3.5" />
                    {template?.updated_at ? format(new Date(template.updated_at), 'MMM d, yyyy') : 'No updates'}
                  </div>
                </div>
              </div>

              {/* Footer: Actions */}
              <div className="px-4 sm:px-8 pb-4 sm:pb-8 pt-2 relative z-10">
                <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent mb-6 opacity-60"></div>
                
                <div className="flex items-center justify-end">
                  <div className="flex items-center gap-2 opacity-70 group-hover:opacity-100 transition-opacity">
                    {template?.filename && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-9 w-9 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors shadow-sm bg-white border border-slate-100 group-hover:border-indigo-100"
                        onClick={() => handleViewDocument(template.doc_type, 'view')}
                        title="View Document"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    <Dialog open={activeType?.key === type.key} onOpenChange={(open) => {
                      if (open) {
                         setActiveType(type);
                         setEditTemplateName(type.key);
                         setDescription(template?.html_content || '');
                         setRemoveFile(false);
                      } else {
                         setActiveType(null);
                      }
                    }}>
                      <DialogTrigger 
                        render={
                          <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors shadow-sm bg-white border border-slate-100 group-hover:border-indigo-100">
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        }
                      />
                      <DialogContent className="sm:max-w-[600px] rounded-[32px] p-4 sm:p-8 border-slate-100 shadow-3xl">
                        <DialogHeader>
                          <DialogTitle className="text-2xl font-black uppercase tracking-tight text-slate-900">Configure {type.key}</DialogTitle>
                          <p className="text-slate-400 text-xs font-medium uppercase tracking-widest mt-1">Artifact Standard Definition</p>
                        </DialogHeader>
                        <div className="grid gap-6 py-6">
                          <div className="space-y-3">
                             <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Template Name</Label>
                             <Input 
                                placeholder="e.g. Weekly Report"
                                className="h-12 rounded-2xl border-slate-200"
                                value={editTemplateName}
                                onChange={(e) => setEditTemplateName(e.target.value)}
                             />
                          </div>
                          <div className="space-y-3">
                             <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Template Description</Label>
                             <Textarea 
                                placeholder="Enter a brief description of what this template is used for..."
                                className="min-h-[100px] rounded-2xl border-slate-200 font-medium text-xs focus:ring-2 focus:ring-indigo-600 transition-all"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                             />
                          </div>
                          <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Master Asset Upload (HTML / PDF / Word / Excel) <span className="text-red-500">*</span>
                       </Label>
                            {template?.filename && !removeFile ? (
                               <div className="flex flex-wrap items-center justify-between gap-2 p-3 sm:p-4 rounded-2xl border border-slate-200 bg-slate-50">
                                  <div className="flex items-center">
                                     <FileCode className="h-4 w-4 text-emerald-600 mr-2" />
                                     <span className="text-xs font-bold text-slate-700">{template.filename}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Button 
                                       type="button"
                                       variant="ghost" 
                                       className="h-8 w-8 p-0 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-100 rounded-full transition-colors"
                                       onClick={() => handleViewDocument(template.doc_type, 'view')}
                                       title="View Document"
                                    >
                                       <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                       type="button"
                                       variant="ghost" 
                                       className="h-8 w-8 p-0 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors"
                                       onClick={() => handleViewDocument(template.doc_type, 'download')}
                                       title="Download Document"
                                    >
                                       <Download className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                       type="button"
                                       variant="ghost" 
                                       className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                                       onClick={() => setRemoveFile(true)}
                                    >
                                       <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                               </div>
                            ) : selectedFile ? (
                               <div className="flex items-center justify-between p-4 rounded-2xl border border-indigo-100 bg-indigo-50/50">
                                  <div className="flex items-center">
                                     <FileCode className="h-4 w-4 text-indigo-600 mr-2" />
                                     <span className="text-xs font-bold text-indigo-900">{selectedFile.name}</span>
                                  </div>
                                  <Button 
                                     variant="ghost" 
                                     className="h-8 w-8 p-0 text-indigo-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                     onClick={() => setSelectedFile(null)}
                                  >
                                     <X className="h-4 w-4" />
                                  </Button>
                               </div>
                            ) : (
                               <Input 
                                 type="file" 
                                 className="h-12 rounded-2xl border-slate-200 file:bg-indigo-50 file:text-indigo-600 file:border-none file:h-full file:mr-4 file:px-4 file:font-black file:text-[10px] file:uppercase cursor-pointer"
                                 onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                               />
                            )}
                          </div>
                        </div>
                        <DialogFooter className="flex w-full mt-4">
                          <Button 
                            onClick={handleUpdate} 
                            disabled={isUploading}
                            className="w-full h-12 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all"
                          >
                            {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-9 w-9 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors shadow-sm bg-white border border-slate-100 group-hover:border-red-100"
                      onClick={() => confirmDelete(type.key)}
                      disabled={isUploading || isDeleting}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
        
      </div>

      {filteredDocTypes.length === 0 && (
         <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 rounded-[40px] border border-dashed border-slate-200">
            <FileText className="h-12 w-12 text-slate-300 mb-4" />
            <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-xs">No Templates Found</p>
         </div>
      )}

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        onConfirm={handleDeleteTemplate}
        itemName={`Template "${templateToDelete}"`}
        isDeleting={isDeleting}
      />
    </div>
  );
}
