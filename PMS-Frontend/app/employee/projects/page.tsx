'use client';

import { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  ExternalLink,
  Briefcase,
  Calendar,
  LayoutGrid,
  Table as TableIcon,
  Loader2,
  FolderOpen,
  BookOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import api from '@/services/api';
import { handleApiError } from '@/utils/handleApiError';
import { ErrorState } from '@/components/ui/error-state';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { Project } from '@/types';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useWebSocketEvent } from '@/hooks/useWebSocketEvent';

export default function EmployeeProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { token, user } = useAuthStore();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useWebSocketEvent('PROJECTS_UPDATED', () => setRefreshTrigger(prev => prev + 1));

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await api.get(`/projects/`);
        setProjects(response.data.items);
      } catch (error) {
        console.error('Error fetching projects:', error);
        toast.error('Failed to load projects');
      } finally {
        setIsLoading(false);
      }
    };

    if (token) {
      fetchProjects();
    }
  }, [token, refreshTrigger]);

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.client_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground font-medium animate-pulse uppercase tracking-widest text-[10px]">Loading your Projects</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">My Projects</h2>
          <p className="text-muted-foreground font-medium text-sm mt-1">Overview of the projects you are assigned to.</p>
        </div>
        <div className="flex items-center flex-wrap gap-3">
          <Link href="/employee/templates">
            <Button variant="outline" className="h-10 rounded-xl border-border px-5 font-semibold text-sm text-primary bg-background hover:bg-indigo-50 transition-all shadow-sm">
              <BookOpen className="mr-2 h-4 w-4" /> View Master Templates
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects by name, code or client..."
            className="h-11 pl-11 rounded-xl bg-background border-border outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm font-medium shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {filteredProjects.length > 0 ? (
          <motion.div
            key="projects-grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn(
              "grid gap-6",
              "grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
            )}
          >
            {filteredProjects.map((project, i) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="flex flex-col h-full border-border shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden bg-background rounded-xl group">
                  <CardHeader className="pb-3 border-b border-border">
                    <div className="flex justify-between items-start mb-2 gap-4">
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-semibold text-primary mb-1">{project.code}</span>
                        <h3 className="text-lg font-bold text-foreground leading-tight line-clamp-2 group-hover:text-indigo-700 transition-colors pr-2">{project.name}</h3>
                        {project.client_name && (
                          <p className="text-sm text-muted-foreground mt-0.5 truncate">{project.client_name}</p>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="flex-1 pt-5 space-y-6">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className={cn(
                        "px-2.5 py-0.5 rounded-full font-semibold text-xs border-0",
                        project.status === 'active' ? "bg-emerald-100 text-emerald-700" :
                          project.status === 'completed' ? "bg-blue-100 text-blue-700" :
                            project.status === 'planning' ? "bg-amber-100 text-amber-700" :
                              "bg-muted text-slate-600"
                      )}>
                        {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                      </Badge>
                      <div className="flex items-center text-xs text-muted-foreground font-medium">
                        <Calendar className="h-3.5 w-3.5 mr-1.5" />
                        {project.start_date ? format(new Date(project.start_date), 'MMM d, yyyy') : 'No Date'}
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 bg-muted/50 p-3 rounded-xl border border-border">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-sm text-white shrink-0 shadow-md border border-indigo-400/20">
                        {project.reporting_manager?.full_name.charAt(0) || 'R'}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Reporting Manager</span>
                        <span className="text-sm font-semibold text-foreground truncate">{project.reporting_manager?.full_name || 'Not Assigned'}</span>
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      <div className="flex justify-between items-end">
                        <div className="flex flex-col min-w-0 pr-2">
                          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Tracked Hours</span>
                          <span className="text-base font-bold text-foreground truncate">
                            {Number((project.total_hours_worked || 0).toFixed(2))} <span className="text-sm font-medium text-muted-foreground">/ {Number((project.total_hours || 0).toFixed(2))} h</span>
                          </span>
                        </div>
                        {((project.total_hours_remaining ?? 0) < 0) ? (
                          <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-md border border-red-100 shrink-0 whitespace-nowrap mt-1">Over by {Number(((project.total_hours_remaining || 0) * -1).toFixed(2))}h</span>
                        ) : (
                          <span className="text-xs font-semibold text-emerald-600 shrink-0 whitespace-nowrap mt-1">{Number((project.total_hours_remaining || 0).toFixed(2))}h left</span>
                        )}
                      </div>
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn("h-full rounded-full transition-all duration-500", ((project.total_hours_remaining ?? 0) < 0) ? "bg-red-500" : "bg-indigo-500")}
                          style={{ width: `${Math.min(100, ((project.total_hours_worked || 0) / (project.total_hours || 1)) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className="p-4 border-t border-border bg-muted/30 flex justify-between items-center gap-3">
                    <Link href={`/employee/projects/${project.id}`} className="flex-1 min-w-0">
                      <Button
                        className="w-full h-9 px-3 sm:px-4 text-sm font-bold bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-all shadow-sm flex items-center justify-center gap-2"
                      >
                        <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">View Details</span>
                      </Button>
                    </Link>
                    <div className="flex -space-x-2 shrink-0">
                      {project.members.slice(0, 4).map((member) => (
                        <div key={member.id} className="h-7 w-7 rounded-full bg-background border-2 border-background flex items-center justify-center font-bold text-xs text-foreground shadow-sm" title={member.full_name}>
                          {member.full_name[0]}
                        </div>
                      ))}
                      {project.members.length > 4 && (
                        <div className="h-7 w-7 rounded-full bg-muted border-2 border-background flex items-center justify-center font-bold text-xs text-muted-foreground shadow-sm">
                          +{project.members.length - 4}
                        </div>
                      )}
                    </div>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="no-projects"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-20 bg-muted/30 rounded-[40px] border-2 border-dashed border-border"
          >
            <div className="p-6 bg-background rounded-xl shadow-xl shadow-slate-200/50 dark:shadow-none mb-6">
              <FolderOpen className="h-12 w-12 text-slate-200" />
            </div>
            <h3 className="text-xl font-black text-foreground uppercase tracking-tight">No Projects Found</h3>
            <p className="text-muted-foreground text-sm font-medium mt-2">You haven't been assigned to any streams yet.</p>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
