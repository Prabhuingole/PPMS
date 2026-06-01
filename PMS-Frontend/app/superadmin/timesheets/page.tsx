'use client';

import { useState, useEffect } from 'react';
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
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

import axios from 'axios';
import { useAuthStore } from '@/store/authStore';
import { useWebSocketEvent } from '@/hooks/useWebSocketEvent';

type TaskDetail = {
  id: number;
  task_title: string;
  description: string;
  hours: number;
  task_status: string;
  project_name: string;
  project_code: string | null;
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
  user_designation: string;
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
  const [groups, setGroups] = useState<GroupedTimesheet[]>([]);
  const [historyGroups, setHistoryGroups] = useState<GroupedTimesheet[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<GroupedTimesheet | null>(null);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [searchTerm, setSearchTerm] = useState('');
  const [visibleCount, setVisibleCount] = useState(5);
  
  const [historySearchTerm, setHistorySearchTerm] = useState('');
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [debouncedHistorySearch, setDebouncedHistorySearch] = useState('');
  const historyPageSize = 5;

  useWebSocketEvent('TIMESHEETS_UPDATED', () => setRefreshTrigger(prev => prev + 1));

  useEffect(() => {
    if (token) {
      axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/timesheets/grouped`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => setGroups(res.data)).catch(console.error);
    }
  }, [token, refreshTrigger]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedHistorySearch(historySearchTerm);
      setHistoryPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [historySearchTerm]);

  useEffect(() => {
    if (token) {
      setIsHistoryLoading(true);
      axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/timesheets/grouped/paginated`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { page: historyPage, size: historyPageSize, status: 'all', search: debouncedHistorySearch }
      })
      .then(res => {
        setHistoryGroups(res.data.items || []);
        setHistoryTotal(res.data.total || 0);
      })
      .catch(console.error)
      .finally(() => setIsHistoryLoading(false));
    }
  }, [token, refreshTrigger, historyPage, debouncedHistorySearch]);

  useEffect(() => {
    setVisibleCount(5);
  }, [searchTerm]);

  const formatDuration = (decimal: number) => {
    const h = Math.floor(decimal);
    const m = Math.round((decimal - h) * 60);
    return `${h}h ${m}m`;
  };



  const handleDownloadAttachment = async (timesheetId: number, filename: string) => {
    try {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/timesheets/download-attachment/${timesheetId}?inline=false`,
        { headers: { Authorization: `Bearer ${token}` } }
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

  const handleBulkAction = async (action: 'approved' | 'rejected') => {
    if (!selectedGroup) return;
    if (!feedback.trim()) {
      toast.error(`Feedback is required to ${action} the timesheet.`);
      return;
    }
    
    setIsSubmitting(true);
    try {
      await axios.patch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/timesheets/bulk-status`, {
        user_id: selectedGroup.user_id,
        date: selectedGroup.date,
        status: action,
        feedback: feedback.trim()
      }, {
        headers: { Authorization: `Bearer ${token}` }
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

  const filteredGroups = groups.filter(g => 
    g.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.user_email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const displayedGroups = filteredGroups.slice(0, visibleCount);

  const displayedHistoryGroups = historyGroups;

  const totalPendingHours = groups.reduce((acc, g) => acc + g.total_hours, 0);
  const totalTasks = groups.reduce((acc, g) => acc + g.task_count, 0);
  const uniqueEmployees = new Set(groups.map(g => g.user_id)).size;

  const attendanceBadgeStyle = (att: string) => {
    switch (att) {
      case 'full-day': return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/50';
      case 'half-day': return 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/50';
      case 'late-arrival': return 'bg-purple-50 text-purple-700 ring-1 ring-purple-200/50';
      case 'early-arrival': return 'bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200/50';
      case 'leave': return 'bg-red-50 text-red-700 ring-1 ring-red-200/50';
      case 'public-holiday': return 'bg-blue-50 text-blue-700 ring-1 ring-blue-200/50';
      default: return 'bg-slate-50 text-slate-700 ring-1 ring-slate-200/50';
    }
  };

  // Generate consistent avatar colors from name
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

  return (
    <div className="space-y-8">
      {/* ── Hero Header ── */}
      {/* ── Hero Header ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 pb-6 border-b border-slate-200">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900 flex items-center gap-2">
            Timesheet Approvals
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Review, approve, or reject employee timesheet submissions
          </p>
        </div>
        {groups.length > 0 && (
          <div className="flex items-center gap-2 bg-amber-50 rounded-lg px-3 py-1.5 border border-amber-200">
            <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-xs font-medium text-amber-700">
              {groups.length} awaiting review
            </span>
          </div>
        )}
      </div>

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Pending Review', value: groups.length, sub: 'Submissions', icon: Clock },
          { label: 'Total Hours', value: formatDuration(totalPendingHours), sub: 'Pending Hours', icon: Timer },
          { label: 'Total Tasks', value: totalTasks, sub: `${uniqueEmployees} employee${uniqueEmployees !== 1 ? 's' : ''}`, icon: FileText },
        ].map((stat, i) => (
          <div key={stat.label} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-500">{stat.label}</span>
              <stat.icon className="h-4 w-4 text-slate-400" />
            </div>
            <div className="text-2xl font-semibold text-slate-900 tracking-tight">{stat.value}</div>
            <p className="text-xs text-slate-500 mt-1">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Queue Table ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.3 }}
      >
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-900">Approval Queue</span>
              <Badge variant="secondary" className="bg-slate-100 text-slate-600 rounded-md px-2 font-medium">
                {filteredGroups.length}
              </Badge>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Search employees..." 
                className="h-9 pl-9 rounded-md border-slate-200 focus-visible:ring-1 focus-visible:ring-indigo-500 text-sm placeholder:text-slate-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-slate-200 hover:bg-transparent">
                  <TableHead className="h-10 px-4 py-2 text-xs font-medium text-slate-500">Employee</TableHead>
                  <TableHead className="h-10 px-4 py-2 text-xs font-medium text-slate-500">Date</TableHead>
                  <TableHead className="h-10 px-4 py-2 text-xs font-medium text-slate-500">Attendance</TableHead>
                  <TableHead className="h-10 px-4 py-2 text-xs font-medium text-slate-500">Tasks</TableHead>
                  <TableHead className="h-10 px-4 py-2 text-xs font-medium text-slate-500">Duration</TableHead>
                  <TableHead className="h-10 px-4 py-2 text-right" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedGroups.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-20 text-center">
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center gap-4"
                      >
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                          <History className="h-7 w-7 text-slate-300" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-400 uppercase tracking-wide">No Pending Timesheets</p>
                          <p className="text-xs text-slate-400 mt-1">
                            {searchTerm ? 'Try adjusting your search' : 'All timesheets have been reviewed. Check back later.'}
                          </p>
                        </div>
                      </motion.div>
                    </TableCell>
                  </TableRow>
                ) : (
                  displayedGroups.map((group, i) => (
                    <TableRow 
                      key={`${group.user_id}_${group.date}`}
                      className="group border-b border-slate-100 hover:bg-slate-50/50 cursor-pointer transition-colors"
                      onClick={() => { setSelectedGroup(group); setFeedback(''); }}
                    >
                      <TableCell className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs bg-slate-100 text-slate-600 font-medium border border-slate-200">
                              {group.user_name ? group.user_name.substring(0, 2).toUpperCase() : 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-slate-900">{group.user_name}</span>
                            <span className="text-xs text-slate-500">{group.user_designation || group.user_email}</span>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="px-4 py-3">
                        <span className="text-sm text-slate-700 font-medium">
                          {new Date(group.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </TableCell>

                      <TableCell className="px-4 py-3">
                        <Badge variant="outline" className={cn(
                          "font-medium text-xs px-2 py-0.5 rounded-md capitalize",
                          attendanceBadgeStyle(group.attendance)
                        )}>
                          {group.attendance ? group.attendance.replace(/-/g, ' ') : 'Full Day'}
                        </Badge>
                      </TableCell>

                      <TableCell className="px-4 py-3">
                        <span className="text-sm text-slate-600">
                          {group.task_count} {group.task_count === 1 ? 'task' : 'tasks'}
                        </span>
                      </TableCell>

                      <TableCell className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-700">{formatDuration(group.total_hours)}</span>
                          {group.total_hours > 8 && (
                            <Badge variant="secondary" className="bg-amber-100 text-amber-700 px-1.5 py-0 rounded text-[10px] font-semibold">OT</Badge>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="px-4 py-3 text-right">
                        <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-600 inline-block transition-colors" />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>


          {filteredGroups.length > 5 && (
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-xs text-slate-500 font-medium">
                Showing {displayedGroups.length} of {filteredGroups.length} pending submissions
              </span>
              <div className="flex items-center gap-3">
                {visibleCount > 5 && (
                  <Button
                    onClick={() => setVisibleCount(5)}
                    variant="outline"
                    className="border-slate-200 text-slate-700 rounded-md h-8 px-4 text-xs font-medium"
                  >
                    See Less
                  </Button>
                )}
                {visibleCount < filteredGroups.length && (
                  <Button
                    onClick={() => setVisibleCount(prev => prev + 5)}
                    className="bg-slate-900 text-white hover:bg-slate-800 rounded-md h-8 px-4 text-xs font-medium"
                  >
                    Load More
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* ── History Table ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.4 }}
      >
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border-b border-slate-200 bg-slate-50">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-900">Timesheet History</span>
              <Badge variant="secondary" className="bg-slate-200 text-slate-700 rounded-md px-2 font-medium">
                {historyTotal}
              </Badge>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Search history by employee..." 
                className="h-9 pl-9 rounded-md border-slate-200 bg-white focus-visible:ring-1 focus-visible:ring-indigo-500 text-sm placeholder:text-slate-400"
                value={historySearchTerm}
                onChange={(e) => setHistorySearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-slate-200 hover:bg-transparent">
                  <TableHead className="h-10 px-4 py-2 text-xs font-medium text-slate-500">Employee</TableHead>
                  <TableHead className="h-10 px-4 py-2 text-xs font-medium text-slate-500">Date</TableHead>
                  <TableHead className="h-10 px-4 py-2 text-xs font-medium text-slate-500">Attendance</TableHead>
                  <TableHead className="h-10 px-4 py-2 text-xs font-medium text-slate-500">Status</TableHead>
                  <TableHead className="h-10 px-4 py-2 text-xs font-medium text-slate-500">Duration</TableHead>
                  <TableHead className="h-10 px-4 py-2 text-right" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedHistoryGroups.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-20 text-center">
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center gap-4"
                      >
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                          <History className="h-7 w-7 text-slate-300" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-400 uppercase tracking-wide">No History Found</p>
                          <p className="text-xs text-slate-400 mt-1">
                            {historySearchTerm ? 'Try adjusting your search' : 'No timesheets have been submitted yet.'}
                          </p>
                        </div>
                      </motion.div>
                    </TableCell>
                  </TableRow>
                ) : (
                  displayedHistoryGroups.map((group, i) => {
                    const status = group.tasks[0]?.status || 'pending';
                    return (
                      <TableRow 
                        key={`${group.user_id}_${group.date}_hist`}
                        className="group border-b border-slate-100 hover:bg-slate-50/50 cursor-pointer transition-colors"
                        onClick={() => { setSelectedGroup(group); setFeedback(''); }}
                      >
                        <TableCell className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs bg-slate-100 text-slate-600 font-medium border border-slate-200">
                                {group.user_name ? group.user_name.substring(0, 2).toUpperCase() : 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-slate-900">{group.user_name}</span>
                              <span className="text-xs text-slate-500">{group.user_designation || group.user_email}</span>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="px-4 py-3">
                          <span className="text-sm text-slate-700 font-medium">
                            {new Date(group.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </TableCell>

                        <TableCell className="px-4 py-3">
                          <Badge variant="outline" className={cn(
                            "font-medium text-xs px-2 py-0.5 rounded-md capitalize",
                            attendanceBadgeStyle(group.attendance)
                          )}>
                            {group.attendance ? group.attendance.replace(/-/g, ' ') : 'Full Day'}
                          </Badge>
                        </TableCell>

                        <TableCell className="px-4 py-3">
                          <Badge variant="secondary" className={cn(
                            "font-medium text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md",
                            status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                            status === 'rejected' ? 'bg-red-100 text-red-700' :
                            'bg-amber-100 text-amber-700'
                          )}>
                            {status}
                          </Badge>
                        </TableCell>

                        <TableCell className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-slate-700">{formatDuration(group.total_hours)}</span>
                            {group.total_hours > 8 && (
                              <Badge variant="secondary" className="bg-amber-100 text-amber-700 px-1.5 py-0 rounded text-[10px] font-semibold">OT</Badge>
                            )}
                          </div>
                        </TableCell>

                        <TableCell className="px-4 py-3 text-right">
                          <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-600 inline-block transition-colors" />
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {historyTotal > historyPageSize && (
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-xs text-slate-500 font-medium">
                Showing {Math.min((historyPage - 1) * historyPageSize + 1, historyTotal)} to {Math.min(historyPage * historyPageSize, historyTotal)} of {historyTotal} history records
              </span>
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                  disabled={historyPage === 1 || isHistoryLoading}
                  variant="outline"
                  className="border-slate-200 text-slate-700 rounded-md h-8 px-4 text-xs font-medium disabled:opacity-50"
                >
                  Previous
                </Button>
                <Button
                  onClick={() => setHistoryPage(p => p + 1)}
                  disabled={historyPage * historyPageSize >= historyTotal || isHistoryLoading}
                  className="bg-slate-900 text-white hover:bg-slate-800 rounded-md h-8 px-4 text-xs font-medium disabled:opacity-50"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* ── Detail Modal ── */}
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
              className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="border-b border-slate-200 px-6 py-5 bg-white shrink-0">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12 border border-slate-200">
                      <AvatarFallback className="text-sm font-medium bg-slate-100 text-slate-700">
                        {selectedGroup.user_name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">{selectedGroup.user_name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-slate-500">{selectedGroup.user_designation || selectedGroup.user_email}</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-sm text-slate-500">
                          {new Date(selectedGroup.date).toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end">
                      <div className="text-2xl font-bold text-slate-900 leading-none">{formatDuration(selectedGroup.total_hours)}</div>
                      <div className="text-xs text-slate-500 font-medium mt-1">Total Hours</div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setSelectedGroup(null)} className="h-8 w-8 text-slate-400 hover:text-slate-600">
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Task Cards (Scrollable) */}
              <div className="p-6 overflow-y-auto bg-slate-50/50 flex-grow">
                <div className="flex items-center gap-2 mb-4">
                  <h4 className="text-sm font-semibold text-slate-900">Task Details</h4>
                  <Badge variant="secondary" className="bg-slate-200 text-slate-600 rounded-md px-1.5 py-0.5 text-xs font-medium">
                    {selectedGroup.task_count}
                  </Badge>
                </div>

                <div className="space-y-3">
                  {selectedGroup.tasks.map((task, taskIdx) => (
                    <div
                      key={task.id}
                      className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm"
                    >
                      <div className="flex items-start gap-3">
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row items-start justify-between gap-2 sm:gap-4">
                            <div className="min-w-0 space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-semibold text-slate-900">{task.task_title || '—'}</span>
                                <Badge variant="outline" className="bg-slate-50 text-slate-600 text-xs font-medium px-2 py-0">
                                  {task.project_code ? `[${task.project_code}]` : ''} {task.project_name}
                                </Badge>
                                <Badge variant="secondary" className={cn(
                                  "text-xs font-medium px-2 py-0 capitalize",
                                  task.task_status === 'Completed' ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"
                                )}>
                                  {task.task_status}
                                </Badge>
                              </div>
                              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                                {task.description || '—'}
                              </p>
                            </div>
                            <span className="text-sm font-medium text-slate-900 shrink-0 bg-slate-100 px-2 py-1 rounded-md">
                              {formatDuration(task.hours)}
                            </span>
                          </div>

                          {/* Attachment */}
                          {task.attachment_path && (
                            <div className="mt-3 flex items-center gap-2">
                              <span className="text-xs text-slate-500 flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md border border-slate-100 w-fit">
                                <Paperclip className="h-3.5 w-3.5 text-slate-400" />
                                <span className="truncate max-w-[150px]">{task.attachment_name || 'Attachment'}</span>
                              </span>
                              <div className="flex gap-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 px-2 border-slate-200 text-slate-600 hover:text-indigo-600 bg-white"
                                  onClick={(e) => { e.stopPropagation(); window.open(`/superadmin/timesheets/view-doc?id=${task.id}`, '_blank'); }}
                                >
                                  <Eye className="h-3.5 w-3.5 mr-1" /> View
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 px-2 border-slate-200 text-slate-600 hover:text-indigo-600 bg-white"
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
                <div className="p-6 border-t border-slate-200 bg-white shrink-0">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-700">Feedback <span className="text-slate-400 font-normal">(Required)</span></span>
                    </div>
                    <textarea
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="Leave feedback for the employee..."
                      className="w-full min-h-[80px] bg-white border border-slate-200 rounded-lg p-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none placeholder:text-slate-400"
                    />
                    <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
                      <Button
                        variant="outline"
                        onClick={() => setSelectedGroup(null)}
                        className="h-9 px-4 rounded-md border-slate-200 text-slate-600 font-medium text-sm hover:bg-slate-50"
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
                <div className="p-6 border-t border-slate-200 bg-slate-50 shrink-0">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-700">Resolution Status:</span>
                      <Badge variant="secondary" className={cn(
                        "font-medium text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md",
                        selectedGroup.tasks[0]?.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                      )}>
                        {selectedGroup.tasks[0]?.status}
                      </Badge>
                    </div>
                    {selectedGroup.tasks[0]?.feedback && (
                      <div className="text-sm text-slate-600 bg-white p-3 rounded-md border border-slate-200">
                        <span className="font-semibold text-slate-700 block mb-1">Feedback Given:</span>
                        {selectedGroup.tasks[0].feedback}
                      </div>
                    )}
                    <div className="flex justify-end pt-2">
                      <Button
                        variant="outline"
                        onClick={() => setSelectedGroup(null)}
                        className="h-9 px-4 rounded-md border-slate-200 text-slate-600 font-medium text-sm hover:bg-slate-50"
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
    </div>
  );
}
