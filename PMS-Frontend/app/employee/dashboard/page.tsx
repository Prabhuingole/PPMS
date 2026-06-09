'use client';

import { useState, useEffect } from 'react';
import { 
  Briefcase, 
  Clock, 
  TrendingUp, 
  Zap, 
  ArrowUpRight, 
  History, 
  PlusCircle,
  CheckCircle2,
  XCircle,
  MessageSquare
} from 'lucide-react';
import { motion } from 'motion/react';
import { Card } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import api from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { useWebSocketEvent } from '@/hooks/useWebSocketEvent';
import { Popover, PopoverContent, PopoverHeader, PopoverTrigger } from '@/components/ui/popover';
import { AttendanceWidget } from '@/components/employee/AttendanceWidget';
import { handleApiError } from '@/utils/handleApiError';
import { ErrorState } from '@/components/ui/error-state';
import { Skeleton } from '@/components/ui/skeleton';

export default function EmployeeDashboard() {
  const { user } = useAuthStore();
  
  const [projects, setProjects] = useState<any[]>([]);
  const [isProjectsLoading, setIsProjectsLoading] = useState(true);
  const [isProjectsError, setIsProjectsError] = useState(false);

  const [timesheets, setTimesheets] = useState<any[]>([]);
  const [isTimesheetsLoading, setIsTimesheetsLoading] = useState(true);
  const [isTimesheetsError, setIsTimesheetsError] = useState(false);
  
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useWebSocketEvent(['TIMESHEETS_UPDATED', 'PROJECTS_UPDATED'], () => setRefreshTrigger(prev => prev + 1));

  const fetchProjects = async () => {
    setIsProjectsLoading(true);
    setIsProjectsError(false);
    try {
      const res = await api.get('/projects/');
      setProjects(res.data?.items || res.data || []);
    } catch (err) {
      setIsProjectsError(true);
      handleApiError(err, 'Failed to load assigned projects');
    } finally {
      setIsProjectsLoading(false);
    }
  };

  const fetchTimesheets = async () => {
    setIsTimesheetsLoading(true);
    setIsTimesheetsError(false);
    try {
      const res = await api.get('/timesheets/me');
      setTimesheets(res.data?.items || res.data || []);
    } catch (err) {
      setIsTimesheetsError(true);
      handleApiError(err, 'Failed to load your timesheets');
    } finally {
      setIsTimesheetsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchTimesheets();
  }, [refreshTrigger]);

  const formatDuration = (decimal: number) => {
    const h = Math.floor(decimal);
    const m = Math.round((decimal - h) * 60);
    return `${h}h ${m}m`;
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const todayTimesheets = timesheets.filter(t => t.date?.startsWith(todayStr));
  const todayHours = todayTimesheets.reduce((acc, t) => acc + (t.hours || 0), 0);
  const approvedCount = timesheets.filter(t => t.status === 'approved').length;
  const pendingCount = timesheets.filter(t => t.status === 'pending').length;
  const totalHours = timesheets.reduce((acc, t) => acc + (t.hours || 0), 0);

  // Build weekly data
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Monday
  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const weekDaysShort = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const weeklyData = weekDays.map((dayName, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const dayHours = timesheets
      .filter(t => t.date?.startsWith(dateStr))
      .reduce((acc: number, t: any) => acc + (t.hours || 0), 0);
    return { day: dayName, hours: dayHours, isPast: d <= now };
  });
  const weeklyTotal = weeklyData.reduce((acc, d) => acc + d.hours, 0);

  const statCards = [
    { label: 'Assigned Projects', value: isProjectsLoading ? 0 : projects.length.toString(), icon: Briefcase, color: 'text-primary', bg: 'bg-indigo-50' },
    { label: "Today's Hours", value: isTimesheetsLoading ? 0 : formatDuration(todayHours), icon: Clock, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Approved', value: isTimesheetsLoading ? 0 : approvedCount.toString(), icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Pending', value: isTimesheetsLoading ? 0 : pendingCount.toString(), icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  const recentLogs = timesheets.slice(0, 5);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto min-w-0 overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-foreground uppercase">Dashboard</h2>
          <p className="text-muted-foreground font-medium text-sm">Welcome back, {user?.full_name || 'Employee'}</p>
        </div>
        <Link 
          href="/employee/timesheets?add=true"
          className={cn(buttonVariants(), "bg-primary text-white hover:bg-indigo-700 rounded-xl h-12 px-6 shadow-xl shadow-indigo-600/20 font-bold uppercase text-xs tracking-widest")}
        >
           <PlusCircle className="mr-2 h-4 w-4" /> Fill Timesheet
        </Link>
      </div>

      {/* Attendance Widget */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <AttendanceWidget />
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <Card className="border-border rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow group h-full flex flex-col justify-between">
              <div className={cn("p-2 rounded-lg w-fit", stat.bg)}>
                <stat.icon className={cn("h-4 w-4", stat.color)} />
              </div>
              <div className="mt-4">
                <div className="text-2xl md:text-3xl font-black text-foreground">{stat.value}</div>
                <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-1">{stat.label}</div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Weekly Chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="col-span-1 md:col-span-8"
        >
          <Card className="rounded-xl border-border shadow-sm p-4 md:p-6 bg-background h-full flex flex-col">
             <div className="flex items-center justify-between mb-4 md:mb-6">
                <div>
                   <h3 className="text-base font-black text-foreground uppercase tracking-tight">This Week</h3>
                   <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">Weekly hours breakdown</p>
                </div>
                <div className="text-right">
                   <span className="text-base md:text-lg font-black text-primary">{formatDuration(weeklyTotal)}</span>
                   <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">/ 40h target</span>
                </div>
             </div>

             <div className="space-y-4 flex-1">
                {isTimesheetsLoading ? (
                  <div className="w-full h-full space-y-4 pt-2">
                    {[1,2,3,4,5,6,7].map(i => (
                      <Skeleton key={i} className="h-4 w-full rounded-full" />
                    ))}
                  </div>
                ) : isTimesheetsError ? (
                  <ErrorState title="Failed to load" description="We couldn't load your weekly hours." onRetry={fetchTimesheets} className="py-2" />
                ) : (
                  weeklyData.map((item, idx) => (
                    <div key={idx} className="space-y-1.5">
                       <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                          <span><span className="hidden sm:inline">{item.day}</span><span className="sm:hidden">{weekDaysShort[idx]}</span></span>
                          <span>{item.hours > 0 ? formatDuration(item.hours) : '—'}</span>
                       </div>
                       <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min((item.hours / 10) * 100, 100)}%` }}
                            transition={{ duration: 0.8, delay: 0.4 + idx * 0.08 }}
                            className={cn(
                              "h-full rounded-full",
                              item.hours > 8 ? "bg-amber-500" : item.hours > 0 ? "bg-indigo-500" : "bg-muted"
                            )} 
                          />
                       </div>
                    </div>
                  ))
                )}
             </div>
          </Card>
        </motion.div>

        {/* Recent Submissions */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="col-span-1 md:col-span-4"
        >
          <Card className="rounded-xl border-none shadow-2xl shadow-purple-500/20 bg-gradient-to-br from-indigo-500 via-purple-500 to-fuchsia-600 p-4 md:p-6 text-white h-full flex flex-col relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16 blur-2xl"></div>
             <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-16 -translate-x-16 blur-3xl"></div>
             
             <h3 className="font-bold text-base mb-5 flex items-center space-x-2 z-10">
                <span>Recent Submissions</span>
                <span className="w-1.5 h-1.5 bg-background rounded-full animate-pulse"></span>
             </h3>

             <div className="space-y-4 flex-1 z-10">
                {isTimesheetsLoading ? (
                  <div className="space-y-4">
                    {[1,2,3].map(i => (
                      <div key={i} className="flex flex-col space-y-2 border-b border-white/20 pb-4">
                        <Skeleton className="h-2 w-16 bg-white/20" />
                        <Skeleton className="h-3 w-32 bg-white/20" />
                      </div>
                    ))}
                  </div>
                ) : isTimesheetsError ? (
                  <div className="py-4 text-center">
                    <p className="text-sm text-white/90 font-bold mb-2">Failed to load recent activity</p>
                    <Button size="sm" variant="outline" className="bg-white/10 text-white border-white/20 hover:bg-white/20" onClick={fetchTimesheets}>Try Again</Button>
                  </div>
                ) : recentLogs.length === 0 ? (
                  <p className="text-sm text-white/70 font-medium">No submissions yet</p>
                ) : (
                   recentLogs.map((ts: any) => (
                     <div key={ts.id} className="flex items-start justify-between border-b border-white/20 last:border-0 pb-4 last:pb-0">
                        <div className="flex flex-col min-w-0 flex-1 mr-2">
                           <span className="text-[10px] font-black text-white/70 uppercase tracking-widest mb-1">
                             {ts.date ? new Date(ts.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'}
                           </span>
                           <span className="text-xs font-bold text-white truncate">{ts.task_title || ts.project_name || 'Task'}</span>
                           <span className="text-[10px] text-white/90 font-bold">{formatDuration(ts.hours || 0)}</span>
                           {ts.feedback && (
                             <Popover>
                               <PopoverTrigger className="mt-2 flex items-start gap-1.5 text-left text-[9px] text-white bg-white/15 hover:bg-white/25 px-2.5 py-1.5 rounded-xl max-w-[200px] transition-colors focus:outline-none">
                                 <MessageSquare className="h-3 w-3 text-white/80 mt-0.5 flex-shrink-0" />
                                 <span className="font-semibold line-clamp-1 underline decoration-white/40 decoration-dashed">
                                   {ts.feedback}
                                 </span>
                               </PopoverTrigger>
                               <PopoverContent className="w-80 p-4 rounded-xl bg-background text-slate-800 border-none shadow-2xl" align="start">
                                 <PopoverHeader className="pb-2 border-b border-border">
                                   <div className="flex items-center gap-2 text-primary">
                                     <MessageSquare className="h-4 w-4" />
                                     <span className="text-[10px] font-black uppercase tracking-widest">Superadmin Feedback</span>
                                   </div>
                                 </PopoverHeader>
                                 <p className="text-xs font-semibold text-slate-600 mt-3 whitespace-pre-wrap leading-relaxed">
                                   {ts.feedback}
                                 </p>
                               </PopoverContent>
                             </Popover>
                           )}
                        </div>
                        <Badge className={cn(
                          "border-none text-[8px] font-black uppercase shrink-0 py-1 px-2.5 rounded-lg shadow-sm backdrop-blur-sm",
                          ts.status === 'approved' ? "bg-emerald-400/30 text-white" : 
                          ts.status === 'rejected' ? "bg-red-400/40 text-white" :
                          "bg-amber-400/30 text-white"
                        )}>
                           {ts.status}
                        </Badge>
                     </div>
                   ))
                )}
             </div>

             <Link href="/employee/timesheets" className="mt-6 z-10">
               <Button className="w-full bg-background text-primary hover:bg-muted hover:text-indigo-700 rounded-xl py-5 font-bold text-xs uppercase tracking-widest shadow-xl transition-all">
                  View All Timesheets
                  <History className="ml-2 h-3.5 w-3.5" />
               </Button>
             </Link>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
