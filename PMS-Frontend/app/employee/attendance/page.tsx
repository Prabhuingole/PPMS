'use client';

import { useState, useEffect } from 'react';
import { Fingerprint, LogIn, LogOut, Clock, Loader2, Calendar } from 'lucide-react';
import { motion } from 'motion/react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { AttendanceCalendar } from '@/components/employee/AttendanceCalendar';
import { ClockInOutModal } from '@/components/employee/ClockInOutModal';
import { AttendanceStatusBadge } from '@/components/employee/AttendanceStatusBadge';
import { AttendanceSummaryCard } from '@/components/employee/AttendanceSummaryCard';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import api from '@/services/api';
import { handleApiError } from '@/utils/handleApiError';
import { ErrorState } from '@/components/ui/error-state';

export default function EmployeeAttendancePage() {
  const { token } = useAuthStore();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [todayAttendance, setTodayAttendance] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'in' | 'out'>('in');
  const [submitting, setSubmitting] = useState(false);
  
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/attendance/me`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { month, year, limit: 100 }
      });
      const items = res.data?.items || [];
      setRecords(items);
      const todayStr = new Date().toISOString().split('T')[0];
      setTodayAttendance(items.find((r: any) => r.date === todayStr) || null);
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchData();
  }, [token, month, year]);

  const stats = (() => {
    const totalWorking = records.length;
    const present = records.filter(r => r.status === 'Completed' || r.status === 'WFH').length;
    const working = records.filter(r => r.status === 'Working').length;
    const pending = records.filter(r => (r.status === 'Completed' || r.status === 'WFH') && r.timesheet_status === 'pending').length;
    
    let absent = 0;
    const daysInMonth = new Date(year, month, 0).getDate();
    const today = new Date();
    
    for (let d = 1; d <= daysInMonth; d++) {
      const dayDate = new Date(year, month - 1, d);
      const isPast = dayDate < new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const isWeekend = dayDate.getDay() === 0;
      
      if (isPast && !isWeekend) {
        const dateStr = `${year}-${String(month).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        if (!records.find(r => r.date === dateStr)) {
          absent++;
        }
      }
    }

    const totalExpected = present + absent + working;
    const percentage = totalExpected > 0 ? Math.round(((present + working) / totalExpected) * 100) : 0;

    return { totalWorking, present, working, pending, absent, percentage };
  })();

  const handleCapture = async (file: File) => {
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('photo', file);
      const endpoint = modalType === 'in' ? '/attendance/clock-in' : '/attendance/clock-out';
      await api.post(`${endpoint}`, formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (iso: string) => {
    if (!iso) return '—';
    const dateStr = iso.endsWith('Z') || iso.includes('+') ? iso : `${iso}Z`;
    return new Date(dateStr).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const formatDate = (d: string) => {
    return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };


  return (
    <PageLayout>
      <PageHeader
        title="Attendance"
        description="Track your daily attendance & clock-in history"
        actions={
          <div className="flex gap-3">
            {!todayAttendance ? (
              <Button
                onClick={() => { setModalType('in'); setModalOpen(true); }}
                className="bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg h-10 px-4 font-semibold text-sm"
              >
                <LogIn className="mr-2 h-4 w-4" /> Clock In
              </Button>
            ) : !todayAttendance.clock_out_time ? (
              <Button
                onClick={() => { setModalType('out'); setModalOpen(true); }}
                className="bg-red-600 text-white hover:bg-red-700 rounded-lg h-10 px-4 font-semibold text-sm"
              >
                <LogOut className="mr-2 h-4 w-4" /> Clock Out
              </Button>
            ) : null}
          </div>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Calendar & Stats */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="lg:col-span-5 space-y-6"
          >
            <AttendanceSummaryCard stats={stats} />
            <AttendanceCalendar
              records={records}
              month={month}
              year={year}
              onMonthChange={(m, y) => { setMonth(m); setYear(y); }}
            />
          </motion.div>

          {/* History Table */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="lg:col-span-7"
          >
            <Card className="rounded-xl border-border shadow-sm bg-background overflow-hidden">
              <div className="px-6 py-4 border-b border-border">
                <h3 className="text-sm font-black uppercase tracking-wider text-foreground">Attendance History</h3>
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
                  {records.length} records this month
                </p>
              </div>

              {records.length === 0 ? (
                <div className="p-12 text-center">
                  <Calendar className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm font-bold text-muted-foreground">No attendance records for this month</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="[&_tr]:border-b">
                      <tr className="border-b border-border bg-muted/50 h-10">
                        <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Date</th>
                        <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Clock In</th>
                        <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Clock Out</th>
                        <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Hours</th>
                        <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {records.map((rec, idx) => (
                        <motion.tr 
                          key={rec.id}
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.03 }}
                          className="border-b border-border hover:bg-muted/50 transition-colors h-14"
                        >
                          <td className="px-6 text-sm font-medium text-foreground">{formatDate(rec.date)}</td>
                          <td className="px-4 text-sm font-medium text-slate-600">{formatTime(rec.clock_in_time)}</td>
                          <td className="px-4 text-sm font-medium text-slate-600">
                            {rec.clock_out_time ? formatTime(rec.clock_out_time) : <span className="text-muted-foreground">Pending</span>}
                          </td>
                          <td className="px-4 text-sm font-medium text-foreground">
                            {rec.working_hours ? `${rec.working_hours}h` : '—'}
                          </td>
                          <td className="px-4"><AttendanceStatusBadge status={rec.status} timesheetStatus={rec.timesheet_status} /></td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </motion.div>
        </div>
      )}

      <ClockInOutModal
        open={modalOpen}
        type={modalType}
        onClose={() => setModalOpen(false)}
        onCapture={handleCapture}
        loading={submitting}
      />
    </PageLayout>
  );
}
