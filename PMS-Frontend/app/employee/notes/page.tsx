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
import { WorkspaceLayout } from '@/components/layout/WorkspaceLayout';
import { WorkspacePane } from '@/components/layout/WorkspacePane';
import { WorkspaceHeader } from '@/components/layout/WorkspaceHeader';
import { WorkspaceContent } from '@/components/layout/WorkspaceContent';

export default function EmployeeNotesPage() {
  const { token } = useAuthStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  
  const [pages, setPages] = useState<any[]>([]);
  const [activePageId, setActivePageId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
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

  const handleTogglePin = async (page: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await notesService.updatePage(page.id, { is_pinned: !page.is_pinned });
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      toast.error('Failed to pin/unpin');
    }
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

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground font-medium animate-pulse uppercase tracking-widest text-[10px]">Loading Workspace...</p>
      </div>
    );
  }

  const pinnedPages = pages.filter(p => p.is_pinned);
  const unpinnedPages = pages.filter(p => !p.is_pinned);

  const renderPrimarySidebar = () => (
    <WorkspacePane
      width="md"
      background="muted"
      header={
        <div className="space-y-1">
          {/* Colored top accent bar */}
          <div className="-mx-4 -mt-4 mb-3 h-1 bg-gradient-to-r from-indigo-500 to-indigo-400 rounded-t-none" />
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-100 dark:bg-indigo-900/30">
              <Briefcase className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">My Projects</h2>
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium pl-8">Select a project to view its lists</p>
        </div>
      }
    >
      <div className="space-y-1">
        {projects.length === 0 ? (
          <p className="text-xs text-muted-foreground italic text-center py-4">No assigned projects</p>
        ) : (
          projects.map(project => (
            <button
              key={project.id}
              onClick={() => {
                setSelectedProjectId(project.id);
                setActivePageId(null);
              }}
              className={cn(
                "w-full flex items-center px-3 py-2.5 rounded-xl transition-all text-left group border",
                selectedProjectId === project.id
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-none border-indigo-500"
                  : "hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-slate-600 dark:text-slate-300 border-transparent hover:border-indigo-100 dark:hover:border-indigo-800/30"
              )}
            >
              <Briefcase className={cn(
                "h-4 w-4 mr-3 shrink-0",
                selectedProjectId === project.id ? "text-indigo-200" : "text-slate-400 dark:text-slate-500 group-hover:text-indigo-500 dark:group-hover:text-indigo-400"
              )} />
              <span className="text-[13px] font-bold truncate">
                {project.name}
              </span>
            </button>
          ))
        )}
      </div>
    </WorkspacePane>
  );

  const renderSecondarySidebar = () => (
    <WorkspacePane
      width="lg"
      background="subtle"
      header={
        <div className="space-y-3">
          {/* Colored top accent bar */}
          <div className="-mx-4 -mt-4 mb-3 h-1 bg-gradient-to-r from-orange-400 to-amber-400 rounded-t-none" />
          <div className="flex items-center gap-2 mb-1">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-orange-100 dark:bg-orange-900/30">
              <CheckSquare className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
            </div>
            <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">To Do Lists</h2>
          </div>
          <Button 
            onClick={() => handleCreatePage()}
            disabled={!selectedProjectId}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white shadow-sm rounded-xl h-10 font-bold tracking-wide text-xs"
          >
            <Plus className="h-4 w-4 mr-2" /> New To Do List
          </Button>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search lists..." 
              className="pl-9 h-9 text-xs rounded-lg bg-white dark:bg-background border-slate-200 dark:border-border focus:border-orange-400 focus:ring-0"
            />
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        {!selectedProjectId ? (
          <p className="text-xs text-muted-foreground italic text-center py-8">Select a project first</p>
        ) : (
          <>
            {pinnedPages.length > 0 && (
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 px-2 flex items-center gap-1">
                  <Pin className="h-3 w-3" /> Pinned
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

            <div>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 px-2 flex items-center gap-1">
                <FileText className="h-3 w-3" /> Lists
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
    </WorkspacePane>
  );

  const renderMobileSidebar = () => {
    if (!selectedProjectId) {
      return (
        <WorkspacePane width="sm" className="h-full w-full border-r-0">
          <div className="p-4 border-b border-border sticky top-0 bg-slate-50/50 z-10 flex items-center justify-between">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Projects</h2>
          </div>
          <div className="p-3 space-y-1 overflow-y-auto">
            {projects.map(proj => (
              <button
                key={proj.id}
                onClick={() => { setSelectedProjectId(proj.id); setActivePageId(null); setMobileMenuOpen(false); }}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all text-left hover:bg-slate-200/50 text-muted-foreground"
              >
                <div className="flex items-center flex-1 min-w-0">
                  <Briefcase className="h-4 w-4 mr-3 shrink-0 text-muted-foreground" />
                  <span className="text-[13px] font-bold truncate">{proj.name}</span>
                </div>
              </button>
            ))}
          </div>
        </WorkspacePane>
      );
    }
    
    return (
      <WorkspacePane width="md" background="subtle" className="h-full w-full border-r-0">
        <div className="p-4 border-b border-border sticky top-0 bg-slate-50/30 z-10 space-y-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => { setSelectedProjectId(null); setActivePageId(null); }}
            className="text-[10px] uppercase font-bold text-muted-foreground hover:text-foreground -ml-2 h-7"
          >
            ← Back to Projects
          </Button>
          <div className="flex items-center justify-between">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Lists</h2>
            <Button onClick={handleCreatePage} size="icon" variant="ghost" className="h-6 w-6 text-primary hover:text-indigo-700 hover:bg-indigo-50 rounded-lg">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="p-3 space-y-6 overflow-y-auto">
          {pinnedPages.length > 0 && (
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 px-2 flex items-center">
                <Pin className="h-3 w-3 mr-1" /> Pinned
              </h3>
              <div className="space-y-0.5">
                {pinnedPages.map(page => (
                  <PageSidebarItem 
                    key={page.id} page={page} isActive={activePageId === page.id}
                    onClick={() => { setActivePageId(page.id); setMobileMenuOpen(false); }}
                    onPin={(e) => handleTogglePin(page, e)}
                    onDelete={(e) => handleDeletePage(page.id, e)}
                  />
                ))}
              </div>
            </div>
          )}
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 px-2 flex items-center">All Lists</h3>
            {unpinnedPages.length === 0 && pinnedPages.length === 0 ? (
              <p className="px-2 text-[10px] text-muted-foreground font-medium italic">Empty workspace</p>
            ) : (
              <div className="space-y-0.5">
                {unpinnedPages.map(page => (
                  <PageSidebarItem 
                    key={page.id} page={page} isActive={activePageId === page.id}
                    onClick={() => { setActivePageId(page.id); setMobileMenuOpen(false); }}
                    onPin={(e) => handleTogglePin(page, e)}
                    onDelete={(e) => handleDeletePage(page.id, e)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </WorkspacePane>
    );
  };

  return (
    <WorkspaceLayout
      primarySidebar={renderPrimarySidebar()}
      secondarySidebar={renderSecondarySidebar()}
      mobileSidebar={renderMobileSidebar()}
      mobileMenuOpen={mobileMenuOpen}
      onMobileMenuOpenChange={setMobileMenuOpen}
    >
      {activePageId ? (
        <MainEditor 
          pageId={activePageId} 
          onPageUpdated={() => setRefreshTrigger(prev => prev + 1)} 
        />
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-muted/10 relative">
          {/* Subtle top accent for 3rd section */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-teal-400" />
          <div className="flex items-center gap-2 absolute top-4 left-5">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-100">
              <CheckSquare className="h-3.5 w-3.5 text-emerald-600" />
            </div>
            <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">Task Workspace</span>
          </div>
          <div className="w-16 h-16 bg-card rounded-xl shadow-sm border border-border flex items-center justify-center mb-4">
            <CheckSquare className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <h3 className="text-xl font-bold text-foreground tracking-tight mb-2">Select a To Do List</h3>
          <p className="text-muted-foreground text-sm font-medium max-w-sm">
            Choose a list from the sidebar or create a new one for the selected project.
          </p>
          <Button 
            className="md:hidden mt-4" 
            variant="outline" 
            onClick={() => setMobileMenuOpen(true)}
          >
            Open Navigation
          </Button>
          {selectedProjectId && (
            <Button 
              onClick={() => handleCreatePage()}
              className="mt-6 bg-orange-500 hover:bg-orange-600 text-white rounded-xl shadow-sm"
            >
              <Plus className="h-4 w-4 mr-2" /> Create New List
            </Button>
          )}
        </div>
      )}
    </WorkspaceLayout>
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
        "group flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition-all border",
        isActive
          ? "bg-white dark:bg-muted border-orange-200 dark:border-orange-500/30 shadow-sm dark:shadow-none"
          : "border-transparent hover:bg-white/70 dark:hover:bg-muted/50 hover:border-slate-200 dark:hover:border-border"
      )}
      onClick={onClick}
    >
      <div className="flex flex-col min-w-0 pr-2">
        <span className={cn(
          "text-[13px] truncate transition-colors",
          isActive ? "font-bold text-orange-600 dark:text-orange-500" : "font-medium text-slate-600 dark:text-slate-300 group-hover:text-slate-800 dark:group-hover:text-slate-100"
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
        <DropdownMenuTrigger className="h-6 w-6 flex items-center justify-center opacity-0 group-hover:opacity-100 rounded-md shrink-0 hover:bg-slate-200/50 dark:hover:bg-slate-700/50">
          <MoreVertical className="h-3 w-3 text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40 rounded-xl border-border shadow-xl">
          <DropdownMenuItem onClick={onPin} className="text-xs font-medium cursor-pointer rounded-lg focus:bg-muted/30">
            <Pin className="h-3.5 w-3.5 mr-2 text-muted-foreground" /> {page.is_pinned ? 'Unpin' : 'Pin to Top'}
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-muted" />
          <DropdownMenuItem onClick={onDelete} className="text-xs font-bold text-red-600 focus:text-red-700 cursor-pointer rounded-lg focus:bg-red-50">
            <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function LocalInput({ initialValue, onChange, placeholder, className }: { initialValue: string, onChange: (val: string) => void, placeholder: string, className: string }) {
  const [val, setVal] = useState(initialValue || '');
  
  useEffect(() => {
    setVal(initialValue || '');
  }, [initialValue]);

  return (
    <input 
      type="text"
      value={val}
      onChange={(e) => {
        setVal(e.target.value);
        onChange(e.target.value);
      }}
      placeholder={placeholder}
      className={className}
    />
  );
}

function LocalTextarea({ initialValue, onChange, placeholder, className }: { initialValue: string, onChange: (val: string) => void, placeholder: string, className: string }) {
  const [val, setVal] = useState(initialValue || '');
  
  useEffect(() => {
    setVal(initialValue || '');
  }, [initialValue]);

  return (
    <textarea 
      value={val}
      onChange={(e) => {
        setVal(e.target.value);
        onChange(e.target.value);
      }}
      placeholder={placeholder}
      className={className}
    />
  );
}

function MainEditor({ pageId, onPageUpdated }: { pageId: number, onPageUpdated: () => void }) {
  const [activePage, setActivePage] = useState<NotePage | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const loadPageContent = async (id: number) => {
    try {
      const page = await notesService.getPage(id);
      setActivePage(page);
    } catch (error) {
      toast.error('Failed to load page');
    }
  };

  useEffect(() => {
    setActivePage(null);
    loadPageContent(pageId);
  }, [pageId]);

  const handleUpdatePage = useCallback(async (data: Partial<NotePage>) => {
    if (!activePage) return;
    try {
      setIsSaving(true);
      await notesService.updatePage(activePage.id, data);
      onPageUpdated();
      setTimeout(() => setIsSaving(false), 500);
    } catch (error) {
      setIsSaving(false);
      toast.error('Failed to save changes');
    }
  }, [activePage, onPageUpdated]);

  const handleContentChange = (field: 'title' | 'content', value: string) => {
    // We intentionally DO NOT update activePage here to prevent MainEditor from re-rendering on every single keystroke.
    // The LocalInput and LocalTextarea manage their own visible typing state instantly.
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      handleUpdatePage({ [field]: value });
    }, 1000);
  };

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
        onPageUpdated();
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
      onPageUpdated();
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
      onPageUpdated();
    } catch (error) {
      toast.error('Failed to delete task');
    }
  };

  if (!activePage) return <div className="flex-1 flex items-center justify-center"><Loader2 className="animate-spin text-indigo-500 h-8 w-8" /></div>;

  return (
    <>
      <WorkspaceHeader
        left={
          <>
            <div className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-200 dark:ring-emerald-500/20">
              ✓ Task Workspace
            </div>
            <div className="flex items-center text-[10px] font-bold text-muted-foreground">
              <Clock className="h-3 w-3 mr-1.5" />
              Last edited {formatDistanceToNow(new Date(activePage.updated_at + (activePage.updated_at.endsWith('Z') ? '' : 'Z')), { addSuffix: true })}
            </div>
          </>
        }
        right={
          <>
            <AnimatePresence>
              {isSaving && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest bg-indigo-50 dark:bg-indigo-500/10 px-2.5 py-1 rounded-full"
                >
                  <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> Saving
                </motion.div>
              )}
            </AnimatePresence>
            {!isSaving && (
              <div className="flex items-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2.5 py-1">
                <Check className="h-3 w-3 mr-1.5 text-emerald-500" /> Saved
              </div>
            )}
          </>
        }
      />

      <WorkspaceContent className="px-8 md:px-16 py-12 pb-32 bg-background">
        <div className="max-w-3xl mx-auto space-y-6">
          <LocalInput 
            initialValue={activePage.title}
            onChange={(val: string) => handleContentChange('title', val)}
            placeholder="Untitled To Do List"
            className="w-full text-4xl font-black tracking-tight text-foreground border-none outline-none bg-transparent placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:ring-0 p-0"
          />

          <LocalTextarea 
            initialValue={activePage.content || ''}
            onChange={(val: string) => handleContentChange('content', val)}
            placeholder="Add a brief description..."
            className="w-full min-h-[60px] text-base leading-relaxed text-foreground dark:text-slate-300 border-none outline-none bg-transparent placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:ring-0 p-0 resize-none font-medium"
          />

          <div className="pt-6 border-t border-slate-200 dark:border-slate-800 mt-6">
            <h3 className="text-sm font-semibold text-foreground flex items-center mb-6">
              <CheckSquare className="h-4 w-4 mr-2 text-primary" /> Task List
            </h3>
            
            <div className="space-y-2 mb-6">
              {activePage.checklist_items.map((item) => (
                <div key={item.id} className="flex items-start group">
                  <button 
                    onClick={() => handleToggleChecklist(item.id)}
                    className="mt-0.5 mr-3 shrink-0 text-slate-400 dark:text-slate-600 hover:text-primary transition-colors"
                  >
                    {item.is_completed ? (
                      <CheckSquare2 className="h-5 w-5 text-primary" />
                    ) : (
                      <Square className="h-5 w-5" />
                    )}
                  </button>
                  <span className={cn(
                    "flex-1 text-sm font-medium pt-0.5 outline-none transition-all",
                    item.is_completed ? "text-slate-400 dark:text-slate-500 line-through decoration-slate-400 dark:decoration-slate-600" : "text-foreground dark:text-slate-200"
                  )}>
                    {item.text}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteChecklist(item.id)}
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 rounded-full"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
              {activePage.checklist_items.length === 0 && (
                <p className="text-xs text-muted-foreground italic">No tasks added yet.</p>
              )}
            </div>

            <div className="flex items-center">
              <Plus className="h-4 w-4 mr-3 text-slate-400 dark:text-slate-600" />
              <input 
                type="text"
                placeholder="Add a new task... (Press Enter)"
                onKeyDown={handleAddChecklist}
                className="flex-1 text-sm text-foreground dark:text-slate-200 bg-transparent border-none outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:ring-0 p-0 font-medium"
              />
            </div>
          </div>
        </div>
      </WorkspaceContent>
    </>
  );
}

