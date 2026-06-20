'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  CheckCircle2, 
  Clock, 
  TrendingUp,
  MessageSquare,
  XCircle,
  Paperclip,
  Pencil,
  ChevronDown,
  ChevronUp,
  CalendarDays,
  Timer,
  Sparkles,
  FileText,
  Layers,
  MoreHorizontal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

import api from '@/services/api';
import { handleApiError } from '@/utils/handleApiError';
import { ErrorState } from '@/components/ui/error-state';
import { useAuthStore } from '@/store/authStore';
import { useWebSocketEvent } from '@/hooks/useWebSocketEvent';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FillTimesheetDialog } from '@/components/timesheets/FillTimesheetDialog';

type FilterStatus = 'all' | 'approved' | 'pending' | 'rejected';

const ExpandableText = ({ text }: { text: string }) => {
  const [expanded, setExpanded] = useState(false);
  if (!text) return null;
  const isLong = text.length > 100;

  return (
    <div>
      <p className={`text-[11px] text-muted-foreground mt-1 max-w-lg break-words whitespace-pre-wrap leading-relaxed ${expanded ? '' : 'line-clamp-2'}`}>
        {text}
      </p>
      {isLong && (
        <button 
          onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }} 
          className="text-[10px] font-semibold text-primary hover:underline mt-0.5 focus:outline-none"
        >
          {expanded ? 'Show less' : 'See more'}
        </button>
      )}
    </div>
  );
};

