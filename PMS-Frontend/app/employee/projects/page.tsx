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
import axios from 'axios';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { Project } from '@/types';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function EmployeeProjectsPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { token, user } = useAuthStore();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/projects/`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
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
  }, [token]);

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.client_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
        <p className="text-slate-500 font-medium animate-pulse uppercase tracking-widest text-[10px]">Synchronizing Project Stream...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
           <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase">Engagement Stream</h2>
           <p className="text-slate-500 font-medium text-sm">Your active connections within the Chronos ecosystem</p>
        </div>
        <div className="flex items-center space-x-3">
           <Link href="/employee/templates">
              <Button variant="outline" className="h-10 rounded-xl border-slate-200 px-5 font-black text-[10px] uppercase tracking-widest text-indigo-600 bg-white hover:bg-indigo-50 transition-all shadow-sm">
                 <BookOpen className="mr-2 h-4 w-4" /> View Master Templates
              </Button>
           </Link>
           <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-xl shrink-0">
              <Button 
               variant="ghost" 
               size="sm" 
               className={cn("rounded-lg h-9 w-9 p-0 shadow-sm", viewMode === 'grid' ? "bg-white text-indigo-600" : "text-slate-400")}
               onClick={() => setViewMode('grid')}
              >
                 <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button 
               variant="ghost" 
               size="sm" 
               className={cn("rounded-lg h-9 w-9 p-0 shadow-sm", viewMode === 'table' ? "bg-white text-indigo-600" : "text-slate-400")}
               onClick={() => setViewMode('table')}
              >
                 <TableIcon className="h-4 w-4" />
              </Button>
           </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
         <div className="relative w-full sm:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search project hashes..." 
              className="h-12 pl-11 rounded-2xl bg-white border-slate-200 outline-none focus:border-indigo-400 transition-all text-xs font-bold" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
         </div>
         <Button variant="outline" className="h-12 rounded-2xl border-slate-200 px-6 font-bold text-xs uppercase tracking-widest text-slate-500 bg-white shadow-sm">
            <Filter className="mr-2 h-4 w-4" /> Refine Stream
         </Button>
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
              viewMode === 'grid' ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4" : "grid-cols-1"
            )}
          >
            {filteredProjects.map((project, i) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="flex flex-col h-full border-slate-200 rounded-3xl hover:shadow-2xl hover:shadow-slate-200/50 transition-all cursor-pointer overflow-hidden group bg-white">
                  <CardHeader className="pb-4">
                     <div className="flex justify-between items-start mb-6">
                        <div className="flex flex-col">
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{project.code}</span>
                           <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight group-hover:text-indigo-600 transition-colors leading-tight mt-1 truncate max-w-[200px]">{project.name}</h3>
                        </div>
                        <Badge className={cn(
                          "text-[9px] font-black uppercase tracking-widest border-none px-3 py-1 rounded-lg",
                          project.status === 'active' ? "bg-indigo-100 text-indigo-700" : 
                          project.status === 'completed' ? "bg-emerald-100 text-emerald-700" :
                          project.status === 'planning' ? "bg-amber-100 text-amber-700" :
                          "bg-slate-100 text-slate-500"
                        )}>
                          {project.status}
                        </Badge>
                     </div>
                     <div className="flex items-center space-x-2 text-[10px] font-bold text-slate-400">
                        <Briefcase className="h-3 w-3" />
                        <span className="uppercase tracking-widest">{project.client_name || 'N/A'}</span>
                     </div>
                  </CardHeader>

                  <CardContent className="flex-1 pt-4 space-y-6">
                     <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group-hover:bg-indigo-50/50 transition-colors">
                        <div className="flex items-center justify-between space-x-3">
                           <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-black text-[10px] text-slate-900">
                                 {project.reporting_manager?.full_name.split(' ').map(n=>n[0]).join('') || 'RM'}
                              </div>
                              <div className="flex flex-col overflow-hidden">
                                 <span className="text-[10px] font-black text-slate-800 truncate">{project.reporting_manager?.full_name || 'Not Assigned'}</span>
                                 <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Reporting Manager</span>
                              </div>
                           </div>
                           <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-300 hover:text-indigo-600">
                              <ExternalLink className="h-3 w-3" />
                           </Button>
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                           <span className="text-[9px] font-black uppercase text-slate-400 tracking-tighter">Start Date</span>
                           <div className="text-[10px] font-black text-slate-800 flex items-center justify-center p-1.5 bg-slate-100 border border-slate-200 rounded-lg">
                              <Calendar className="h-3 w-3 mr-1 text-slate-400" /> 
                              {project.start_date ? format(new Date(project.start_date), 'dd MMM yyyy') : 'N/A'}
                           </div>
                        </div>
                        <div className="space-y-1">
                           <span className="text-[9px] font-black uppercase text-slate-400 tracking-tighter">Deadline</span>
                           <div className="text-[10px] font-black text-slate-800 flex items-center justify-center p-1.5 bg-slate-100 border border-slate-200 rounded-lg">
                              <Calendar className="h-3 w-3 mr-1 text-slate-400" /> 
                              {project.end_date ? format(new Date(project.end_date), 'dd MMM yyyy') : 'Ongoing'}
                           </div>
                        </div>
                     </div>
                  </CardContent>

                  <CardFooter className="p-6 border-t border-slate-50 mt-4 flex justify-between items-center bg-slate-50/20">
                     <Link href={`/employee/projects/${project.id}`}>
                        <Button 
                          className="h-10 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-105 transition-all shadow-lg shadow-indigo-100"
                        >
                          Explore Project
                        </Button>
                     </Link>
                     <div className="flex -space-x-1.5">
                        {project.members.slice(0, 3).map((member, idx) => (
                          <div key={member.id} className="h-6 w-6 rounded-full bg-slate-200 border-2 border-white text-[8px] flex items-center justify-center font-black" title={member.full_name}>
                             {member.full_name[0]}
                          </div>
                        ))}
                        {project.members.length > 3 && (
                          <div className="h-6 w-6 rounded-full bg-slate-100 border-2 border-white text-[8px] flex items-center justify-center font-black text-slate-500">
                             +{project.members.length - 3}
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
            className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200"
          >
            <div className="p-6 bg-white rounded-3xl shadow-xl shadow-slate-200/50 mb-6">
               <FolderOpen className="h-12 w-12 text-slate-200" />
            </div>
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">No Projects Found</h3>
            <p className="text-slate-400 text-sm font-medium mt-2">You haven't been assigned to any streams yet.</p>
            <Button variant="outline" className="mt-8 h-12 rounded-2xl border-slate-200 px-8 font-black text-[10px] uppercase tracking-widest text-indigo-600 bg-white hover:bg-indigo-600 hover:text-white transition-all shadow-lg shadow-indigo-100">
               Request Assignment
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
