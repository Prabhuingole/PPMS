'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  Save, 
  Clock,
  Pencil,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import axios from 'axios';
import { useAuthStore } from '@/store/authStore';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';

const otherWorkCategories = [
  { id: 'meeting', name: 'Meeting', sub: ['Internal Meeting', 'External Meeting'] },
  { id: 'kt', name: 'Knowledge Transfer (KT)', sub: ['KT Taken', 'KT Given'] },
  { id: 'learning', name: 'Learning', sub: ['Learning Activities', 'Training', 'Research'] },
];

type Entry = {
  id: string;
  projectId: string;
  categoryId: string;
  subcategory: string;
  entryHours: number;
  entryMinutes: number;
  taskTitle: string;
  description: string;
  status: string;
  attachmentPath?: string | null;
  attachmentName?: string | null;
  isUploading?: boolean;
};

interface FillTimesheetDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  /** When provided, the dialog opens in edit mode pre-filled with this date's entries */
  editDate?: string | null;
}

const blankEntry = (): Entry => ({
  id: Math.random().toString(),
  projectId: '',
  categoryId: '',
  subcategory: '',
  entryHours: 0,
  entryMinutes: 0,
  taskTitle: '',
  description: '',
  status: 'Pending',
  attachmentPath: null,
  attachmentName: null,
  isUploading: false,
});

