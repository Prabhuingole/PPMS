'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  Briefcase, 
  Clock, 
  TrendingUp,
  Activity,
  Sparkles,
  CheckCircle2,
  XCircle,
  Timer,
  Layers,
  ChevronRight,
  CalendarDays,
  ArrowUpRight,
  BarChart3,
  FolderKanban,
  Trophy,
  Medal
} from 'lucide-react';
import { motion } from 'motion/react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import api from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';
import { AnalyticsLayout } from '@/components/layout/AnalyticsLayout';
import { KPIStatCard } from '@/components/ui/KPIStatCard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { handleApiError } from '@/utils/handleApiError';
import { ErrorState } from '@/components/ui/error-state';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  
  
  const [employees, setEmployees] = useState(0);
  const [projects, setProjects] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const [empRes, projRes, statsRes] = await Promise.all([
        api.get('/employees/?limit=1'),
        api.get('/projects/?limit=5'),
        api.get('/timesheets/dashboard-stats')
      ]);
      setEmployees(empRes.data?.total || empRes.data?.items?.length || 0);
      setProjects(projRes.data?.items || projRes.data || []);
      setStats(statsRes.data || null);
    } catch (err) {
      setIsError(true);
      handleApiError(err, 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const formatDuration = (decimal: number) => {
    const h = Math.floor(decimal);
    const m = Math.round((decimal - h) * 60);
    return `${h}h ${m}m`;
  };

  // Derived stats from API
  const pendingCount = stats?.pendingCount || 0;
  const activeProjects = stats?.activeProjects || 0;
  const activeEmployees = stats?.activeEmployees || 0;
  const totalCount = stats?.totalCount || 0;

  // Weekly trend data
  const last7DaysData = useMemo(() => {
    return stats?.last7DaysData?.slice().reverse() || [];
  }, [stats?.last7DaysData]);

  // Recent timesheets
  const recentTimesheets: any[] = stats?.recentTimesheets || [];

  // Top projects (first 5)
  const topProjects = projects.slice(0, 5);

  // Avatar gradient helper
  const avatarGradient = (name: string) => {
    const gradients = [
      'from-indigo-500 to-purple-600',
      'from-emerald-500 to-teal-600',
      'from-amber-500 to-orange-600',
      'from-rose-500 to-pink-600',
      'from-cyan-500 to-blue-600',
      'from-violet-500 to-fuchsia-600',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return gradients[Math.abs(hash) % gradients.length];
  };

  // Greeting based on time
  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  }, []);

  return (
    <AnalyticsLayout
      title="Dashboard"
      description="Monitor workspace activity, approvals, attendance and operational metrics."
      headerActions={null}
      kpiSection={
        <>
          <KPIStatCard
            title="Total Timesheets"
            value={isLoading ? 0 : totalCount}
            icon={Layers}
          />
          <KPIStatCard
            title="Timesheets Review Pending"
            value={isLoading ? 0 : pendingCount}
            icon={Clock}
          />
          <KPIStatCard
            title="Active Projects"
            value={isLoading ? 0 : activeProjects}
            icon={FolderKanban}
          />
          <KPIStatCard
            title="Active Employees"
            value={isLoading ? 0 : activeEmployees}
            icon={Users}
          />
        </>
      }
      chartsSection={
        <>
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
            className="lg:col-span-2"
          >
            <Card className="border border-border rounded-xl bg-background shadow-sm overflow-hidden h-full flex flex-col">
              <div className="p-5 border-b border-border flex items-center justify-between bg-background">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-indigo-500" />
                  <span className="text-sm font-semibold text-foreground tracking-tight">Weekly Hours Trend (Approved)</span>
                </div>
              </div>
              <div className="flex-1 p-5 h-[320px]">
                {isLoading ? (
                  <div className="w-full h-full flex items-end gap-2 pb-4">
                    {[1,2,3,4,5,6,7].map(i => (
                      <Skeleton key={i} className="w-full rounded-t-sm" style={{ height: `${Math.random() * 80 + 20}%` }} />
                    ))}
                  </div>
                ) : isError ? (
                  <ErrorState title="Failed to load trend" description="We couldn't load the timesheet trends." onRetry={fetchDashboardData} className="py-4" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={last7DaysData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} 
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} 
                      />
                      <Tooltip 
                        cursor={{ fill: '#f8fafc' }}
                        contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)' }}
                      />
                      <Bar dataKey="hours" fill="#4f46e5" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.55 }}
            className="lg:col-span-1"
          >
            <Card className="border border-border rounded-xl bg-background shadow-sm overflow-hidden h-full flex flex-col">
              <div className="p-5 border-b border-border flex items-center justify-between bg-background">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-indigo-500" />
                  <span className="text-sm font-semibold text-foreground tracking-tight">Recent Activity</span>
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse ml-2" />
                </div>
                <Link href="/superadmin/timesheets">
                  <Button variant="ghost" className="h-8 px-3 rounded-lg text-xs font-semibold text-primary hover:text-indigo-700 hover:bg-indigo-50 transition-colors">
                    View All
                  </Button>
                </Link>
              </div>

              <div className="flex-1 p-3">
                {isLoading ? (
                  <div className="space-y-3">
                    {[1,2,3,4,5].map(i => (
                      <div key={i} className="flex items-center gap-3 py-2">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="space-y-2 flex-1">
                          <Skeleton className="h-3 w-32" />
                          <Skeleton className="h-2 w-24" />
                        </div>
                        <Skeleton className="h-4 w-12" />
                      </div>
                    ))}
                  </div>
                ) : isError ? (
                  <ErrorState title="Failed to load activity" description="Unable to fetch recent timesheet activity." onRetry={fetchDashboardData} className="py-8" />
                ) : recentTimesheets.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted/30 mb-3 border border-border">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <h3 className="text-sm font-semibold mb-1">No Recent Activity</h3>
                    <p className="text-xs text-muted-foreground max-w-[200px]">There are no recent timesheets to display.</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {recentTimesheets.map((ts: any, idx: number) => (
                      <motion.div
                        key={ts.id}
                        initial={{ opacity: 0, x: 6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2, delay: 0.6 + idx * 0.04 }}
                        onClick={() => router.push('/superadmin/timesheets')}
                        className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-muted transition-colors group cursor-pointer"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar className="h-8 w-8 ring-1 ring-slate-100 shrink-0">
                            <AvatarFallback className="bg-indigo-50 text-indigo-700 font-bold text-xs">
                              {(ts.user_name || 'U').substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-semibold text-foreground truncate">{ts.user_name || 'Unknown'}</span>
                            <span className="text-[11px] font-medium text-muted-foreground truncate">{ts.task_title || ts.description?.substring(0, 30) || 'Task'}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs font-semibold text-foreground">{formatDuration(ts.hours || 0)}</span>
                          <div className={cn(
                            "h-2 w-2 rounded-full",
                            ts.status === 'approved' ? "bg-emerald-500" :
                            ts.status === 'rejected' ? "bg-rose-500" :
                            "bg-amber-500"
                          )} />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        </>
      }
    />
  );
}
