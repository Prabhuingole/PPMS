'use client';

import { useState, useEffect, useMemo } from 'react';
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
import axios from 'axios';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function DashboardPage() {
  const router = useRouter();
  const { token, user } = useAuthStore();
  const [employees, setEmployees] = useState(0);
  const [projects, setProjects] = useState<any[]>([]);
  const [timesheets, setTimesheets] = useState<any[]>([]);

  useEffect(() => {
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };
    const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

    Promise.all([
      axios.get(`${api}/employees/?limit=1000`, { headers }).catch(() => ({ data: { items: [], total: 0 } })),
      axios.get(`${api}/projects/?limit=1000`, { headers }).catch(() => ({ data: { items: [] } })),
      axios.get(`${api}/timesheets/all`, { headers }).catch(() => ({ data: [] })),
    ]).then(([empRes, projRes, tsRes]) => {
      setEmployees(empRes.data?.total || empRes.data?.items?.length || 0);
      setProjects(projRes.data?.items || projRes.data || []);
      setTimesheets(tsRes.data || []);
    });
  }, [token]);

  const formatDuration = (decimal: number) => {
    const h = Math.floor(decimal);
    const m = Math.round((decimal - h) * 60);
    return `${h}h ${m}m`;
  };

  // Derived stats
  const pendingCount = timesheets.filter(t => t.status === 'pending').length;
  const approvedCount = timesheets.filter(t => t.status === 'approved').length;
  const rejectedCount = timesheets.filter(t => t.status === 'rejected').length;

  const todayStr = new Date().toISOString().split('T')[0];
  const todayHours = timesheets
    .filter(t => t.date?.startsWith(todayStr))
    .reduce((acc, t) => acc + (t.hours || 0), 0);

  const totalHoursAllTime = timesheets.reduce((acc, t) => acc + (t.hours || 0), 0);

  // This week hours
  const thisWeekHours = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + 1);
    startOfWeek.setHours(0, 0, 0, 0);
    return timesheets
      .filter(t => {
        const d = new Date(t.date);
        return d >= startOfWeek && d <= now;
      })
      .reduce((acc, t) => acc + (t.hours || 0), 0);
  }, [timesheets]);

  // Weekly trend data
  const last7DaysData = useMemo(() => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      
      const hours = timesheets
        .filter(t => t.date?.startsWith(dateStr) && t.status === 'approved')
        .reduce((acc, t) => acc + (t.hours || 0), 0);
        
      data.push({ name: dayName, hours });
    }
    return data;
  }, [timesheets]);


  // Recent timesheets (last 8)
  const recentTimesheets = timesheets.slice(0, 8);

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
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* ── Hero Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 p-5 md:p-10"
      >
        <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-indigo-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-purple-500/10 blur-3xl" />
        <div className="pointer-events-none absolute top-1/2 right-1/4 h-32 w-32 rounded-full bg-cyan-400/5 blur-2xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <p className="text-indigo-300 text-xs font-black uppercase tracking-widest mb-1.5">{greeting}</p>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white">
              {user?.full_name || 'Admin'} 👋
            </h2>
            <p className="text-slate-400 font-medium text-sm mt-1">
              Here's what's happening across your workspace today
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/superadmin/timesheets">
              <Button className="bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm rounded-xl h-10 px-5 text-[10px] font-black uppercase tracking-widest ring-1 ring-white/10 transition-all hover:ring-white/20">
                <Clock className="mr-2 h-3.5 w-3.5" />
                {pendingCount} Pending Reviews
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* ── Approval Overview ── */}
      <div className="grid grid-cols-1 gap-4">
        {/* Approval Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
        >
          <Card className="border-slate-200/80 rounded-2xl bg-white shadow-sm overflow-hidden h-full">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-indigo-500" />
                <span className="text-xs font-black text-slate-700 uppercase tracking-widest">Timesheet Overview</span>
              </div>
              <Badge className="bg-slate-100 text-slate-500 border-none text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md">
                All Time
              </Badge>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: 'Approved', count: approvedCount, icon: CheckCircle2, color: 'emerald', percent: timesheets.length > 0 ? Math.round((approvedCount / timesheets.length) * 100) : 0 },
                  { label: 'Pending', count: pendingCount, icon: Clock, color: 'amber', percent: timesheets.length > 0 ? Math.round((pendingCount / timesheets.length) * 100) : 0 },
                  { label: 'Rejected', count: rejectedCount, icon: XCircle, color: 'red', percent: timesheets.length > 0 ? Math.round((rejectedCount / timesheets.length) * 100) : 0 },
                ].map((item) => (
                  <div key={item.label} className="text-center p-4 rounded-2xl bg-slate-50/50 ring-1 ring-slate-100 hover:ring-slate-200 transition-all">
                    <div className={cn(
                      "flex h-10 w-10 mx-auto items-center justify-center rounded-xl mb-3",
                      `bg-${item.color}-50`
                    )} style={{ backgroundColor: item.color === 'emerald' ? '#ecfdf5' : item.color === 'amber' ? '#fffbeb' : '#fef2f2' }}>
                      <item.icon className="h-5 w-5" style={{ color: item.color === 'emerald' ? '#059669' : item.color === 'amber' ? '#d97706' : '#dc2626' }} />
                    </div>
                    <div className="text-xl md:text-2xl font-black text-slate-900">{item.count}</div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{item.label}</div>
                    <div className="mt-3 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${item.percent}%` }}
                        transition={{ duration: 1, delay: 0.6, ease: 'easeOut' }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: item.color === 'emerald' ? '#10b981' : item.color === 'amber' ? '#f59e0b' : '#ef4444' }}
                      />
                    </div>
                    <div className="text-[9px] font-bold text-slate-400 mt-1">{item.percent}%</div>
                  </div>
                ))}
              </div>

              {/* Total bar */}
              <div className="mt-5 flex items-center gap-4 p-4 rounded-xl bg-slate-900 text-white">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
                  <Layers className="h-4 w-4 text-indigo-300" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Entries Logged</span>
                    <span className="text-sm font-black">{timesheets.length}</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-purple-400 flex">
                      {timesheets.length > 0 && (
                        <>
                          <div
                            className="h-full bg-emerald-400 rounded-l-full"
                            style={{ width: `${(approvedCount / timesheets.length) * 100}%` }}
                          />
                          <div
                            className="h-full bg-amber-400"
                            style={{ width: `${(pendingCount / timesheets.length) * 100}%` }}
                          />
                          <div
                            className="h-full bg-red-400 rounded-r-full"
                            style={{ width: `${(rejectedCount / timesheets.length) * 100}%` }}
                          />
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* ── Analytics & Recent Activity ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Weekly Hours Trend */}
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="lg:col-span-2"
        >
          <Card className="border-slate-200/80 rounded-2xl bg-white shadow-sm overflow-hidden h-full flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-indigo-500" />
                <span className="text-xs font-black text-slate-700 uppercase tracking-widest">Weekly Hours Trend (Approved)</span>
              </div>
            </div>
            <div className="flex-1 p-5 h-[320px]">
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
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="hours" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.55 }}
          className="lg:col-span-1"
        >
          <Card className="border-none rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 shadow-xl overflow-hidden h-full flex flex-col relative text-white">
            {/* Decorative */}
            <div className="pointer-events-none absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -translate-y-16 translate-x-16" />
            <div className="pointer-events-none absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-2xl translate-y-12 -translate-x-8" />

            <div className="p-5 border-b border-white/10 flex items-center justify-between relative z-10">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-white" />
                <span className="text-xs font-black text-white uppercase tracking-widest">Recent Activity</span>
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <Link href="/superadmin/timesheets">
                <Button variant="ghost" className="h-7 px-2.5 rounded-lg text-[9px] font-black text-white/80 uppercase tracking-widest hover:text-white hover:bg-white/15 transition-colors">
                  All <ArrowUpRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </div>

            <div className="flex-1 p-3 relative z-10">
              {recentTimesheets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 mb-3 ring-1 ring-white/20">
                    <Clock className="h-5 w-5 text-white/60" />
                  </div>
                  <p className="text-xs font-bold text-white/80">No recent activity</p>
                </div>
              ) : (
                recentTimesheets.map((ts, idx) => (
                  <motion.div
                    key={ts.id}
                    initial={{ opacity: 0, x: 6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: 0.6 + idx * 0.04 }}
                    onClick={() => router.push('/superadmin/timesheets')}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-white/10 transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="h-8 w-8 ring-1 ring-white/20 shrink-0">
                        <AvatarFallback className={cn("text-white font-black text-[9px] bg-gradient-to-br", avatarGradient(ts.user_name || 'U'))}>
                          {(ts.user_name || 'U').substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[11px] font-black text-white truncate">{ts.user_name || 'Unknown'}</span>
                        <span className="text-[10px] font-medium text-white/70 truncate">{ts.task_title || ts.description?.substring(0, 30) || 'Task'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-black text-white/90">{formatDuration(ts.hours || 0)}</span>
                      <div className={cn(
                        "h-1.5 w-1.5 rounded-full ring-1 ring-white/20",
                        ts.status === 'approved' ? "bg-emerald-400" :
                        ts.status === 'rejected' ? "bg-red-400" :
                        "bg-amber-400"
                      )} />
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
