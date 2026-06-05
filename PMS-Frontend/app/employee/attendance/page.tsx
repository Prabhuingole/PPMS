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
import axios from 'axios';

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
  const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${api}/attendance/me`, {
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

  const handleCapture = async (file: File) => {
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('photo', file);
      const endpoint = modalType === 'in' ? '/attendance/clock-in' : '/attendance/clock-out';
      await axios.post(`${api}${endpoint}`, formData, {
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
    return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const formatDate = (d: string) => {
    return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getStatusBadge = (rec: any) => {
    if (rec.status === 'Completed' && rec.timesheet_status === 'submitted') {
      return <Badge className="bg-emerald-50 text-emerald-600 border-none text-[8px] font-black uppercase rounded-lg">Complete</Badge>;
    }
    if (rec.status === 'Completed' && rec.timesheet_status === 'pending') {
      return <Badge className="bg-amber-50 text-amber-600 border-none text-[8px] font-black uppercase rounded-lg">Timesheet Pending</Badge>;
    }
    if (rec.status === 'Working') {
      return <Badge className="bg-orange-50 text-orange-600 border-none text-[8px] font-black uppercase rounded-lg">Working</Badge>;
    }
    return <Badge className="bg-slate-50 text-slate-500 border-none text-[8px] font-black uppercase rounded-lg">{rec.status}</Badge>;
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 uppercase">Attendance</h2>
          <p className="text-slate-500 font-medium text-sm">Track your daily attendance & clock-in history</p>
        </div>
        <div className="flex gap-3">
          {!todayAttendance ? (
            <Button
              onClick={() => { setModalType('in'); setModalOpen(true); }}
              className="bg-emerald-600 text-white hover:bg-emerald-700 rounded-2xl h-12 px-6 shadow-xl shadow-emerald-600/20 font-bold uppercase text-xs tracking-widest"
            >
              <LogIn className="mr-2 h-4 w-4" /> Clock In
            </Button>
          ) : !todayAttendance.clock_out_time ? (
            <Button
              onClick={() => { setModalType('out'); setModalOpen(true); }}
              className="bg-red-600 text-white hover:bg-red-700 rounded-2xl h-12 px-6 shadow-xl shadow-red-600/20 font-bold uppercase text-xs tracking-widest"
            >
              <LogOut className="mr-2 h-4 w-4" /> Clock Out
            </Button>
          ) : null}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Calendar */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="lg:col-span-5"
          >
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
            <Card className="rounded-2xl border-slate-200 shadow-sm bg-white overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">Attendance History</h3>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                  {records.length} records this month
                </p>
              </div>

              {records.length === 0 ? (
                <div className="p-12 text-center">
                  <Calendar className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-400">No attendance records for this month</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="text-left text-[9px] font-black uppercase tracking-widest text-slate-400 px-6 py-3">Date</th>
                        <th className="text-left text-[9px] font-black uppercase tracking-widest text-slate-400 px-4 py-3">Clock In</th>
                        <th className="text-left text-[9px] font-black uppercase tracking-widest text-slate-400 px-4 py-3">Clock Out</th>
                        <th className="text-left text-[9px] font-black uppercase tracking-widest text-slate-400 px-4 py-3">Hours</th>
                        <th className="text-left text-[9px] font-black uppercase tracking-widest text-slate-400 px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {records.map((rec, idx) => (
                        <motion.tr 
                          key={rec.id}
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.03 }}
                          className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                        >
                          <td className="px-6 py-3.5 text-xs font-bold text-slate-700">{formatDate(rec.date)}</td>
                          <td className="px-4 py-3.5 text-xs font-medium text-slate-600">{formatTime(rec.clock_in_time)}</td>
                          <td className="px-4 py-3.5 text-xs font-medium text-slate-600">
                            {rec.clock_out_time ? formatTime(rec.clock_out_time) : <span className="text-slate-400">Pending</span>}
                          </td>
                          <td className="px-4 py-3.5 text-xs font-bold text-slate-700">
                            {rec.working_hours ? `${rec.working_hours}h` : '—'}
                          </td>
                          <td className="px-4 py-3.5">{getStatusBadge(rec)}</td>
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
    </div>
  );
}