export default function MyTimesheetsPage() {
  const { token } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [timesheets, setTimesheets] = useState<any[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [counts, setCounts] = useState({ all: 0, approved: 0, pending: 0, rejected: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50; // Server-side pagination limit
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editDate, setEditDate] = useState<string | null>(null);
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});
  const [activeFilter, setActiveFilter] = useState<FilterStatus>('all');
  const [activeProjectFilter, setActiveProjectFilter] = useState<string>('All Projects');
  const [activeManagerFilter, setActiveManagerFilter] = useState<string>('All Manager');
  const [dbProjects, setDbProjects] = useState<any[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('add') === 'true') {
        setIsAddDialogOpen(true);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  useWebSocketEvent('TIMESHEETS_UPDATED', () => setRefreshTrigger(prev => prev + 1));
  useWebSocketEvent('PROJECTS_UPDATED', () => setRefreshTrigger(prev => prev + 1));

  useEffect(() => {
    if (token) {
      let projectId = '';
      if (activeProjectFilter !== 'All Projects') {
        projectId = activeProjectFilter;
      }
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
      });
      if (searchTerm) params.append('search', searchTerm);
      if (activeFilter !== 'all') params.append('status', activeFilter);
      if (projectId) params.append('project_id', projectId);

      if (activeManagerFilter !== 'All Manager') {
        params.append('manager_name', activeManagerFilter);
      }

      api.get(`/timesheets/me?${params.toString()}`).then(res => {
        setTimesheets(res.data.items || []);
        setTotalItems(res.data.total || 0);
        if (res.data.counts) setCounts(res.data.counts);
      }).catch(console.error);
    }
  }, [token, refreshTrigger, currentPage, searchTerm, activeFilter, activeProjectFilter, activeManagerFilter, dbProjects]);

  useEffect(() => {
    // Load active projects for timesheet dropdown
    if (token) {
      api.get(`/projects/?limit=1000&include_unassigned=true`).then(res => {
        let items = res.data.items || res.data;
        items = items.filter((p: any) => p.name.toLowerCase() !== 'other' && p.name.toLowerCase() !== 'other work');
        setDbProjects(items);
      }).catch(console.error);
    }
  }, [token, refreshTrigger]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeFilter, activeProjectFilter, activeManagerFilter]);

  const formatDuration = (decimal: number) => {
    const h = Math.floor(decimal);
    const m = Math.round((decimal - h) * 60);
    return `${h}h ${m}m`;
  };

  const approvedCount = counts.approved;
  const pendingCount = counts.pending;
  const rejectedCount = counts.rejected;
  const totalHours = timesheets.reduce((acc, t) => acc + (t.hours || 0), 0);

  // This week's hours
  const thisWeekHours = useMemo(() => {
    return timesheets
      .filter(t => {
        if (!t.date) return false;
        const d = new Date(t.date);
        const now = new Date();
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
        return d >= startOfWeek;
      })
      .reduce((acc, t) => acc + (t.hours || 0), 0);
  }, [timesheets]);

  const uniqueProjects = useMemo(() => {
    const items: { id: string; label: string }[] = [];
    const dbProjectIds = new Set<string>();

    dbProjects.forEach(p => {
      if (p.name && p.name.toLowerCase() !== 'learning') {
        const label = p.code ? `[${p.code}] — ${p.name}` : p.name;
        items.push({ id: p.id.toString(), label });
        dbProjectIds.add(p.id.toString());
      }
    });

    timesheets.forEach(t => {
      if (t.project_id && !dbProjectIds.has(t.project_id.toString())) {
        if (t.project_name && t.project_name.toLowerCase() !== 'learning') {
          items.push({ id: t.project_id.toString(), label: t.project_name });
          dbProjectIds.add(t.project_id.toString());
        }
      }
    });

    items.push({ id: 'category:kt', label: 'Other Work: Knowledge Transfer (KT)' });
    items.push({ id: 'category:meeting', label: 'Other Work: Meeting' });
    items.push({ id: 'category:learning', label: 'Other Work: Learning' });

    return items.sort((a, b) => a.label.localeCompare(b.label));
  }, [dbProjects, timesheets]);

  const uniqueManagers = useMemo(() => {
    const managersSet = new Set<string>();
    dbProjects.forEach(p => {
      if (p.reporting_manager?.full_name) {
        managersSet.add(p.reporting_manager.full_name);
      }
    });
    return Array.from(managersSet).sort();
  }, [dbProjects]);

  // Group by date using the server-paginated timesheets
  const dateOrder: string[] = [];
  const byDate: Record<string, typeof timesheets> = {};
  for (const t of timesheets) {
    const day = t.date ? t.date.split('T')[0] : 'unknown';
    if (!byDate[day]) { byDate[day] = []; dateOrder.push(day); }
    byDate[day].push(t);
  }

  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const visibleDays = dateOrder;

  const filterTabs: { key: FilterStatus; label: string; count: number; color: string; activeColor: string }[] = [
    { key: 'all', label: 'All', count: counts.all, color: 'text-muted-foreground', activeColor: 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' },
    { key: 'approved', label: 'Approved', count: approvedCount, color: 'text-emerald-600', activeColor: 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' },
    { key: 'pending', label: 'Pending', count: pendingCount, color: 'text-amber-600', activeColor: 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' },
    { key: 'rejected', label: 'Rejected', count: rejectedCount, color: 'text-red-600', activeColor: 'bg-red-500 text-white shadow-lg shadow-red-500/20' },
  ];

  const attendanceBadgeStyle = (att: string) => {
    switch (att) {
      case 'full-day': return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/50';
      case 'half-day': return 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/50';
      case 'late-arrival': return 'bg-purple-50 text-purple-700 ring-1 ring-purple-200/50';
      case 'early-arrival': return 'bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200/50';
      case 'leave': return 'bg-red-50 text-red-700 ring-1 ring-red-200/50';
      case 'public-holiday': return 'bg-blue-50 text-blue-700 ring-1 ring-blue-200/50';
      default: return 'bg-muted/30 text-muted-foreground ring-1 ring-slate-200/50';
    }
  };

  const statusBadgeStyle = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-sm shadow-emerald-500/25';
      case 'rejected': return 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-sm shadow-red-500/25';
      default: return 'bg-gradient-to-r from-amber-400 to-amber-500 text-white shadow-sm shadow-amber-400/25';
    }
  };

  return (
    <div className="space-y-5 md:space-y-8">
      {/* ── Hero Header ── */}
      <motion.div 
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 p-8 md:p-10"
      >
        {/* Decorative orbs */}
        <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-indigo-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-purple-500/10 blur-3xl" />
        <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-32 w-32 rounded-full bg-cyan-400/5 blur-2xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm ring-1 ring-white/20">
                <Layers className="h-5 w-5 text-indigo-300" />
              </div>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white uppercase">
                My Timesheets
              </h2>
            </div>
            <p className="text-muted-foreground font-medium text-sm ml-[52px]">
              Track, manage, and review your daily work entries
            </p>
          </div>
          <Button 
            onClick={() => setIsAddDialogOpen(true)}
            className="bg-background text-foreground hover:bg-muted rounded-xl h-12 px-8 shadow-xl shadow-black/20 font-black uppercase text-xs tracking-widest transition-all hover:scale-[1.02] hover:shadow-2xl active:scale-95 group"
          >
            <Plus className="mr-2 h-4 w-4 transition-transform group-hover:rotate-90" /> New Entry
          </Button>
        </div>
      </motion.div>

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
        {[
          { label: 'Approved', value: approvedCount, icon: CheckCircle2, gradient: 'from-emerald-500 to-teal-600', bg: 'bg-emerald-50', iconColor: 'text-emerald-600', ring: 'ring-emerald-100' },
          { label: 'Pending', value: pendingCount, icon: Clock, gradient: 'from-amber-400 to-orange-500', bg: 'bg-amber-50', iconColor: 'text-amber-600', ring: 'ring-amber-100' },
          { label: 'Rejected', value: rejectedCount, icon: XCircle, gradient: 'from-red-500 to-rose-600', bg: 'bg-red-50', iconColor: 'text-red-600', ring: 'ring-red-100' },
          { label: 'Total Hours', value: formatDuration(totalHours), icon: Timer, gradient: 'from-indigo-500 to-purple-600', bg: 'bg-indigo-50', iconColor: 'text-primary', ring: 'ring-indigo-100' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
          >
            <Card className="border-border/80 rounded-xl bg-background shadow-sm hover:shadow-md transition-all duration-300 group overflow-hidden relative">
              {/* Gradient accent line */}
              <div className={cn("absolute top-0 left-0 right-0 h-1 bg-gradient-to-r opacity-80", stat.gradient)} />
              <div className="p-3 pt-4 md:p-5 md:pt-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{stat.label}</span>
                  <div className={cn("p-2 rounded-xl ring-1 transition-transform group-hover:scale-110", stat.bg, stat.ring)}>
                    <stat.icon className={cn("h-4 w-4", stat.iconColor)} />
                  </div>
                </div>
                <div className="text-2xl md:text-3xl font-black text-foreground tracking-tight">{stat.value}</div>
                {stat.label === 'Total Hours' && (
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-1">{timesheets.length} entries logged</p>
                )}
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* ── Weekly Progress ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.35 }}
      >
        <Card className="border-border/80 rounded-xl bg-background shadow-sm overflow-hidden">
          <div className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 ring-1 ring-indigo-100">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs font-black text-slate-800 uppercase tracking-wide">This Week</p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Mon – Today</p>
              </div>
            </div>
            <div className="flex items-center gap-3 md:gap-4 flex-1 max-w-md">
              <div className="flex-1 relative">
                <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((thisWeekHours / 48) * 100, 100)}%` }}
                    transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
                    className={cn(
                      "h-full rounded-full bg-gradient-to-r",
                      thisWeekHours >= 48 ? "from-emerald-400 to-emerald-500" : "from-indigo-500 to-purple-500"
                    )}
                  />
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-sm font-black text-foreground">{formatDuration(thisWeekHours)}</span>
                <span className="text-[10px] font-bold text-muted-foreground ml-1">/ 48h</span>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* ── Main Table Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.4 }}
      >
        <Card className="border-border/80 rounded-xl shadow-sm overflow-hidden bg-background">
          {/* Toolbar: filter tabs + search */}
          <CardHeader className="border-b border-border py-0 px-0">
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 p-5 pb-0">
              {/* Search, Manager, and Project filter */}
              <div className="flex flex-col sm:flex-row flex-wrap items-center gap-3 w-full xl:w-auto">
                <div className="relative w-full sm:w-64 shrink-0">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by task, date..."
                    className="pl-9 h-10 rounded-xl border-border bg-muted/30 text-sm focus-visible:ring-ring/20 focus-visible:border-indigo-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 w-full sm:flex sm:flex-row sm:w-auto">
                  <div className="w-full sm:w-[160px] lg:w-[200px] shrink-0">
                    <Select value={activeManagerFilter} onValueChange={(v: any) => setActiveManagerFilter(v)}>
                      <SelectTrigger className="w-full h-10 rounded-xl border-border bg-muted/30 text-[10px] sm:text-xs font-bold text-foreground text-left min-w-0 overflow-hidden">
                        <SelectValue placeholder="All Manager" className="truncate" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-border shadow-xl max-h-[300px] w-[90vw] sm:w-[250px]">
                        <SelectItem value="All Manager" className="text-xs font-medium">All Manager</SelectItem>
                        {uniqueManagers.map(m => (
                          <SelectItem key={m} value={m} className="text-xs font-medium">
                            {m}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="w-full sm:w-[240px] lg:w-[280px] shrink-0">
                    <Select value={activeProjectFilter} onValueChange={(v: any) => setActiveProjectFilter(v)}>
                      <SelectTrigger className="w-full h-10 rounded-xl border-border bg-muted/30 text-[10px] sm:text-xs font-bold text-foreground text-left min-w-0 overflow-hidden">
                        <SelectValue placeholder="All Projects" className="truncate" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-border shadow-xl max-h-[300px] w-[90vw] sm:w-[350px]">
                        <SelectItem value="All Projects" className="text-xs font-medium">All Projects</SelectItem>
                        {uniqueProjects.map(p => (
                          <SelectItem key={p.id} value={p.id} className="text-xs font-medium" title={p.label}>
                            <span className="block whitespace-normal break-words leading-relaxed py-0.5">{p.label}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Filter tabs */}
              <div className="flex items-center gap-1 bg-slate-100/80 p-0.5 rounded-lg overflow-x-auto scrollbar-hide border border-border/50 shadow-sm shrink-0">
                {filterTabs.map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveFilter(tab.key)}
                    className={cn(
                      "flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[9px] font-bold uppercase tracking-wider transition-all duration-200 whitespace-nowrap shrink-0",
                      activeFilter === tab.key
                        ? tab.activeColor
                        : "text-muted-foreground hover:text-muted-foreground hover:bg-white/80"
                    )}
                  >
                    {tab.label}
                    <span className={cn(
                      "text-[8px] font-black px-1 py-0.5 rounded transition-colors",
                      activeFilter === tab.key ? "bg-white/20" : "bg-slate-200/80"
                    )}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            {/* Subtle divider line below toolbar */}
            <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent mt-4" />
          </CardHeader>

          <CardContent className="p-0 overflow-x-auto">
            <Table className="min-w-[700px]">
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-12" />
                  <TableHead>Date</TableHead>
                  <TableHead>Attendance</TableHead>
                  <TableHead>Tasks</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleDays.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-20 text-center">
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center gap-4"
                      >
                        <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-muted">
                          <FileText className="h-7 w-7 text-slate-300" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-muted-foreground uppercase tracking-wide">No timesheets found</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {searchTerm || activeFilter !== 'all'
                              ? 'Try adjusting your search or filters'
                              : 'Click "New Entry" to log your first timesheet'}
                          </p>
                        </div>
                        {!searchTerm && activeFilter === 'all' && (
                          <Button
                            onClick={() => setIsAddDialogOpen(true)}
                            className="mt-2 bg-primary hover:bg-indigo-700 text-white rounded-xl h-10 px-6 text-[10px] font-black uppercase tracking-widest"
                          >
                            <Plus className="mr-1.5 h-3.5 w-3.5" /> Create Entry
                          </Button>
                        )}
                      </motion.div>
                    </TableCell>
                  </TableRow>
                ) : (
                  visibleDays.map((d, dayIdx) => {
                    const dayTasks = byDate[d] || [];
                    const firstTask = dayTasks[0];
                    const totalHoursOfDay = dayTasks.reduce((sum, t) => sum + (t.hours || 0), 0);
                    const attendance = firstTask?.attendance || 'full-day';
                    const status = firstTask?.status || 'pending';
                    const isExpanded = !!expandedDays[d];

                    return (
                      <React.Fragment key={d}>
                        <motion.tr 
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: dayIdx * 0.04 }}
                          className={cn(
                            "group border-b border-border/80 transition-all duration-200 cursor-pointer",
                            isExpanded
                              ? "bg-indigo-50/30 border-l-[3px] border-l-indigo-500"
                              : "hover:bg-slate-50/60 border-l-[3px] border-l-transparent hover:border-l-slate-300"
                          )}
                          onClick={() => setExpandedDays(prev => ({ ...prev, [d]: !prev[d] }))}
                        >
                          <TableCell className="pl-5 py-5 text-center">
                            <motion.div
                              animate={{ rotate: isExpanded ? 180 : 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <ChevronDown className={cn(
                                "h-4 w-4 transition-colors",
                                isExpanded ? "text-primary" : "text-slate-300 group-hover:text-muted-foreground"
                              )} />
                            </motion.div>
                          </TableCell>

                          <TableCell className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "flex h-10 w-10 items-center justify-center rounded-xl text-xs font-black shrink-0 transition-colors",
                                isExpanded
                                  ? "bg-indigo-100 text-indigo-700"
                                  : "bg-muted text-muted-foreground group-hover:bg-slate-200"
                              )}>
                                {new Date(d).getDate()}
                              </div>
                              <div className="flex flex-col">
                                <span className="text-xs font-black text-slate-800">
                                  {new Date(d).toLocaleDateString('en-IN', { weekday: 'short', month: 'short' })}
                                </span>
                                <span className="text-[10px] font-bold text-muted-foreground">
                                  {new Date(d).toLocaleDateString('en-IN', { year: 'numeric' })}
                                </span>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell className="px-6 py-5">
                            <Badge className={cn(
                              "border-none font-black text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-lg",
                              attendanceBadgeStyle(attendance)
                            )}>
                              {attendance ? attendance.replace(/-/g, ' ') : 'Full Day'}
                            </Badge>
                          </TableCell>

                          <TableCell className="px-6 py-5">
                            <div className="flex items-center gap-2">
                              <div className="flex -space-x-1">
                                {dayTasks.slice(0, 3).map((_, i) => (
                                  <div key={i} className={cn(
                                    "h-5 w-5 rounded-full ring-2 ring-white flex items-center justify-center text-[7px] font-black text-white",
                                    i === 0 ? "bg-indigo-400" : i === 1 ? "bg-purple-400" : "bg-pink-400"
                                  )}>
                                    {i + 1}
                                  </div>
                                ))}
                                {dayTasks.length > 3 && (
                                  <div className="h-5 w-5 rounded-full ring-2 ring-white bg-slate-200 flex items-center justify-center text-[7px] font-black text-muted-foreground">
                                    +{dayTasks.length - 3}
                                  </div>
                                )}
                              </div>
                              <span className="text-[10px] font-bold text-muted-foreground">
                                {dayTasks.length} {dayTasks.length === 1 ? 'task' : 'tasks'}
                              </span>
                            </div>
                          </TableCell>

                          <TableCell className="px-6 py-5">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-black text-foreground">{formatDuration(totalHoursOfDay)}</span>
                              {totalHoursOfDay > 8 && (
                                <Badge className="bg-amber-100 text-amber-700 border-none font-black text-[8px] uppercase tracking-widest px-1.5 py-0.5 rounded-md">OT</Badge>
                              )}
                            </div>
                            {/* Mini progress bar */}
                            <div className="h-1 w-20 bg-muted rounded-full mt-1.5 overflow-hidden">
                              <div
                                className={cn(
                                  "h-full rounded-full transition-all",
                                  totalHoursOfDay >= 8 ? "bg-emerald-400" : "bg-indigo-400"
                                )}
                                style={{ width: `${Math.min((totalHoursOfDay / 8) * 100, 100)}%` }}
                              />
                            </div>
                          </TableCell>

                          <TableCell className="px-6 py-5">
                            <Badge className={cn(
                              "text-[9px] uppercase font-black px-3 py-1 rounded-lg border-none",
                              statusBadgeStyle(status)
                            )}>
                              {status}
                            </Badge>
                          </TableCell>

                          <TableCell className="text-right w-[50px]" onClick={(e) => e.stopPropagation()}>
                            {status === 'pending' ? (
                              <DropdownMenu>
                                <DropdownMenuTrigger className="h-8 w-8 p-0 inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground">
                                    <span className="sr-only">Open menu</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem 
                                    onClick={() => {
                                      setEditDate(d);
                                      setIsAddDialogOpen(true);
                                    }}
                                    className="cursor-pointer"
                                  >
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            ) : (
                              <span className="text-[10px] font-medium text-muted-foreground">—</span>
                            )}
                          </TableCell>
                        </motion.tr>

                        {/* ── Expanded Task Details ── */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.tr
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="border-none"
                            >
                              <TableCell colSpan={7} className="p-0">
                                <motion.div
                                  initial={{ opacity: 0, y: -8 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -8 }}
                                  transition={{ duration: 0.25 }}
                                  className="px-6 py-5 bg-gradient-to-b from-slate-50/80 to-white"
                                >
                                  <div className="bg-background rounded-xl border border-border/80 shadow-sm overflow-hidden">
                                    {/* Details header */}
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-4 py-3 md:px-5 bg-slate-50/60 border-b border-border">
                                      <div className="flex items-center gap-2">
                                        <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">
                                          Task Breakdown
                                        </span>
                                        {firstTask?.feedback && (
                                          <Popover>
                                            <PopoverTrigger className="ml-2 inline-flex items-center gap-1 px-2 py-1 rounded-md bg-indigo-50 hover:bg-indigo-100 transition-colors focus:outline-none ring-1 ring-indigo-100">
                                              <MessageSquare className="h-3 w-3 text-indigo-500" />
                                              <span className="text-[9px] font-black text-primary uppercase tracking-wider">View Feedback</span>
                                            </PopoverTrigger>
                                            <PopoverContent
                                              className="w-80 p-0 rounded-xl bg-background border border-border shadow-2xl overflow-hidden"
                                              align="start"
                                              side="bottom"
                                            >
                                              <div className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white">
                                                <MessageSquare className="h-3.5 w-3.5 flex-shrink-0" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Admin Feedback</span>
                                              </div>
                                              <div className="px-4 py-3 max-h-[200px] overflow-y-auto">
                                                <p className="text-xs font-medium text-muted-foreground leading-relaxed break-words whitespace-pre-wrap">
                                                  {firstTask.feedback}
                                                </p>
                                              </div>
                                            </PopoverContent>
                                          </Popover>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2 flex-wrap">
                                        {(attendance === 'late-arrival' || attendance === 'early-arrival') && firstTask?.arrival_time && (
                                          <Badge className="bg-purple-50 text-purple-700 border-none text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ring-1 ring-purple-200/50 flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            Arrival: {firstTask.arrival_time}
                                          </Badge>
                                        )}
                                        {attendance === 'half-day' && firstTask?.half_day_period && (
                                          <Badge className="bg-amber-50 text-amber-700 border-none text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ring-1 ring-amber-200/50 flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {firstTask.half_day_period}
                                          </Badge>
                                        )}
                                      </div>
                                    </div>

                                    {/* Task cards */}
                                    <div className="divide-y divide-slate-100">
                                      {dayTasks.map((task, taskIdx) => (
                                        <motion.div
                                          key={task.id}
                                          initial={{ opacity: 0, x: -6 }}
                                          animate={{ opacity: 1, x: 0 }}
                                          transition={{ duration: 0.2, delay: taskIdx * 0.05 }}
                                          className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4 px-4 py-3 md:px-5 md:py-4 hover:bg-slate-50/40 transition-colors group/task"
                                        >
                                          {/* Task number indicator */}
                                          <div className={cn(
                                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[10px] font-black mt-0.5",
                                            taskIdx === 0 ? "bg-indigo-100 text-primary" :
                                            taskIdx === 1 ? "bg-purple-100 text-purple-600" :
                                            taskIdx === 2 ? "bg-pink-100 text-pink-600" :
                                            "bg-muted text-muted-foreground"
                                          )}>
                                            #{taskIdx + 1}
                                          </div>

                                          {/* Task content */}
                                          <div className="flex-1 min-w-0">
                                            <div className="flex flex-col sm:flex-row items-start justify-between gap-2 sm:gap-4 w-full">
                                              <div className="min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                  <span className="text-xs font-black text-foreground">{task.task_title || '—'}</span>
                                                  <Badge className="bg-muted text-muted-foreground border-none text-[8px] font-bold uppercase tracking-widest px-1.5 py-0 rounded">
                                                    {task.project_name || task.category || 'Other Work'}
                                                  </Badge>
                                                  {task.is_unassigned_project && (
                                                    <Badge variant="outline" className="text-[8px] font-bold text-amber-600 bg-amber-50 border-amber-200 uppercase tracking-widest px-1 py-0 shadow-none h-4 rounded">
                                                      Unassigned
                                                    </Badge>
                                                  )}
                                                </div>
                                                  <ExpandableText text={task.description} />
                                              </div>
                                              <span className="text-xs font-black text-slate-800 shrink-0 bg-muted/30 px-2.5 py-1 rounded-lg ring-1 ring-slate-100">
                                                {formatDuration(task.hours || 0)}
                                              </span>
                                            </div>

                                            {/* Task meta row */}
                                            <div className="flex items-center gap-3 mt-2.5 flex-wrap">
                                              {task.attachment_path && (
                                                <button
                                                  onClick={() => window.open(`/employee/timesheets/view-doc?id=${task.id}`, '_blank')}
                                                  className="inline-flex items-center gap-1 text-[10px] font-bold text-primary hover:text-indigo-800 transition-colors hover:underline"
                                                >
                                                  <Paperclip className="h-3 w-3" />
                                                  <span className="max-w-[100px] truncate">{task.attachment_name || 'Attachment'}</span>
                                                </button>
                                              )}
                                            </div>
                                          </div>
                                        </motion.div>
                                      ))}
                                    </div>
                                  </div>
                                </motion.div>
                              </TableCell>
                            </motion.tr>
                          )}
                        </AnimatePresence>
                      </React.Fragment>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>

          {/* Pagination footer */}
          {totalItems > itemsPerPage && (
            <div className="p-5 border-t border-border bg-slate-50/30 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-sm font-medium text-muted-foreground text-center md:text-left">
                {totalItems > 0 && (
                  <>
                    Showing page {currentPage} of {totalPages} · {totalItems} total entries
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  variant="outline"
                  className="border-border text-muted-foreground rounded-xl h-9 px-4 font-black text-[10px] uppercase tracking-widest transition-all hover:bg-muted active:scale-95 disabled:opacity-50"
                >
                  Previous
                </Button>
                
                <div className="flex items-center gap-1 mx-2">
                  {(() => {
                    const pages = [];
                    if (totalPages <= 5) {
                      for (let i = 1; i <= totalPages; i++) pages.push(i);
                    } else {
                      if (currentPage <= 3) {
                        pages.push(1, 2, 3, 4, '...', totalPages);
                      } else if (currentPage >= totalPages - 2) {
                        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
                      } else {
                        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
                      }
                    }
                    return pages.map((page, idx) => (
                      page === '...' ? (
                        <span key={`ellipsis-${idx}`} className="px-2 text-muted-foreground font-bold tracking-widest">...</span>
                      ) : (
                        <Button
                          key={page}
                          onClick={() => setCurrentPage(page as number)}
                          variant={currentPage === page ? "default" : "ghost"}
                          className={cn(
                            "h-8 w-8 p-0 rounded-lg text-xs font-bold transition-all shrink-0",
                            currentPage === page 
                              ? "bg-primary text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 hover:text-white" 
                              : "text-muted-foreground hover:bg-slate-200 hover:text-foreground"
                          )}
                        >
                          {page}
                        </Button>
                      )
                    ));
                  })()}
                </div>

                <Button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="bg-slate-900 text-white hover:bg-slate-800 rounded-xl h-9 px-4 font-black text-[10px] uppercase tracking-widest transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-95 disabled:opacity-50"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>
      </motion.div>
      
      <FillTimesheetDialog 
        isOpen={isAddDialogOpen}
        onClose={() => { setIsAddDialogOpen(false); setEditDate(null); }}
        onSuccess={() => setRefreshTrigger(prev => prev + 1)}
        editDate={editDate}
      />
    </div>
  );
}
