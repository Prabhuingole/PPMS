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
import { ContentGridLayout } from '@/components/layout/ContentGridLayout';
import { EmptyState } from '@/components/ui/EmptyState';
import { 
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EnterpriseModalHeader } from '@/components/ui/enterprise-modal-header';
import { EnterpriseModalFooter } from '@/components/ui/enterprise-modal-footer';
import { useAuthStore } from '@/store/authStore';
import api from '@/services/api';
import { handleApiError } from '@/utils/handleApiError';
import { ErrorState } from '@/components/ui/error-state';
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
      const response = await api.get(`/templates/`);
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
      await api.delete(`/templates/delete/${encodeURIComponent(templateToDelete)}`);
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
      const response = await api.get(`/templates/download/${encodeURIComponent(docType)}?inline=${isInline}`);
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

    const template = templates.find(t => t.doc_type === activeType.key);
    const hasExistingFile = template?.filename && !removeFile;
    if (!hasExistingFile && !selectedFile) {
      toast.error('Templates cannot be saved without a document. Please upload a master asset.');
      return;
    }

    setIsUploading(true);

    const formData = new FormData();
    formData.append('doc_type', editTemplateName || activeType.key);
    formData.append('old_doc_type', activeType.key);
    if (description) formData.append('html_content', description);
    if (removeFile) formData.append('remove_file', 'true');
    if (selectedFile) formData.append('file', selectedFile);

    try {
      await api.post(`/templates/update`, formData, {
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
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground font-bold uppercase tracking-widest text-[10px]">Synchronizing Template Matrix...</p>
      </div>
    );
  }

  return (
    <>
      <ContentGridLayout
        title="Template Governance"
        description="Global Master Artifact Management System"
        headerIcon={FileText}
        search={
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search templates..." 
              className="pl-9 h-9 rounded-md border-border bg-background focus-visible:ring-1 focus-visible:ring-ring text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        }
        toolbarActions={
          <Dialog open={isCreatingNew} onOpenChange={(open) => {
            setIsCreatingNew(open);
            if (!open) {
              setNewTemplateName('');
              setDescription('');
              setSelectedFile(null);
            }
          }}>
            <DialogTrigger render={
              <Button className="h-9 px-4 rounded-md bg-primary hover:bg-indigo-700 text-white font-semibold shadow-sm transition-all text-sm">
                <Plus className="h-4 w-4 mr-2" />
                New Template
              </Button>
            } />
            <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden border-border gap-0">
              <EnterpriseModalHeader
                title="Create New Template"
                subtitle="Define custom artifact"
                icon={FileText}
                intent="normal"
              />
              <div className="grid gap-5 p-6 bg-background">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-foreground uppercase">Template Name</Label>
                  <Input 
                    placeholder="e.g. Weekly Report"
                    className="h-10 rounded-md border-border"
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-foreground uppercase">Template Description</Label>
                  <Textarea 
                    placeholder="Enter a brief description of what this template is used for..."
                    className="min-h-[100px] rounded-md border-border text-sm focus:ring-1 focus:ring-indigo-500"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-foreground uppercase">
                    Master Asset Upload <span className="text-red-500">*</span>
                  </Label>
                  {selectedFile ? (
                    <div className="flex items-center justify-between p-3 rounded-lg border border-indigo-100 bg-indigo-50/50">
                      <div className="flex items-center">
                        <FileCode className="h-4 w-4 text-primary mr-2" />
                        <span className="text-sm font-medium text-indigo-900">{selectedFile.name}</span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-8 w-8 text-indigo-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                        onClick={() => setSelectedFile(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Input 
                        type="file" 
                        className="h-10 rounded-md border-border file:bg-indigo-50 file:text-primary file:border-0 file:h-full file:mr-4 file:px-4 file:font-semibold file:text-xs cursor-pointer"
                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      />
                      <p className="text-xs text-red-500 font-medium mt-1">
                        A document is required to create a template.
                      </p>
                    </>
                  )}
                </div>
              </div>
              <EnterpriseModalFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsCreatingNew(false)}
                  className="h-10 px-4"
                >
                  Cancel
                </Button>
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
                      await api.post(`/templates/update`, formData, {
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
                  className="h-10 px-6"
                >
                  {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Template'}
                </Button>
              </EnterpriseModalFooter>
            </DialogContent>
          </Dialog>
        }
      >
        {filteredDocTypes.map((type) => {
          const template = templates.find(t => t.doc_type === type.key);
          return (
            <Card key={type.key} className="border border-border bg-background rounded-xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full overflow-hidden group">
              <CardContent className="p-5 flex-1 flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-indigo-50 border border-indigo-100/50">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>

                  {template?.filename ? (
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                      Ready
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-muted/30 text-slate-600 border-border gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium">
                      <div className="h-1.5 w-1.5 rounded-full bg-slate-300"></div>
                      Pending
                    </Badge>
                  )}
                </div>

                <div className="space-y-2 flex-1">
                  <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                    {type.key}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
                    {template?.html_content || 'No detailed description provided.'}
                  </p>
                </div>
                
                <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mt-4">
                  <Clock className="h-3.5 w-3.5" />
                  {template?.updated_at ? format(new Date(template.updated_at), 'MMM d, yyyy') : 'No updates'}
                </div>
              </CardContent>

              <div className="px-4 py-3 border-t border-border bg-slate-50/50 flex items-center justify-end gap-1">
                {template?.filename && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-indigo-50 rounded-md"
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
                  <DialogTrigger render={
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-indigo-50 rounded-md">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  } />
                  <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden border-border gap-0">
                    <EnterpriseModalHeader
                      title={`Configure ${type.key}`}
                      subtitle="Artifact Standard Definition"
                      icon={Edit2}
                      intent="normal"
                    />
                    <div className="grid gap-5 p-6 bg-background">
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold text-foreground uppercase">Template Name</Label>
                        <Input 
                          placeholder="e.g. Weekly Report"
                          className="h-10 rounded-md border-border"
                          value={editTemplateName}
                          onChange={(e) => setEditTemplateName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold text-foreground uppercase">Template Description</Label>
                        <Textarea 
                          placeholder="Enter a brief description of what this template is used for..."
                          className="min-h-[100px] rounded-md border-border text-sm focus:ring-1 focus:ring-indigo-500"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold text-foreground uppercase">
                          Master Asset Upload <span className="text-red-500">*</span>
                        </Label>
                        {template?.filename && !removeFile ? (
                          <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg border border-border bg-muted/30">
                            <div className="flex items-center">
                              <FileCode className="h-4 w-4 text-emerald-600 mr-2" />
                              <span className="text-sm font-medium text-muted-foreground">{template.filename}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button 
                                type="button"
                                variant="ghost" 
                                size="icon"
                                className="h-8 w-8 text-primary hover:bg-indigo-100 rounded-full"
                                onClick={() => handleViewDocument(template.doc_type, 'view')}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button 
                                type="button"
                                variant="ghost" 
                                size="icon"
                                className="h-8 w-8 text-slate-600 hover:bg-slate-200 rounded-full"
                                onClick={() => handleViewDocument(template.doc_type, 'download')}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button 
                                type="button"
                                variant="ghost" 
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-full"
                                onClick={() => setRemoveFile(true)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ) : selectedFile ? (
                          <div className="flex items-center justify-between p-3 rounded-lg border border-indigo-100 bg-indigo-50/50">
                            <div className="flex items-center">
                              <FileCode className="h-4 w-4 text-primary mr-2" />
                              <span className="text-sm font-medium text-indigo-900">{selectedFile.name}</span>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="h-8 w-8 text-indigo-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                              onClick={() => setSelectedFile(null)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <Input 
                            type="file" 
                            className="h-10 rounded-md border-border file:bg-indigo-50 file:text-primary file:border-0 file:h-full file:mr-4 file:px-4 file:font-semibold file:text-xs cursor-pointer"
                            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                          />
                        )}
                      </div>
                    </div>
                    <EnterpriseModalFooter>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setActiveType(null)}
                        className="h-10 px-4"
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleUpdate} 
                        disabled={isUploading}
                        className="h-10 px-6"
                      >
                        {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
                      </Button>
                    </EnterpriseModalFooter>
                  </DialogContent>
                </Dialog>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  onClick={() => confirmDelete(type.key)}
                  disabled={isUploading || isDeleting}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          );
        })}
      </ContentGridLayout>

      {filteredDocTypes.length === 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          <EmptyState
            icon={FileText}
            title="No Templates Found"
            description="There are no templates matching your criteria. Try adjusting your search."
          />
        </div>
      )}

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        onConfirm={handleDeleteTemplate}
        itemName={`Template "${templateToDelete}"`}
        isDeleting={isDeleting}
      />
    </>
  );
}