export function FillTimesheetDialog({ isOpen, onClose, onSuccess, editDate }: FillTimesheetDialogProps) {
  const { token, user } = useAuthStore();
  const isEditMode = Boolean(editDate);

  const [date, setDate] = useState('');
  const [day, setDay] = useState('Monday');
  const [attendance, setAttendance] = useState('full-day');
  const [arrivalTime, setArrivalTime] = useState('');
  const [halfDayPeriod, setHalfDayPeriod] = useState('');
  const [entries, setEntries] = useState<Entry[]>([{ ...blankEntry(), id: 'initial-row-0' }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);

  // Reset / pre-populate when dialog opens
  useEffect(() => {
    if (!isOpen) return;

    if (isEditMode && editDate) {
      setDate(editDate);
      setIsLoading(true);
      axios
        .get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/timesheets/day/${editDate}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          const raw: any[] = res.data;
          if (raw.length === 0) {
            toast.error('No entries found for this date.');
            onClose();
            return;
          }

          // Map API response → Entry shape
          const mapped: Entry[] = raw.map((ts) => {
            const hours = Math.floor(ts.hours || 0);
            const minutes = Math.round(((ts.hours || 0) - hours) * 60);
            return {
              id: ts.id.toString(),
              projectId: ts.project_id ? ts.project_id.toString() : ts.category ? 'other' : '',
              categoryId: ts.category || '',
              subcategory: ts.subcategory || '',
              entryHours: hours,
              entryMinutes: minutes,
              taskTitle: ts.task_title || '',
              description: ts.description || '',
              status: ts.task_status || 'Pending',
              attachmentPath: ts.attachment_path || null,
              attachmentName: ts.attachment_name || null,
              isUploading: false,
            };
          });

          setEntries(mapped);

          // Attendance: use the first entry's attendance if present
          if (raw[0]?.attendance) {
            setAttendance(raw[0].attendance);
          } else {
            setAttendance('full-day');
          }

          if (raw[0]?.arrival_time) {
            setArrivalTime(raw[0].arrival_time);
          } else {
            setArrivalTime('');
          }

          if (raw[0]?.half_day_period) {
            setHalfDayPeriod(raw[0].half_day_period);
          } else {
            setHalfDayPeriod('');
          }

          // Day detection
          const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          setDay(days[new Date(editDate).getDay()]);
        })
        .catch(() => toast.error('Failed to load timesheet entries.'))
        .finally(() => setIsLoading(false));
    } else {
      // Create mode — check for draft
      const draft = localStorage.getItem(`timesheet_draft_${user?.id}`);
      if (draft) {
        try {
          const parsed = JSON.parse(draft);
          setDate(parsed.date || new Date().toISOString().split('T')[0]);
          setAttendance(parsed.attendance || 'full-day');
          setArrivalTime(parsed.arrivalTime || '');
          setHalfDayPeriod(parsed.halfDayPeriod || '');
          setEntries(parsed.entries?.length ? parsed.entries : [{ ...blankEntry(), id: 'initial-row-0' }]);
          
          const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          setDay(days[new Date(parsed.date || new Date()).getDay()]);
          toast.success('Draft loaded successfully!');
          return;
        } catch (e) {
          console.error("Failed to parse draft");
        }
      }

      // Fresh form fallback
      setDate(new Date().toISOString().split('T')[0]);
      setEntries([{ ...blankEntry(), id: 'initial-row-0' }]);
      setAttendance('full-day');
      setArrivalTime('');
      setHalfDayPeriod('');
    }
  }, [isOpen, isEditMode, editDate]);

  const handleTaskFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, entryId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setEntries(entries.map(ent => ent.id === entryId ? { ...ent, isUploading: true } : ent));
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/timesheets/upload-attachment`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      setEntries(entries.map(ent => 
        ent.id === entryId ? { 
          ...ent, 
          attachmentPath: response.data.file_path,
          attachmentName: response.data.filename,
          isUploading: false 
        } : ent
      ));
      toast.success('Document uploaded successfully!');
    } catch (error: any) {
      console.error(error);
      toast.error('Failed to upload document.');
      setEntries(entries.map(ent => ent.id === entryId ? { ...ent, isUploading: false } : ent));
    }
  };

  // Auto-detect day from selected date
  useEffect(() => {
    if (date) {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const d = new Date(date);
      setDay(days[d.getDay()]);
    }
  }, [date]);

  // Load projects
  useEffect(() => {
    if (token && isOpen) {
      axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/projects/?limit=1000`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => setProjects(res.data.items || res.data)).catch(console.error);
    }
  }, [token, isOpen]);

  const totalHours = entries.reduce((acc, curr) => acc + (Number(curr.entryHours) || 0) + ((Number(curr.entryMinutes) || 0) / 60), 0);
  const isLeaveOrHoliday = attendance === 'leave' || attendance === 'public-holiday';
  const displayTotalHours = isLeaveOrHoliday ? 0 : totalHours;
  const overtimeHours = displayTotalHours > 8 ? displayTotalHours - 8 : 0;
  const downtimeHours = displayTotalHours < 8 ? 8 - displayTotalHours : 0;

  const formatDuration = (decimal: number) => {
    const h = Math.floor(decimal);
    const m = Math.round((decimal - h) * 60);
    return `${h}h ${m}m`;
  };

  const addRow = () => setEntries([...entries, blankEntry()]);

  const removeRow = (id: string) => {
    if (entries.length > 1) setEntries(entries.filter(e => e.id !== id));
  };

  const updateEntry = (id: string, field: keyof Entry, value: any) => {
    setEntries(entries.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  const handleSubmit = async () => {
    if ((attendance === 'late-arrival' || attendance === 'early-arrival') && !arrivalTime) {
      toast.error('Please specify your arrival time.');
      return;
    }
    if (attendance === 'half-day' && !halfDayPeriod) {
      toast.error('Please select the half-day period.');
      return;
    }

    if (!isLeaveOrHoliday) {
      for (const e of entries) {
        if (!e.projectId) {
          toast.error('Please select a Project for all entries.');
          return;
        }
        if (!e.taskTitle.trim()) {
          toast.error('Please fill in the Task name for all entries.');
          return;
        }
        
        const taskTitleRegex = /^[a-zA-Z\s\-\.]+$/;
        if (!taskTitleRegex.test(e.taskTitle.trim())) {
          toast.error('Task Name must only contain letters and spaces (no numbers or special characters).');
          return;
        }

        if (!e.description.trim()) {
          toast.error('Please fill in the Task Description for all entries.');
          return;
        }
        if (e.entryHours === 0 && e.entryMinutes === 0) {
          toast.error('Please set a duration for all entries.');
          return;
        }
      }
    }

    setIsSubmitting(true);
    try {
      const payload = isLeaveOrHoliday
        ? [
            {
              project_id: null,
              date: new Date(date).toISOString(),
              hours: 0,
              task_title: attendance === 'leave' ? 'Leave' : 'Public Holiday',
              description: attendance === 'leave' ? 'Leave' : 'Public Holiday',
              task_status: 'Completed',
              category: null,
              subcategory: null,
              day: day,
              attachment_path: null,
              attachment_name: null,
              attendance: attendance,
              arrival_time: null,
              half_day_period: null
            }
          ]
        : entries.map(e => ({
            project_id: e.projectId === 'other' || !e.projectId ? null : parseInt(e.projectId),
            date: new Date(date).toISOString(),
            hours: Number(e.entryHours) + (Number(e.entryMinutes) / 60),
            task_title: e.taskTitle,
            description: e.description,
            task_status: e.status,
            category: e.categoryId || null,
            subcategory: e.subcategory || null,
            day: day,
            attachment_path: e.attachmentPath || null,
            attachment_name: e.attachmentName || null,
            attendance: attendance,
            arrival_time: (attendance === 'late-arrival' || attendance === 'early-arrival') ? arrivalTime : null,
            half_day_period: attendance === 'half-day' ? halfDayPeriod : null
          }));

      if (isEditMode) {
        await axios.put(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/timesheets/day/${date}`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Timesheet updated successfully!');
      } else {
        await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/timesheets/`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Timesheet submitted successfully!');
      }

      if (!isEditMode) {
        localStorage.removeItem(`timesheet_draft_${user?.id}`);
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (e: any) {
      const msg = e?.response?.data?.detail || 'Submission failed. Please try again.';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = () => {
    const draftData = {
      date,
      attendance,
      arrivalTime,
      halfDayPeriod,
      entries: entries.map(e => ({ ...e, isUploading: false }))
    };
    localStorage.setItem(`timesheet_draft_${user?.id}`, JSON.stringify(draftData));
    toast.success('Timesheet saved as draft!');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-2xl md:max-w-3xl w-full max-h-[90vh] overflow-y-auto p-0 border border-slate-100/60 bg-white/80 backdrop-blur-3xl flex flex-col rounded-2xl sm:rounded-[32px] shadow-[0_20px_60px_-15px_rgba(79,70,229,0.15)]">
        {/* Header */}
        <div className={cn(
          "p-4 sm:p-6 md:p-8 border-b border-slate-100/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sticky top-0 z-30 backdrop-blur-xl",
          isEditMode ? "bg-amber-50/80" : "bg-white/80"
        )}>
          <div>
            <div className="flex items-center gap-2">
              <DialogTitle className="text-xl font-black text-slate-900 uppercase tracking-tight">
                {isEditMode ? 'Edit Timesheet' : 'Fill Timesheet'}
              </DialogTitle>
              {isEditMode && (
                <Badge className="bg-amber-100 text-amber-700 border-none text-[9px] font-black uppercase tracking-widest px-2 py-0.5 flex items-center gap-1">
                  <Pencil className="h-2.5 w-2.5" />
                  Editing
                </Badge>
              )}
            </div>
            <DialogDescription className="text-xs font-semibold text-slate-400 mt-0.5">
              {isEditMode
                ? `Updating entries for ${new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' })}`
                : 'Log daily tasks and attendance details'}
            </DialogDescription>
          </div>
          <div className="flex items-center gap-3 sm:mr-8">
            <div className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl shadow-lg text-white",
              isEditMode ? "bg-amber-500 shadow-amber-500/20" : "bg-indigo-600 shadow-indigo-600/20"
            )}>
              <Clock className="h-3.5 w-3.5" />
              <span className="text-xs font-black">{formatDuration(totalHours)}</span>
              <span className="text-[8px] font-bold uppercase tracking-widest opacity-70 ml-0.5">Total</span>
            </div>
          </div>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex-1 flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <Clock className="h-8 w-8 text-indigo-600 animate-spin" />
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Loading entries...</span>
            </div>
          </div>
        )}

        {/* Scrollable form content */}
        {!isLoading && (
          <div className="flex-1 p-6 sm:p-8 space-y-8 overflow-y-auto">
            {/* Day Info Bar */}
            <Card className="relative overflow-hidden rounded-[24px] border-slate-100/60 bg-white shadow-xl shadow-slate-200/40 p-6">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-transparent to-purple-50/50 opacity-50 pointer-events-none"></div>
              <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* Date */}
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Date</Label>
                  <Input 
                    type="date" 
                    value={date} 
                    max={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setDate(e.target.value)}
                    className="h-10 rounded-xl border-slate-200 text-xs font-bold focus:border-indigo-500"
                  />
                </div>

                {/* Day (auto-detected, also editable) */}
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Day</Label>
                  <Select value={day} onValueChange={(v) => v && setDay(v)}>
                    <SelectTrigger className="h-10 rounded-xl border-slate-200 text-xs font-bold">
                      <SelectValue placeholder="Select Day" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-200">
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => (
                        <SelectItem key={d} value={d} className="py-2 text-xs font-bold">{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Attendance */}
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Attendance</Label>
                  <Select value={attendance} onValueChange={(v) => v && setAttendance(v)}>
                    <SelectTrigger className="h-10 rounded-xl border-slate-200 text-xs font-bold">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-200">
                      <SelectItem value="full-day" className="py-2 text-xs font-bold">Full Day</SelectItem>
                      <SelectItem value="half-day" className="py-2 text-xs font-bold">Half Day</SelectItem>
                      <SelectItem value="late-arrival" className="py-2 text-xs font-bold">Late Arrival</SelectItem>
                      <SelectItem value="early-arrival" className="py-2 text-xs font-bold">Early Arrival</SelectItem>
                      <SelectItem value="leave" className="py-2 text-xs font-bold">Leave</SelectItem>
                      <SelectItem value="public-holiday" className="py-2 text-xs font-bold">Public Holiday</SelectItem>
                    </SelectContent>
                  </Select>

                  <AnimatePresence>
                    {(attendance === 'late-arrival' || attendance === 'early-arrival') && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="pt-2 space-y-2 overflow-hidden">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Arrival Time <span className="text-red-400">*</span></Label>
                        <Input type="time" value={arrivalTime} onChange={(e) => setArrivalTime(e.target.value)} className="h-10 rounded-xl border-slate-200 text-xs font-bold focus:border-indigo-500" />
                      </motion.div>
                    )}
                    {attendance === 'half-day' && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="pt-2 space-y-2 overflow-hidden">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Half Day Period <span className="text-red-400">*</span></Label>
                        <Select value={halfDayPeriod} onValueChange={(v) => v && setHalfDayPeriod(v)}>
                          <SelectTrigger className="h-10 rounded-xl border-slate-200 text-xs font-bold focus:border-indigo-500 bg-white">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-slate-200">
                            <SelectItem value="1st half" className="py-2 text-xs font-bold">1st half (10 AM to 1 PM)</SelectItem>
                            <SelectItem value="2nd half" className="py-2 text-xs font-bold">2nd half (2 PM to 7 PM)</SelectItem>
                          </SelectContent>
                        </Select>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Threshold & OT/DT */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Threshold</Label>
                    <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest border-slate-200 text-slate-400">8h / Day</Badge>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((totalHours / 8) * 100, 100)}%` }}
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        totalHours > 8 ? "bg-amber-500" : isEditMode ? "bg-amber-400" : "bg-indigo-600"
                      )} 
                    />
                  </div>
                  <div className="flex justify-between">
                    {overtimeHours > 0 && (
                      <span className="text-[9px] font-black text-amber-600 uppercase">OT: +{formatDuration(overtimeHours)}</span>
                    )}
                    {downtimeHours > 0 && totalHours > 0 && (
                      <span className="text-[9px] font-black text-blue-600 uppercase">Remaining: {formatDuration(downtimeHours)}</span>
                    )}
                    {totalHours === 0 && (
                      <span className="text-[9px] font-bold text-slate-300 italic">No hours logged yet</span>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            {isLeaveOrHoliday ? (
              <Card className="rounded-2xl border-slate-200 shadow-xs p-8 bg-white flex flex-col items-center justify-center text-center space-y-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-full">
                  <Calendar className="h-8 w-8 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-sm font-black uppercase tracking-tight text-slate-800">
                    No Task Entries Required
                  </h4>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1 max-w-md leading-relaxed mx-auto">
                    You have selected {attendance === 'leave' ? 'Leave' : 'Public Holiday'} as your attendance. Submitting will register this status with 0 logged hours.
                  </p>
                </div>
              </Card>
            ) : (
              <>
            {/* Task Entries Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black uppercase tracking-tight text-slate-800">Task Entries</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{entries.length} {entries.length === 1 ? 'task' : 'tasks'} added</p>
              </div>
              <Button 
                onClick={addRow}
                className="h-8 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[9px] font-black uppercase tracking-widest"
              >
                <Plus className="mr-1 h-3 w-3" /> Add Task
              </Button>
            </div>

            {/* Task Entry Cards */}
            <div className="space-y-4">
              <AnimatePresence>
                {entries.map((entry, idx) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="group relative rounded-[24px] border-slate-100/60 shadow-xl shadow-slate-200/40 bg-white overflow-hidden transition-all hover:shadow-2xl hover:shadow-indigo-500/10 hover:border-indigo-100">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-400 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div className="p-4 sm:p-6 space-y-5 relative z-10">
                        {/* Row 1: Project + Task Status + Duration + Delete */}
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
                          {/* Project - wider */}
                          <div className="sm:col-span-5 space-y-1.5 min-w-0">
                            <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Project <span className="text-red-400">*</span></Label>
                            <Select value={entry.projectId} onValueChange={(v) => v && updateEntry(entry.id, 'projectId', v)}>
                              <SelectTrigger className="h-10 rounded-lg border-slate-200 text-xs font-bold w-full min-w-0 overflow-hidden">
                                <SelectValue placeholder="Select Project" className="truncate" />
                              </SelectTrigger>
                              <SelectContent className="rounded-xl max-w-[400px]">
                                {projects.map(p => (
                                  <SelectItem key={p.id} value={p.id.toString()} className="text-xs font-bold py-2.5 pr-8 truncate">
                                    {p.code ? `[${p.code}] — ${p.name}` : p.name}
                                  </SelectItem>
                                ))}
                                <SelectItem value="other" className="text-xs font-bold py-2.5">Other Work</SelectItem>
                              </SelectContent>
                            </Select>

                            {/* Other Work sub-selects */}
                            {entry.projectId === 'other' && (
                              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="flex flex-col sm:flex-row gap-2 mt-2">
                                <Select value={entry.categoryId} onValueChange={(v) => v && updateEntry(entry.id, 'categoryId', v)}>
                                  <SelectTrigger className="h-9 rounded-lg border-slate-200 text-[10px] font-bold flex-1">
                                    <SelectValue placeholder="Category" />
                                  </SelectTrigger>
                                  <SelectContent className="rounded-xl">
                                    {otherWorkCategories.map(c => (
                                      <SelectItem key={c.id} value={c.id} className="text-[10px] font-bold">{c.name}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                {entry.categoryId && (
                                  <Select value={entry.subcategory} onValueChange={(v) => v && updateEntry(entry.id, 'subcategory', v)}>
                                    <SelectTrigger className="h-9 rounded-lg border-slate-200 text-[10px] font-bold flex-1">
                                      <SelectValue placeholder="Sub-category" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                      {otherWorkCategories.find(c => c.id === entry.categoryId)?.sub.map(s => (
                                        <SelectItem key={s} value={s} className="text-[10px] font-bold">{s}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                )}
                              </motion.div>
                            )}
                          </div>

                          {/* Duration */}
                          <div className="sm:col-span-3 space-y-1.5">
                            <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Duration</Label>
                            <div className="flex items-center gap-1.5">
                              <div className="relative flex-1">
                                <Input 
                                  type="number" min="0" max="23"
                                  value={entry.entryHours === 0 ? '' : entry.entryHours}
                                  onChange={(e) => updateEntry(entry.id, 'entryHours', Math.min(23, Math.max(0, parseInt(e.target.value) || 0)))}
                                  className="h-10 rounded-lg border-slate-200 text-center font-black pr-6 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                                  placeholder="0"
                                />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">h</span>
                              </div>
                              <span className="text-slate-300 font-bold text-lg">:</span>
                              <div className="relative flex-1">
                                <Input 
                                  type="number" min="0" max="59"
                                  value={entry.entryMinutes === 0 ? '' : entry.entryMinutes}
                                  onChange={(e) => updateEntry(entry.id, 'entryMinutes', Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                                  className="h-10 rounded-lg border-slate-200 text-center font-black pr-7 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                                  placeholder="0"
                                />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">min</span>
                              </div>
                            </div>
                          </div>

                          {/* Status */}
                          <div className="sm:col-span-3 space-y-1.5">
                            <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Task Status</Label>
                            <Select value={entry.status} onValueChange={(v) => v && updateEntry(entry.id, 'status', v)}>
                              <SelectTrigger className="h-10 rounded-lg border-slate-200 text-xs font-bold">
                                <SelectValue placeholder="Status" />
                              </SelectTrigger>
                              <SelectContent className="rounded-xl">
                                <SelectItem value="Pending" className="text-xs font-bold">Pending</SelectItem>
                                <SelectItem value="Completed" className="text-xs font-bold">Completed</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Delete */}
                          <div className="sm:col-span-1 flex items-end justify-end pb-0.5">
                            <Button  
                              variant="ghost" 
                              size="icon" 
                              onClick={() => removeRow(entry.id)}
                              className="h-10 w-10 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                              disabled={entries.length === 1}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Row 2: Task Name */}
                        <div className="space-y-1.5">
                          <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Task Name <span className="text-red-400">*</span></Label>
                          <Input 
                            value={entry.taskTitle}
                            onChange={(e) => updateEntry(entry.id, 'taskTitle', e.target.value)}
                            placeholder="e.g. API Integration, UI Design, Bug Fix..."
                            className={cn(
                              "h-10 rounded-xl border-slate-200 text-sm font-medium focus:border-indigo-400 transition-all",
                              entry.taskTitle.trim() && !/^[a-zA-Z\s\-\.]+$/.test(entry.taskTitle.trim()) && "border-red-500 focus:border-red-500 focus:ring-red-500 bg-red-50/10"
                            )}
                          />
                          {entry.taskTitle.trim() && !/^[a-zA-Z\s\-\.]+$/.test(entry.taskTitle.trim()) && (
                            <p className="text-[10px] font-semibold text-red-500 mt-1 pl-1">
                              Task name must only contain letters and spaces (no numbers or special characters).
                            </p>
                          )}
                        </div>

                        {/* Row 3: Task Description & Attachment */}
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
                          <div className="sm:col-span-8 space-y-1.5">
                            <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Task Description <span className="text-red-400">*</span></Label>
                            <textarea 
                              value={entry.description}
                              onChange={(e) => updateEntry(entry.id, 'description', e.target.value)}
                              placeholder="Describe what you worked on in detail..."
                              className="w-full h-full min-h-[90px] bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-medium outline-none focus:border-indigo-400 focus:bg-white transition-all resize-none"
                            />
                          </div>
                          
                          <div className="sm:col-span-4 space-y-1.5">
                             <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Attachment (Optional)</Label>
                             <div className="mt-1 h-[90px]">
                               {!entry.attachmentPath ? (
                                <div className="relative border border-dashed border-slate-200 hover:border-indigo-400 rounded-xl px-4 py-2 h-full flex flex-col items-center justify-center text-center cursor-pointer transition-all bg-slate-50 hover:bg-indigo-50/30 group">
                                  <input 
                                    type="file" 
                                    onChange={(e) => handleTaskFileUpload(e, entry.id)} 
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    disabled={entry.isUploading}
                                  />
                                  {entry.isUploading ? (
                                    <>
                                      <Clock className="h-4 w-4 text-indigo-600 animate-spin mb-1" />
                                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Uploading...</span>
                                    </>
                                  ) : (
                                    <>
                                      <Plus className="h-4 w-4 text-slate-400 group-hover:text-indigo-600 transition-colors mb-1" />
                                      <span className="text-[9px] font-black text-slate-600 group-hover:text-indigo-600 transition-colors uppercase tracking-widest">Upload File</span>
                                    </>
                                  )}
                                </div>
                              ) : (
                                <div className="flex flex-col items-center justify-center h-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-center relative group">
                                  <span className="text-[10px] font-bold text-slate-600 w-full truncate mb-1" title={entry.attachmentName || ''}>{entry.attachmentName}</span>
                                  <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 border-emerald-100">Uploaded</Badge>
                                  <Button 
                                    onClick={() => updateEntry(entry.id, 'attachmentPath', null)}
                                    variant="ghost" 
                                    size="icon" 
                                    className="absolute top-1 right-1 h-6 w-6 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              )}
                             </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
              </>
            )}
          </div>
        )}

        {/* Footer submit bar */}
        {!isLoading && (
          <div className={cn(
            "p-4 sm:p-6 md:p-8 border-t border-slate-100/50 flex justify-end items-center sticky bottom-0 z-30 backdrop-blur-xl rounded-b-2xl sm:rounded-b-[32px]",
            isEditMode ? "bg-amber-50/90" : "bg-white/90"
          )}>
            <div className="flex flex-wrap gap-2">
              <Button 
                onClick={onClose}
                variant="outline"
                className="h-10 px-5 border-slate-200 text-slate-500 font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-slate-50"
              >
                Cancel
              </Button>
              {!isEditMode && (
                <Button 
                  onClick={handleSaveDraft}
                  variant="outline"
                  className="h-10 px-6 border-indigo-200 text-indigo-600 font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-indigo-50 bg-indigo-50/50 shadow-sm"
                >
                  Save Draft
                </Button>
              )}
              <Button 
                onClick={handleSubmit}
                disabled={isSubmitting || (!isLeaveOrHoliday && totalHours === 0)}
                className={cn(
                  "h-10 px-8 text-white rounded-xl shadow-lg font-black uppercase text-xs tracking-widest transition-all group",
                  isEditMode
                    ? "bg-amber-500 hover:bg-amber-600 shadow-amber-500/20"
                    : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/10"
                )}
              >
                {isSubmitting ? (
                  <div className="flex items-center space-x-2 animate-pulse">
                    <Clock className="h-3.5 w-3.5 animate-spin" />
                    <span>{isEditMode ? 'Updating...' : 'Submitting...'}</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span>{isEditMode ? 'Update' : 'Submit'}</span>
                    {isEditMode
                      ? <Pencil className="h-3.5 w-3.5 group-hover:scale-110 transition-transform" />
                      : <Save className="h-3.5 w-3.5 group-hover:scale-110 transition-transform" />
                    }
                  </div>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
