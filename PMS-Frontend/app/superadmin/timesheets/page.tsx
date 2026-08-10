'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  Check, 
  X, 
  Clock, 
  Calendar as CalendarIcon, 
  Search, 
  TrendingUp,
  History,
  ChevronRight,
  MessageSquare,
  FileText,
  Paperclip,
  ShieldCheck,
  Sparkles,
  Timer,
  Layers,
  Eye,
  Download,
  MoreHorizontal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { KPIStatCard } from '@/components/ui/KPIStatCard';
import { AnalyticsLayout } from '@/components/layout/AnalyticsLayout';
import { EmptyState } from '@/components/ui/EmptyState';
import { FilterGroup } from '@/components/ui/filter-group';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import api from '@/services/api';
import { handleApiError } from '@/utils/handleApiError';
import { ErrorState } from '@/components/ui/error-state';
import { useAuthStore } from '@/store/authStore';
import { useWebSocketEvent } from '@/hooks/useWebSocketEvent';
import { DocumentViewerModal } from '@/components/documents/DocumentViewerModal';

type TaskDetail = {
  id: number;
  task_title: string;
  description: string;
  hours: number;
  task_status: string;
  project_name: string;
  project_code: string | null;
  is_unassigned_project?: boolean;
  day: string;
  status: string;
  feedback: string | null;
  attachment_path: string | null;
  attachment_name: string | null;
};

type GroupedTimesheet = {
  user_id: number;
  user_name: string;
  user_email: string;
  user_designation: string; user_company_name?: string;
  date: string;
  total_hours: number;
  task_count: number;
  attendance: string;
  arrival_time?: string | null;
  half_day_period?: string | null;
  tasks: TaskDetail[];
};

