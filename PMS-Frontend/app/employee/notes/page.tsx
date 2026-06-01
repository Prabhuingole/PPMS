'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Plus, Search, FileText, Pin, MoreVertical, Archive, 
  Trash2, Edit3, CheckSquare, Clock, PlusCircle, Square, 
  Loader2, Save, X, Check, File, CheckSquare2, Briefcase
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { useWebSocketEvent } from '@/hooks/useWebSocketEvent';
import { notesService } from '@/services/notesService';
import { projectService } from '@/services/projectService';
import { NotePage, NoteChecklistItem, Project } from '@/types';

export default function EmployeeNotesPage() {
  const { token } = useAuthStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  
  const [pages, setPages] = useState<any[]>([]);
  const [activePageId, setActivePageId] = useState<number | null>(null);
  const [activePage, setActivePage] = useState<NotePage | null>(null);

  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useWebSocketEvent('NOTES_UPDATED', () => setRefreshTrigger(prev => prev + 1));
  useWebSocketEvent('PROJECTS_UPDATED', () => setRefreshTrigger(prev => prev + 1));

  // Load Projects
  const loadSidebarData = async () => {
    try {
      const projectsData = await projectService.getProjects({ limit: 100 });
      setProjects(projectsData.items);
      
      // Auto-select first project if none selected
      if (!selectedProjectId && projectsData.items.length > 0) {
        setSelectedProjectId(projectsData.items[0].id);
      }
    } catch (error) {
      console.error('Failed to load to do list data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadSidebarData();
    }
  }, [token, refreshTrigger]);

  // Load Pages when Project is selected or search query changes
  useEffect(() => {
    const loadPages = async () => {
      if (!selectedProjectId) {
        setPages([]);
        return;
      }
      try {
        const pagesData = await notesService.getPages({ 
          project_id: selectedProjectId,
          search: searchQuery 
        });
        setPages(pagesData);
        // Deselect page if it's no longer in the list
        if (activePageId && !pagesData.find(p => p.id === activePageId)) {
          setActivePageId(null);
        }
      } catch (error) {
        toast.error('Failed to load pages');
      }
    };
    
    if (token && selectedProjectId) {
      loadPages();
    }
  }, [token, selectedProjectId, refreshTrigger, searchQuery]);

  const loadPageContent = async (id: number) => {
    try {
      const page = await notesService.getPage(id);
      setActivePage(page);
    } catch (error) {
      toast.error('Failed to load page');
    }
  };

  useEffect(() => {
    if (activePageId) {
      loadPageContent(activePageId);
    } else {
      setActivePage(null);
    }
  }, [activePageId]);

  const handleCreatePage = async () => {
    if (!selectedProjectId) {
      toast.error("Please select a project first");
      return;
    }
    try {
      const newPage = await notesService.createPage({ 
        title: 'Untitled To Do List', 
        project_id: selectedProjectId 
      });
      setPages([newPage, ...pages]);
      setActivePageId(newPage.id);
      toast.success('Page created');
    } catch (error) {
      toast.error('Failed to create page');
    }
  };

  const handleUpdatePage = useCallback(async (id: number, data: Partial<NotePage>) => {
    try {
      setIsSaving(true);
      await notesService.updatePage(id, data);
      setRefreshTrigger(prev => prev + 1);
      setTimeout(() => setIsSaving(false), 500);
    } catch (error) {
      setIsSaving(false);
      toast.error('Failed to save changes');
    }
  }, []);

  const handleContentChange = (field: 'title' | 'content', value: string) => {
    if (!activePage) return;
    
    setActivePage(prev => prev ? { ...prev, [field]: value } : null);

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    
    saveTimeoutRef.current = setTimeout(() => {
      handleUpdatePage(activePage.id, { [field]: value });
    }, 1000);
  };

  const handleTogglePin = async (page: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    await handleUpdatePage(page.id, { is_pinned: !page.is_pinned });
  };

  const handleDeletePage = async (id: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm('Are you sure you want to delete this list?')) return;
    try {
      await notesService.deletePage(id);
      if (activePageId === id) setActivePageId(null);
      setRefreshTrigger(prev => prev + 1);
      toast.success('List deleted');
    } catch (error) {
      toast.error('Failed to delete list');
    }
  };

  // Checklist functions
  const handleAddChecklist = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && e.currentTarget.value.trim() && activePage) {
      const text = e.currentTarget.value.trim();
      e.currentTarget.value = '';
      try {
        const item = await notesService.addChecklistItem(activePage.id, { text });
        setActivePage(prev => prev ? {
          ...prev, 
          checklist_items: [...prev.checklist_items, item]
        } : null);
        setRefreshTrigger(prev => prev + 1);
      } catch (error) {
        toast.error('Failed to add task');
      }
    }
  };

  const handleToggleChecklist = async (itemId: number) => {
    if (!activePage) return;
    try {
      const updatedItem = await notesService.toggleChecklistItem(itemId);
      setActivePage(prev => {
        if (!prev) return null;
        return {
          ...prev,
          checklist_items: prev.checklist_items.map(item => item.id === itemId ? updatedItem : item)
        };
      });
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      toast.error('Failed to update task');
    }
  };

  const handleDeleteChecklist = async (itemId: number) => {
    if (!activePage) return;
    try {
      await notesService.deleteChecklistItem(itemId);
      setActivePage(prev => {
        if (!prev) return null;
        return {
          ...prev,
          checklist_items: prev.checklist_items.filter(item => item.id !== itemId)
        };
      });
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      toast.error('Failed to delete task');
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
        <p className="text-slate-500 font-medium animate-pulse uppercase tracking-widest text-[10px]">Loading Workspace...</p>
      </div>
    );
  }

  const pinnedPages = pages.filter(p => p.is_pinned);
  const unpinnedPages = pages.filter(p => !p.is_pinned);

  return (
    <div className="h-[calc(100vh-8rem)] flex bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden min-w-0">
      
      {/* LEFT SIDEBAR: PROJECTS */}
      <div className="w-full max-w-[240px] bg-slate-50/50 border-r border-slate-200 flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-200">
          <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400">My Projects</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {projects.length === 0 ? (
            <p className="text-xs text-slate-400 italic text-center py-4">No assigned projects</p>
          ) : (
            projects.map(project => (
              <button
                key={project.id}
                onClick={() => {
                  setSelectedProjectId(project.id);
                  setActivePageId(null);
                }}
                className={cn(
                  "w-full flex items-center px-3 py-2.5 rounded-xl transition-all text-left group",
                  selectedProjectId === project.id 
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" 
                    : "hover:bg-slate-200/50 text-slate-700"
                )}
              >
                <Briefcase className={cn(
                  "h-4 w-4 mr-3 shrink-0",
                  selectedProjectId === project.id ? "text-indigo-200" : "text-slate-400 group-hover:text-indigo-500"
                )} />
                <span className="text-[13px] font-bold truncate">
                  {project.name}
                </span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* MIDDLE SIDEBAR: TO DO LISTS IN PROJECT */}
      <div className="w-full max-w-[280px] bg-slate-50/30 border-r border-slate-200 flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-200 space-y-3">
          <Button 
            onClick={() => handleCreatePage()}
            disabled={!selectedProjectId}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-100 rounded-xl h-10 font-bold tracking-wide text-xs"
          >
            <Plus className="h-4 w-4 mr-2" /> New To Do List
          </Button>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search lists..." 
              className="pl-9 h-9 text-xs rounded-lg bg-white border-slate-200 focus:border-indigo-400 focus:ring-0"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-6">
          {!selectedProjectId ? (
            <p className="text-xs text-slate-400 italic text-center py-8">Select a project first</p>
          ) : (
            <>
              {/* Pinned Section */}
              {pinnedPages.length > 0 && (
                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 px-2 flex items-center">
                    <Pin className="h-3 w-3 mr-1" /> Pinned
                  </h3>
                  <div className="space-y-0.5">
                    {pinnedPages.map(page => (
                      <PageSidebarItem 
                        key={page.id} 
                        page={page} 
                        isActive={activePageId === page.id}
                        onClick={() => setActivePageId(page.id)}
                        onPin={(e) => handleTogglePin(page, e)}
                        onDelete={(e) => handleDeletePage(page.id, e)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* All Lists */}
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 px-2 flex items-center">
                  Lists
                </h3>
                {unpinnedPages.length === 0 ? (
                  <p className="px-2 text-[10px] text-slate-400 font-medium italic mb-2">No lists created yet.</p>
                ) : (
                  <div className="space-y-0.5">
                    {unpinnedPages.map(page => (
                      <PageSidebarItem 
                        key={page.id} 
                        page={page} 
                        isActive={activePageId === page.id}
                        onClick={() => setActivePageId(page.id)}
                        onPin={(e) => handleTogglePin(page, e)}
                        onDelete={(e) => handleDeletePage(page.id, e)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* MAIN EDITOR */}
      <div className="flex-1 flex flex-col min-w-0 bg-white relative">
        {activePage ? (
          <>
            {/* Editor Header */}
            <div className="h-14 border-b border-slate-100 flex items-center justify-between px-6 shrink-0 bg-white/50 backdrop-blur-xl z-10 sticky top-0">
              <div className="flex items-center space-x-3">
                <div className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700">
                  To Do List
                </div>
                <div className="flex items-center text-[10px] font-bold text-slate-400">
                  <Clock className="h-3 w-3 mr-1.5" />
                  Last edited {formatDistanceToNow(new Date(activePage.updated_at + (activePage.updated_at.endsWith('Z') ? '' : 'Z')), { addSuffix: true })}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <AnimatePresence>
                  {isSaving && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="flex items-center text-[10px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 px-2.5 py-1 rounded-full"
                    >
                      <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> Saving
                    </motion.div>
                  )}
                </AnimatePresence>
                {!isSaving && (
                  <div className="flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2.5 py-1">
                    <Check className="h-3 w-3 mr-1.5 text-emerald-500" /> Saved
                  </div>
                )}
              </div>
            </div>

            {/* Editor Content */}
            <div className="flex-1 overflow-y-auto px-8 md:px-16 py-12 pb-32">
              <div className="max-w-3xl mx-auto space-y-6">
                
                {/* Title Input */}
                <input 
                  type="text"
                  value={activePage.title}
                  onChange={(e) => handleContentChange('title', e.target.value)}
                  placeholder="Untitled To Do List"
                  className="w-full text-4xl font-black tracking-tight text-slate-900 border-none outline-none bg-transparent placeholder:text-slate-300 focus:ring-0 p-0"
                />

                {/* Content Textarea */}
                <textarea 
                  value={activePage.content || ''}
                  onChange={(e) => handleContentChange('content', e.target.value)}
                  placeholder="Add a brief description..."
                  className="w-full min-h-[60px] text-base leading-relaxed text-slate-700 border-none outline-none bg-transparent placeholder:text-slate-300 focus:ring-0 p-0 resize-none font-medium"
                />

                {/* Checklist Section */}
                <div className="pt-6 border-t border-slate-100 mt-6">
                  <h3 className="text-sm font-black uppercase tracking-tight text-slate-800 flex items-center mb-6">
                    <CheckSquare className="h-4 w-4 mr-2 text-indigo-600" /> Task List
                  </h3>
                  
                  <div className="space-y-2 mb-6">
                    {activePage.checklist_items.map((item) => (
                      <div key={item.id} className="flex items-start group">
                        <button 
                          onClick={() => handleToggleChecklist(item.id)}
                          className="mt-0.5 mr-3 shrink-0 text-slate-300 hover:text-indigo-600 transition-colors"
                        >
                          {item.is_completed ? (
                            <CheckSquare2 className="h-5 w-5 text-indigo-600" />
                          ) : (
                            <Square className="h-5 w-5" />
                          )}
                        </button>
                        <span className={cn(
                          "flex-1 text-sm font-medium pt-0.5 outline-none transition-all",
                          item.is_completed ? "text-slate-400 line-through decoration-slate-300" : "text-slate-700"
                        )}>
                          {item.text}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteChecklist(item.id)}
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 rounded-full"
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                    {activePage.checklist_items.length === 0 && (
                      <p className="text-xs text-slate-400 italic">No tasks added yet.</p>
                    )}
                  </div>

                  <div className="flex items-center">
                    <Plus className="h-4 w-4 mr-3 text-slate-300" />
                    <input 
                      type="text"
                      placeholder="Add a new task... (Press Enter)"
                      onKeyDown={handleAddChecklist}
                      className="flex-1 text-sm bg-transparent border-none outline-none placeholder:text-slate-300 focus:ring-0 p-0 font-medium"
                    />
                  </div>
                </div>

              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/30">
            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mb-4">
              <CheckSquare className="h-8 w-8 text-slate-300" />
            </div>
            <h3 className="text-xl font-black text-slate-800 tracking-tight mb-2">Select a To Do List</h3>
            <p className="text-slate-500 text-sm font-medium max-w-sm">
              Choose a list from the sidebar or create a new one for the selected project.
            </p>
            {selectedProjectId && (
              <Button 
                onClick={() => handleCreatePage()}
                className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-100"
              >
                <Plus className="h-4 w-4 mr-2" /> Create New List
              </Button>
            )}
          </div>
        )}
      </div>

    </div>
  );
}

function PageSidebarItem({ page, isActive, onClick, onPin, onDelete }: { 
  page: any, 
  isActive: boolean, 
  onClick: () => void, 
  onPin: (e: React.MouseEvent) => void,
  onDelete: (e: React.MouseEvent) => void
}) {
  return (
    <div 
      className={cn(
        "group flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition-all border border-transparent",
        isActive ? "bg-white border-slate-200 shadow-sm" : "hover:bg-slate-200/50"
      )}
      onClick={onClick}
    >
      <div className="flex flex-col min-w-0 pr-2">
        <span className={cn(
          "text-[13px] truncate transition-colors",
          isActive ? "font-bold text-indigo-700" : "font-medium text-slate-700 group-hover:text-slate-900"
        )}>
          {page.title || 'Untitled To Do List'}
        </span>
        {page.checklist_total > 0 && (
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 flex items-center">
            <CheckSquare className="h-2.5 w-2.5 mr-1" />
            {page.checklist_completed}/{page.checklist_total} Done
          </span>
        )}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger className="h-6 w-6 flex items-center justify-center opacity-0 group-hover:opacity-100 rounded-md shrink-0 hover:bg-slate-200/50">
          <MoreVertical className="h-3 w-3 text-slate-400" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40 rounded-xl border-slate-100 shadow-xl">
          <DropdownMenuItem onClick={onPin} className="text-xs font-medium cursor-pointer rounded-lg focus:bg-slate-50">
            <Pin className="h-3.5 w-3.5 mr-2 text-slate-400" /> {page.is_pinned ? 'Unpin' : 'Pin to Top'}
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-slate-100" />
          <DropdownMenuItem onClick={onDelete} className="text-xs font-bold text-red-600 focus:text-red-700 cursor-pointer rounded-lg focus:bg-red-50">
            <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
