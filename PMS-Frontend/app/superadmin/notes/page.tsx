'use client';

import { useState, useEffect } from 'react';
import { 
  Search, ArrowLeft, Clock, FileText, CheckSquare, 
  Square, CheckSquare2, File, Pin, Loader2, Briefcase, User
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { useWebSocketEvent } from '@/hooks/useWebSocketEvent';
import { notesService } from '@/services/notesService';
import { NotePage } from '@/types';

export default function SuperadminNotesPage() {
  const { token } = useAuthStore();
  
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  
  const [projectUsers, setProjectUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  
  const [pages, setPages] = useState<any[]>([]);
  const [activePageId, setActivePageId] = useState<number | null>(null);
  const [activePage, setActivePage] = useState<NotePage | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useWebSocketEvent('NOTES_UPDATED', () => setRefreshTrigger(prev => prev + 1));
  useWebSocketEvent('PROJECTS_UPDATED', () => setRefreshTrigger(prev => prev + 1));

  // Load Projects List
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const data = await notesService.getAdminProjects({ search: searchQuery });
        setProjects(data);
      } catch (error) {
        toast.error('Failed to load projects');
      } finally {
        setIsLoading(false);
      }
    };
    if (token && !selectedProject) {
      loadProjects();
    }
  }, [token, refreshTrigger, searchQuery, selectedProject]);

  // Load Users in selected project
  useEffect(() => {
    const loadUsers = async () => {
      if (!selectedProject) return;
      try {
        const data = await notesService.getAdminProjectUsers(selectedProject.project_id);
        setProjectUsers(data);
        if (data.length > 0 && !selectedUserId) {
          setSelectedUserId(data[0].user_id);
        } else if (data.length === 0) {
          setSelectedUserId(null);
        }
      } catch (error) {
        toast.error('Failed to load project users');
      }
    };
    loadUsers();
  }, [selectedProject, refreshTrigger]);

  // Load Pages for selected user in selected project
  useEffect(() => {
    const loadUserPages = async () => {
      if (!selectedProject || !selectedUserId) {
        setPages([]);
        setActivePageId(null);
        return;
      }
      try {
        const data = await notesService.getAdminUserProjectPages(selectedProject.project_id, selectedUserId);
        setPages(data);
        if (data.length > 0 && !activePageId) {
          setActivePageId(data[0].id);
        } else if (data.length === 0) {
          setActivePageId(null);
        }
      } catch (error) {
        toast.error('Failed to load user pages');
      }
    };
    loadUserPages();
  }, [selectedUserId, refreshTrigger]);

  // Load Single Page Content
  useEffect(() => {
    const loadPageContent = async () => {
      if (!activePageId) {
        setActivePage(null);
        return;
      }
      try {
        const data = await notesService.getAdminPage(activePageId);
        setActivePage(data);
      } catch (error) {
        toast.error('Failed to load page content');
      }
    };
    loadPageContent();
  }, [activePageId]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground font-medium animate-pulse uppercase tracking-widest text-[10px]">Loading Projects...</p>
      </div>
    );
  }

  // --- VIEW 1: PROJECTS GRID ---
  if (!selectedProject) {
    return (
      <div className="space-y-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
             <h2 className="text-2xl md:text-3xl font-black tracking-tight text-foreground uppercase">Project To Do Lists</h2>
             <p className="text-muted-foreground font-medium text-sm">Oversight and management of project-based employee tasks</p>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search projects..." 
              className="h-12 pl-11 rounded-xl bg-background border-border outline-none focus:border-indigo-400 transition-all text-xs font-bold shadow-sm" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {projects.map((proj, i) => (
            <motion.div
              key={proj.project_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setSelectedProject(proj)}
              className="bg-background p-6 rounded-xl border border-border hover:border-indigo-300 shadow-sm hover:shadow-xl hover:shadow-indigo-100/50 transition-all cursor-pointer group"
            >
              <div className="flex items-center space-x-4 mb-6">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 text-primary flex items-center justify-center border border-indigo-100 group-hover:scale-105 transition-transform">
                  <Briefcase className="h-5 w-5" />
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-sm font-black text-slate-800 uppercase tracking-tight truncate group-hover:text-primary transition-colors">
                    {proj.project_name}
                  </span>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest truncate mt-0.5">
                    {proj.project_code}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-muted/30 p-3 rounded-xl border border-border flex flex-col items-center justify-center text-center group-hover:bg-indigo-50/50 transition-colors">
                  <span className="text-lg font-black text-slate-800">{proj.page_count}</span>
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Lists</span>
                </div>
                <div className="bg-muted/30 p-3 rounded-xl border border-border flex flex-col items-center justify-center text-center group-hover:bg-emerald-50/50 transition-colors">
                  <span className="text-lg font-black text-slate-800">{proj.completed_tasks}/{proj.total_tasks}</span>
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Tasks Done</span>
                </div>
              </div>

              <div className="flex items-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-t border-slate-50 pt-4">
                <Clock className="h-3 w-3 mr-1.5" />
                {proj.last_activity ? `Updated ${formatDistanceToNow(new Date(proj.last_activity))} ago` : 'No activity yet'}
              </div>
            </motion.div>
          ))}
          
          {projects.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 bg-background rounded-xl border-2 border-dashed border-border">
              <div className="p-4 bg-muted/30 rounded-xl mb-4">
                <Search className="h-8 w-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-1">No Projects Found</h3>
              <p className="text-sm font-medium text-muted-foreground">Try adjusting your search criteria</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- VIEW 2: PROJECT DETAILS (READ-ONLY) ---
  const pinnedPages = pages.filter(p => p.is_pinned);
  const unpinnedPages = pages.filter(p => !p.is_pinned);

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col bg-muted/30 min-w-0">
      
      {/* Header bar */}
      <div className="h-16 shrink-0 bg-background border-b border-border flex items-center justify-between px-6 shadow-sm z-10">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            onClick={() => {
              setSelectedProject(null);
              setSelectedUserId(null);
              setActivePageId(null);
              setActivePage(null);
            }}
            className="text-muted-foreground hover:text-primary font-bold text-[10px] uppercase tracking-widest"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Projects
          </Button>
          <div className="h-6 w-px bg-slate-200" />
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-indigo-50 text-primary flex items-center justify-center font-black">
              <Briefcase className="h-4 w-4" />
            </div>
            <div>
              <span className="text-xs font-black text-slate-800 uppercase tracking-tight block leading-none">
                {selectedProject.project_name}
              </span>
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                Read-only View
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT SIDEBAR: USERS IN PROJECT */}
        <div className="w-full max-w-[240px] bg-slate-50/50 border-r border-border flex flex-col shrink-0">
          <div className="p-4 border-b border-border">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Employees with Lists</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {projectUsers.length === 0 ? (
              <p className="text-xs text-muted-foreground italic text-center py-4">No employees have created lists for this project yet.</p>
            ) : (
              projectUsers.map(user => (
                <button
                  key={user.user_id}
                  onClick={() => setSelectedUserId(user.user_id)}
                  className={cn(
                    "w-full flex items-center px-3 py-2.5 rounded-xl transition-all text-left group",
                    selectedUserId === user.user_id 
                      ? "bg-primary text-white shadow-md shadow-indigo-200" 
                      : "hover:bg-slate-200/50 text-muted-foreground"
                  )}
                >
                  <User className={cn(
                    "h-4 w-4 mr-3 shrink-0",
                    selectedUserId === user.user_id ? "text-indigo-200" : "text-muted-foreground group-hover:text-indigo-500"
                  )} />
                  <div className="flex flex-col min-w-0">
                    <span className="text-[13px] font-bold truncate">
                      {user.user_name}
                    </span>
                    <span className={cn(
                      "text-[9px] font-bold uppercase tracking-widest truncate",
                      selectedUserId === user.user_id ? "text-indigo-200" : "text-muted-foreground"
                    )}>
                      {user.page_count} Lists
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* MIDDLE SIDEBAR: USER'S PAGES */}
        <div className="w-full max-w-[280px] bg-background border-r border-border flex flex-col shrink-0 overflow-y-auto">
          <div className="p-4 space-y-6">
            {!selectedUserId ? (
              <p className="text-xs text-muted-foreground italic text-center py-8">Select an employee</p>
            ) : (
              <>
                {pinnedPages.length > 0 && (
                  <div>
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 px-2 flex items-center">
                      <Pin className="h-3 w-3 mr-1" /> Pinned
                    </h3>
                    <div className="space-y-0.5">
                      {pinnedPages.map(page => (
                        <PageListItem 
                          key={page.id} 
                          page={page} 
                          isActive={activePageId === page.id}
                          onClick={() => setActivePageId(page.id)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 px-2 flex items-center">
                    All Lists
                  </h3>
                  {unpinnedPages.length === 0 && pinnedPages.length === 0 ? (
                    <p className="px-2 text-[10px] text-muted-foreground font-medium italic">Empty workspace</p>
                  ) : (
                    <div className="space-y-0.5">
                      {unpinnedPages.map(page => (
                        <PageListItem 
                          key={page.id} 
                          page={page} 
                          isActive={activePageId === page.id}
                          onClick={() => setActivePageId(page.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* MAIN VIEWER */}
        <div className="flex-1 bg-background overflow-y-auto">
          {activePage ? (
            <div className="px-8 md:px-16 py-12 pb-32 max-w-3xl mx-auto">
              
              <div className="flex items-center space-x-3 mb-8 pb-8 border-b border-border">
                <div className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700">
                  To Do List
                </div>
                <div className="flex items-center text-[10px] font-bold text-muted-foreground">
                  <Clock className="h-3 w-3 mr-1.5" />
                  Last edited {formatDistanceToNow(new Date(activePage.updated_at + (activePage.updated_at.endsWith('Z') ? '' : 'Z')), { addSuffix: true })}
                </div>
              </div>

              <h1 className="text-4xl font-black tracking-tight text-foreground mb-8 break-words">
                {activePage.title}
              </h1>

              {activePage.content ? (
                <div className="text-base leading-relaxed text-muted-foreground whitespace-pre-wrap font-medium mb-16">
                  {activePage.content}
                </div>
              ) : (
                <div className="text-sm font-medium text-muted-foreground italic mb-16">
                  No description written.
                </div>
              )}

              {activePage.checklist_items.length > 0 && (
                <div className="pt-8 border-t border-border">
                  <h3 className="text-sm font-black uppercase tracking-tight text-slate-800 flex items-center mb-6">
                    <CheckSquare className="h-4 w-4 mr-2 text-primary" /> Task List
                  </h3>
                  
                  <div className="space-y-3">
                    {activePage.checklist_items.map((item) => (
                      <div key={item.id} className="flex items-start opacity-90 cursor-default">
                        <div className="mt-0.5 mr-3 shrink-0 text-muted-foreground">
                          {item.is_completed ? (
                            <CheckSquare2 className="h-5 w-5 text-indigo-500" />
                          ) : (
                            <Square className="h-5 w-5" />
                          )}
                        </div>
                        <span className={cn(
                          "flex-1 text-sm font-medium pt-0.5",
                          item.is_completed ? "text-muted-foreground line-through decoration-slate-300" : "text-muted-foreground"
                        )}>
                          {item.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 bg-muted/30 rounded-xl border border-border flex items-center justify-center mb-4">
                <File className="h-8 w-8 text-slate-300" />
              </div>
              <p className="text-sm font-black text-muted-foreground uppercase tracking-widest">Select a list to view</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PageListItem({ page, isActive, onClick }: { page: any, isActive: boolean, onClick: () => void }) {
  return (
    <div 
      className={cn(
        "flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all border border-transparent",
        isActive ? "bg-muted/30 border-border shadow-sm" : "hover:bg-muted"
      )}
      onClick={onClick}
    >
      <div className="flex flex-col min-w-0 pr-2">
        <span className={cn(
          "text-[13px] truncate transition-colors",
          isActive ? "font-bold text-indigo-700" : "font-medium text-foreground"
        )}>
          {page.title || 'Untitled To Do List'}
        </span>
        <div className="flex items-center mt-1 space-x-2 text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
          <span>{format(new Date(page.updated_at), 'MMM d')}</span>
          {page.checklist_total > 0 && (
            <span className="flex items-center before:content-['·'] before:mr-2">
              <CheckSquare className="h-2.5 w-2.5 mr-1" />
              {page.checklist_completed}/{page.checklist_total}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