export default function TimesheetApprovalPage() {
  const { token } = useAuthStore();
  const [pendingGroups, setPendingGroups] = useState<GroupedTimesheet[]>([]);
  const [tableGroups, setTableGroups] = useState<GroupedTimesheet[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<GroupedTimesheet | null>(null);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerDocId, setViewerDocId] = useState<number | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const pageSize = 10;

  const [yearFilter, setYearFilter] = useState<string>('All Years');
  const [monthFilter, setMonthFilter] = useState<string>('All Months');
  const [dateFilter, setDateFilter] = useState<string>('All Dates');

  useEffect(() => {
    setDateFilter('All Dates');
  }, [yearFilter, monthFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, yearFilter, monthFilter, dateFilter]);

  useWebSocketEvent('TIMESHEETS_UPDATED', () => setRefreshTrigger(prev => prev + 1));

  // Fetch only pending for stats
  useEffect(() => {
    if (token) {
      api.get(`/timesheets/grouped?status=pending`).then(res => setPendingGroups(res.data)).catch(console.error);
    }
  }, [token, refreshTrigger]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    if (token) {
      setIsLoading(true);
      api.get(`/timesheets/grouped/paginated`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { 
          page: currentPage, 
          size: pageSize, 
          status: statusFilter, 
          search: debouncedSearch,
          ...(yearFilter !== 'All Years' && { year: yearFilter }),
          ...(monthFilter !== 'All Months' && { month: monthFilter }),
          ...(dateFilter !== 'All Dates' && { date: dateFilter })
        }
      })
      .then(res => {
        setTableGroups(res.data.items || []);
        setTotalItems(res.data.total || 0);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
    }
  }, [token, refreshTrigger, currentPage, debouncedSearch, statusFilter, yearFilter, monthFilter, dateFilter]);

  const formatDuration = (decimal: number) => {
    const h = Math.floor(decimal);
    const m = Math.round((decimal - h) * 60);
    return `${h}h ${m}m`;
  };

  const handleDownloadAttachment = async (timesheetId: number, filename: string) => {
    try {
      const res = await api.get(
        `/timesheets/download-attachment/${timesheetId}?inline=false`
      );
      if (res.data.url) {
        const a = document.createElement('a');
        a.href = res.data.url;
        a.download = filename || 'attachment';
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (e) {
      toast.error('Failed to download attachment');
    }
  };

  const handleDownloadExcel = async (date: string, userId: string | number, userName?: string) => {
    try {
      const res = await api.get(`/timesheets/export/excel?date=${date}&user_id=${userId}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      const safeName = userName ? userName.replace(/\s+/g, '_') : 'Employee';
      link.setAttribute('download', `timesheet_${safeName}_${date}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (e) {
      console.error(e);
      toast.error('Failed to download Excel file');
    }
  };


  const handleBulkAction = async (action: 'approved' | 'rejected') => {
    if (!selectedGroup) return;
    if (!feedback.trim()) {
      toast.error(`Feedback is required to ${action} the timesheet.`);
      return;
    }
    
    setIsSubmitting(true);
    try {
      await api.patch(`/timesheets/bulk-status`, {
        user_id: selectedGroup.user_id,
        date: selectedGroup.date,
        status: action,
        feedback: feedback.trim()
      });
      toast.success(`Timesheet ${action} for ${selectedGroup.user_name}`);
      setSelectedGroup(null);
      setFeedback('');
      setRefreshTrigger(prev => prev + 1);
    } catch (e) {
      toast.error('Failed to update status');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalPendingHours = pendingGroups.reduce((acc, g) => acc + g.total_hours, 0);
  const totalTasks = pendingGroups.reduce((acc, g) => acc + g.task_count, 0);
  const uniqueEmployees = new Set(pendingGroups.map(g => g.user_id)).size;

  const attendanceBadgeStyle = (att: string) => {
    switch (att) {
      case 'full-day':
      case 'wfh-full-day': return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/50';
      case 'half-day':
      case 'wfh-half-day': return 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/50';
      case 'late-arrival': return 'bg-purple-50 text-purple-700 ring-1 ring-purple-200/50';
      case 'early-arrival': return 'bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200/50';
      case 'leave': return 'bg-red-50 text-red-700 ring-1 ring-red-200/50';
      case 'public-holiday': return 'bg-blue-50 text-blue-700 ring-1 ring-blue-200/50';
      default: return 'bg-muted/30 text-muted-foreground ring-1 ring-slate-200/50';
    }
  };

  // Generate Options for Date/Month/Year
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());
  }, []);

  const monthOptions = useMemo(() => [
    { value: '1', label: 'January' }, { value: '2', label: 'February' },
    { value: '3', label: 'March' }, { value: '4', label: 'April' },
    { value: '5', label: 'May' }, { value: '6', label: 'June' },
    { value: '7', label: 'July' }, { value: '8', label: 'August' },
    { value: '9', label: 'September' }, { value: '10', label: 'October' },
    { value: '11', label: 'November' }, { value: '12', label: 'December' }
  ], []);

  const dateOptions = useMemo(() => {
    const options = [];
    const today = new Date();
    
    if (yearFilter !== 'All Years' && monthFilter !== 'All Months') {
      const y = parseInt(yearFilter);
      const m = parseInt(monthFilter);
      const daysInMonth = new Date(y, m, 0).getDate();
      for (let i = daysInMonth; i >= 1; i--) {
        const d = new Date(y, m - 1, i);
        options.push({
          value: d.toISOString().split('T')[0],
          label: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        });
      }
    } else {
      for (let i = 0; i < 30; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        options.push({
          value: d.toISOString().split('T')[0],
          label: i === 0 ? `Today, ${d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}` : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        });
      }
    }
    return options;
  }, [yearFilter, monthFilter]);

  return (
    <>
      <AnalyticsLayout
        title="Timesheets"
        description="Review, approve, or reject employee timesheet submissions"
        headerActions={
          pendingGroups.length > 0 && (
            <div className="flex items-center gap-2 bg-amber-50 rounded-lg px-3 py-1.5 border border-amber-200">
              <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-xs font-medium text-amber-700">
                {pendingGroups.length} awaiting review
              </span>
            </div>
          )
        }
        kpiSection={
          <>
            <KPIStatCard
              title="Pending Review"
              value={pendingGroups.length.toString()}
              icon={Clock}
            />
            <KPIStatCard
              title="Total Hours"
              value={formatDuration(totalPendingHours)}
              icon={Timer}
            />
            <KPIStatCard
              title="Total Tasks"
              value={totalTasks.toString()}
              icon={FileText}
            />
          </>
        }
        dataSection={
          <>
            <DataTable
              data={tableGroups}
              isLoading={isLoading}
              searchPlaceholder="Search employees..."
              searchValue={searchTerm}
              onSearchChange={(value) => setSearchTerm(value)}
              filters={
                <div className="flex flex-col sm:flex-row flex-wrap items-center gap-3">
                  <FilterGroup
                    options={[
                      { label: 'All', value: 'all' },
                      { label: 'Pending', value: 'pending' },
                      { label: 'Approved', value: 'approved' },
                      { label: 'Rejected', value: 'rejected' }
                    ]}
                    value={statusFilter}
                    onChange={(val) => { setStatusFilter(val); setCurrentPage(1); }}
                  />

                  <div className="flex items-center gap-2">
                    <Select value={yearFilter} onValueChange={setYearFilter}>
                      <SelectTrigger className="w-[110px] h-9 rounded-xl border-border bg-muted/30 text-xs font-medium text-foreground">
                        <SelectValue placeholder="All Years" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-border shadow-xl">
                        <SelectItem value="All Years" className="text-xs font-medium">All Years</SelectItem>
                        {yearOptions.map(y => (
                          <SelectItem key={y} value={y} className="text-xs font-medium">{y}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={monthFilter} onValueChange={setMonthFilter}>
                      <SelectTrigger className="w-[120px] h-9 rounded-xl border-border bg-muted/30 text-xs font-medium text-foreground">
                        <SelectValue placeholder="All Months" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-border shadow-xl max-h-[300px]">
                        <SelectItem value="All Months" className="text-xs font-medium">All Months</SelectItem>
                        {monthOptions.map(m => (
                          <SelectItem key={m.value} value={m.value} className="text-xs font-medium">{m.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={dateFilter} onValueChange={setDateFilter}>
                      <SelectTrigger className="w-[140px] h-9 rounded-xl border-border bg-muted/30 text-xs font-medium text-foreground">
                        <SelectValue placeholder="All Dates" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-border shadow-xl max-h-[300px]">
                        <SelectItem value="All Dates" className="text-xs font-medium">All Dates</SelectItem>
                        {dateOptions.map(d => (
                          <SelectItem key={d.value} value={d.value} className="text-xs font-medium">{d.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              }
              toolbarActions={
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">All Timesheets</span>
                  <Badge variant="secondary" className="bg-slate-200 dark:bg-slate-800 text-muted-foreground rounded-md px-2 font-medium">
                    {totalItems}
                  </Badge>
                </div>
              }
              emptyState={
                <EmptyState 
                  icon={History}
                  title="No Timesheets Found"
                  description={searchTerm || statusFilter !== 'all' ? 'Try adjusting your filters' : 'No timesheets have been submitted yet.'}
                  className="min-h-[400px]"
                />
              }
              onRowClick={(group) => { setSelectedGroup(group); setFeedback(''); }}
              pagination={{
                currentPage,
                totalPages: Math.ceil(totalItems / pageSize),
                onPageChange: setCurrentPage,
                totalItems,
                pageSize
              }}
              columns={[
                {
                  header: 'Team Member',
                  accessorKey: 'user_name',
                  sortable: true,
                  cell: (group) => (
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs bg-muted text-slate-600 font-medium border border-border">
                          {group.user_name ? group.user_name.substring(0, 2).toUpperCase() : 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-foreground">{group.user_name}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-muted-foreground">{group.user_designation || group.user_email}</span>
                          {group.user_company_name && (
                            <Badge variant="outline" className="text-[9px] uppercase tracking-wider text-indigo-500 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-900/30 px-1 py-0">
                              {group.user_company_name}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                },
                {
                  header: 'Date',
                  accessorKey: 'date',
                  sortable: true,
                  cell: (group) => (
                    <span className="text-sm text-muted-foreground font-medium">
                      {new Date(group.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  )
                },
                {
                  header: 'Attendance',
                  accessorKey: 'attendance',
                  sortable: true,
                  hideOnMobile: true,
                  cell: (group) => (
                    <Badge variant="outline" className={cn(
                      "font-medium text-xs px-2 py-0.5 rounded-md capitalize",
                      attendanceBadgeStyle(group.attendance)
                    )}>
                      {group.attendance ? group.attendance.replace('wfh-', 'WFH ').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Full Day'}
                    </Badge>
                  )
                },
                {
                  header: 'Status',
                  accessorKey: 'status',
                  sortable: true,
                  cell: (group) => {
                    const status = group.tasks[0]?.status || 'pending';
                    return (
                      <Badge variant="secondary" className={cn(
                        "font-medium text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md",
                        status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                        status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-amber-100 text-amber-700'
                      )}>
                        {status}
                      </Badge>
                    );
                  }
                },
                {
                  header: 'Duration',
                  accessorKey: 'total_hours',
                  sortable: true,
                  hideOnMobile: true,
                  cell: (group) => (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">{formatDuration(group.total_hours)}</span>
                      {group.total_hours > 8 && (
                        <Badge variant="secondary" className="bg-amber-100 text-amber-700 px-1.5 py-0 rounded text-[10px] font-semibold">OT</Badge>
                      )}
                    </div>
                  )
                },
                {
                  header: 'Actions',
                  align: 'right',
                  width: '50px',
                  cell: (group) => (
                    <div onClick={(e) => e.stopPropagation()} className="flex items-center justify-end ">
                      <DropdownMenu>
                        <DropdownMenuTrigger className="h-8 w-8 p-0 inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground" onClick={(e) => e.stopPropagation()}>
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedGroup(group);
                              setFeedback('');
                            }}
                            className="cursor-pointer"
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Review
                          </DropdownMenuItem>
                           <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownloadExcel(group.date, group.user_id, group.user_name);
                              }}
                              className="cursor-pointer"
                            >
                              <Download className="mr-2 h-4 w-4" />
                              Download Excel
                            </DropdownMenuItem>

                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )
                }
              ]}
            />
    </>
  }
/>

      {/* â”€â”€ Detail Modal â”€â”€ */}
      <AnimatePresence>
        {selectedGroup && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={() => setSelectedGroup(null)}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 10 }}
              transition={{ duration: 0.2 }}
              className="bg-background rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="border-b border-border px-6 py-5 bg-background shrink-0">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12 border border-border">
                      <AvatarFallback className="text-sm font-medium bg-muted text-muted-foreground">
                        {selectedGroup.user_name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">{selectedGroup.user_name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-slate-500 dark:text-slate-300">{selectedGroup.user_designation || selectedGroup.user_email}</span>
                        <span className="text-slate-300 dark:text-slate-500">•</span>
                        <span className="text-sm text-slate-500 dark:text-slate-300">
                          {new Date(selectedGroup.date).toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end">
                      <div className="text-2xl font-bold text-foreground leading-none">{formatDuration(selectedGroup.total_hours)}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-300 font-medium mt-1">Total Hours</div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setSelectedGroup(null)} className="h-8 w-8 text-muted-foreground hover:text-slate-600">
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Task Cards (Scrollable) */}
              <div className="p-6 overflow-y-auto bg-slate-50/50 dark:bg-transparent flex-grow">
                <div className="flex items-center gap-2 mb-4">
                  <h4 className="text-sm font-semibold text-foreground">Task Details</h4>
                  <Badge variant="secondary" className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-md px-1.5 py-0.5 text-xs font-medium">
                    {selectedGroup.task_count}
                  </Badge>
                </div>

                <div className="space-y-3">
                  {selectedGroup.tasks.map((task) => (
                    <div
                      key={task.id}
                      className="bg-background rounded-lg border border-border p-4 shadow-sm"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row items-start justify-between gap-2 sm:gap-4">
                            <div className="min-w-0 space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-semibold text-foreground">{task.task_title || '—'}</span>
                                <Badge variant="outline" className="bg-muted/30 text-slate-600 dark:text-slate-100 text-xs font-medium px-2 py-0">
                                  {task.project_code ? `[${task.project_code}]` : ''} {task.project_name}
                                </Badge>
                                {task.is_unassigned_project && (
                                  <Badge variant="outline" className="text-[10px] font-bold text-amber-600 bg-amber-50 border-amber-200 uppercase tracking-widest px-2 py-0">
                                    Unassigned Project
                                  </Badge>
                                )}
                                <Badge variant="secondary" className={cn(
                                  "text-xs font-medium px-2 py-0 capitalize",
                                  task.task_status === 'Completed' ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" : "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                                )}>
                                  {task.task_status}
                                </Badge>
                              </div>
                              <p className="text-sm text-slate-600 dark:text-slate-200 leading-relaxed whitespace-pre-wrap break-words">
                                {task.description || '—'}
                              </p>
                            </div>
                            <span className="text-sm font-medium text-foreground shrink-0 bg-muted px-2 py-1 rounded-md">
                              {formatDuration(task.hours)}
                            </span>
                          </div>

                          {task.attachment_path && (
                            <div className="mt-3 flex items-center gap-2">
                              <span className="text-xs text-slate-500 dark:text-slate-300 flex items-center gap-1.5 bg-muted/30 px-2 py-1 rounded-md border border-border w-fit">
                                <Paperclip className="h-3.5 w-3.5 text-slate-400 dark:text-slate-300" />
                                <span className="truncate max-w-[150px]">{task.attachment_name || 'Attachment'}</span>
                              </span>
                              <div className="flex gap-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 px-2 border-border text-slate-600 dark:text-slate-300 hover:text-primary bg-background"
                                  onClick={(e) => { e.stopPropagation(); setViewerDocId(task.id); setViewerOpen(true); }}
                                >
                                  <Eye className="h-3.5 w-3.5 mr-1" /> View
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 px-2 border-border text-slate-600 dark:text-slate-300 hover:text-primary bg-background"
                                  onClick={(e) => { e.stopPropagation(); handleDownloadAttachment(task.id, task.attachment_name || 'attachment'); }}
                                >
                                  <Download className="h-3.5 w-3.5 mr-1" /> Download
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Feedback + Actions */}
              {selectedGroup.tasks[0]?.status === 'pending' ? (
                <div className="p-6 border-t border-border bg-background shrink-0">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-muted-foreground dark:text-slate-300">Feedback <span className="text-muted-foreground dark:text-slate-400 font-normal">(Required)</span></span>
                    </div>
                    <textarea
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="Leave feedback for the employee..."
                      className="w-full min-h-[80px] bg-background border border-border rounded-lg p-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none placeholder:text-muted-foreground"
                    />
                    <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
                      <Button
                        variant="outline"
                        onClick={() => setSelectedGroup(null)}
                        className="h-9 px-4 rounded-md border-border text-slate-600 dark:text-slate-300 font-medium text-sm hover:bg-muted"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => handleBulkAction('rejected')}
                        disabled={isSubmitting}
                        className="h-9 px-4 rounded-md bg-red-600 hover:bg-red-700 text-white font-medium text-sm transition-all shadow-sm"
                      >
                        Reject All
                      </Button>
                      <Button
                        onClick={() => handleBulkAction('approved')}
                        disabled={isSubmitting}
                        className="h-9 px-4 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm transition-all shadow-sm"
                      >
                        Approve All
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 border-t border-border bg-muted/30 shrink-0">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-muted-foreground dark:text-slate-300">Resolution Status:</span>
                      <Badge variant="secondary" className={cn(
                        "font-medium text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md",
                        selectedGroup.tasks[0]?.status === 'approved' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                      )}>
                        {selectedGroup.tasks[0]?.status}
                      </Badge>
                    </div>
                    {selectedGroup.tasks[0]?.feedback && (
                      <div className="text-sm text-slate-600 dark:text-slate-200 bg-background p-3 rounded-md border border-border break-words whitespace-pre-wrap">
                        <span className="font-semibold text-foreground block mb-1">Feedback Given:</span>
                        {selectedGroup.tasks[0].feedback}
                      </div>
                    )}
                    <div className="flex justify-end pt-2">
                      <Button
                        variant="outline"
                        onClick={() => setSelectedGroup(null)}
                        className="h-9 px-4 rounded-md border-border text-slate-600 dark:text-slate-300 font-medium text-sm hover:bg-muted"
                      >
                        Close
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <DocumentViewerModal isOpen={viewerOpen} onClose={() => setViewerOpen(false)} docId={viewerDocId} docType="timesheet" />
    </>
  );
}
