'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Fingerprint, Loader2, ArrowLeft, User, Mail, Shield, 
  Calendar as CalendarIcon, Clock, X 
} from 'lucide-react';
import { motion } from 'motion/react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/authStore';
import { AttendanceCalendar } from '@/components/employee/AttendanceCalendar';
import { cn } from '@/lib/utils';
import axios from 'axios';

interface AttendanceRecord {
  id: number;
  user_id: number;
  date: string;
  clock_in_time: string;
  clock_in_photo: string;
  clock_out_time: string | null;
  clock_out_photo: string | null;
  working_hours: number | null;
  status: string;
  timesheet_status: string | null;
}

export default function EmployeeCalendarViewPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;
  
  const { token } = useAuthStore();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [employeeInfo, setEmployeeInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [detailRecord, setDetailRecord] = useState<AttendanceRecord | null>(null);
  const [photoUrls, setPhotoUrls] = useState<{ in?: string; out?: string }>({});
  const [photoLoading, setPhotoLoading] = useState(false);
  
  const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      
      // Fetch employee info
      const empRes = await axios.get(`${api}/employees/${userId}`, { headers }).catch(() => null);
      if (empRes && empRes.data) {
        setEmployeeInfo(empRes.data);
      }

      // Fetch attendance records
      const res = await axios.get(`${api}/attendance/all`, {
        headers,
        params: { month, year, user_id: userId, limit: 100 }
      });
      setRecords(res.data?.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token, month, year, userId, api]);

  useEffect(() => {
    if (token && userId) fetchData();
  }, [token, fetchData, userId]);

  const stats = useMemo(() => {
    const totalWorking = records.length;
    const present = records.filter(r => r.status === 'Completed').length;
    const working = records.filter(r => r.status === 'Working').length;
    const pending = records.filter(r => r.status === 'Completed' && r.timesheet_status === 'pending').length;
    
    // Calculate absent days (weekdays passed without record)
    let absent = 0;
    const daysInMonth = new Date(year, month, 0).getDate();
    const today = new Date();
    
    for (let d = 1; d <= daysInMonth; d++) {
      const dayDate = new Date(year, month - 1, d);
      const isPast = dayDate < new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const isWeekend = dayDate.getDay() === 0 || dayDate.getDay() === 6;
      
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
  }, [records, month, year]);

  const handleDayClick = async (dateStr: string) => {
    const rec = records.find(r => r.date === dateStr);
    if (!rec) {
      // If absent or no record
      alert(`No attendance record found for ${dateStr}`);
      return;
    }
    
    setDetailRecord(rec);
    setPhotoUrls({});
    setPhotoLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [inRes, outRes] = await Promise.all([
        axios.get(`${api}/attendance/photo/${rec.id}/in`, { headers }).catch(() => null),
        rec.clock_out_photo ? axios.get(`${api}/attendance/photo/${rec.id}/out`, { headers }).catch(() => null) : null
      ]);
      setPhotoUrls({
        in: inRes?.data?.url,
        out: outRes?.data?.url
      });
    } catch {
      // Ignore
    } finally {
      setPhotoLoading(false);
    }
  };

  const formatTime = (iso: string) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  };
  const formatDate = (d: string) => {
    return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          onClick={() => router.back()}
          className="h-10 w-10 p-0 rounded-xl hover:bg-slate-200"
        >
          <ArrowLeft className="h-5 w-5 text-slate-600" />
        </Button>
        <div>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 uppercase">
            Employee Calendar
          </h2>
          <p className="text-slate-500 font-medium text-sm">
            Viewing attendance calendar for {employeeInfo?.full_name || 'Employee'}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Info & Stats */}
          <div className="lg:col-span-4 space-y-6">
            {/* Employee Info Card */}
            <Card className="rounded-2xl border-slate-200 shadow-sm p-6 bg-white">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xl text-white font-black shrink-0 shadow-lg shadow-indigo-500/30">
                  {employeeInfo?.full_name?.charAt(0) || '?'}
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">{employeeInfo?.full_name || 'Unknown Employee'}</h3>
                  <div className="text-xs font-bold text-indigo-600 uppercase tracking-widest">{employeeInfo?.designation || 'Employee'}</div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-50"><Mail className="h-4 w-4 text-slate-500" /></div>
                  <span className="text-sm font-medium text-slate-600">{employeeInfo?.email || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-50"><Shield className="h-4 w-4 text-slate-500" /></div>
                  <span className="text-sm font-medium text-slate-600 capitalize">{employeeInfo?.role || 'N/A'}</span>
                </div>
              </div>
            </Card>

            {/* Summary Stats */}
            <Card className="rounded-2xl border-slate-200 shadow-sm p-6 bg-white">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 mb-4">Monthly Summary</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                  <div className="text-[9px] font-black uppercase tracking-widest text-emerald-600 mb-1">Present</div>
                  <div className="text-2xl font-black text-emerald-700">{stats.present}</div>
                </div>
                <div className="bg-red-50 rounded-xl p-3 border border-red-100">
                  <div className="text-[9px] font-black uppercase tracking-widest text-red-600 mb-1">Absent</div>
                  <div className="text-2xl font-black text-red-700">{stats.absent}</div>
                </div>
                <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
                  <div className="text-[9px] font-black uppercase tracking-widest text-amber-600 mb-1">Pending TS</div>
                  <div className="text-xl font-black text-amber-700">{stats.pending}</div>
                </div>
                <div className="bg-orange-50 rounded-xl p-3 border border-orange-100">
                  <div className="text-[9px] font-black uppercase tracking-widest text-orange-600 mb-1">Working</div>
                  <div className="text-xl font-black text-orange-700">{stats.working}</div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="flex justify-between items-end">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Attendance Rate</div>
                  <div className="text-3xl font-black text-indigo-600">{stats.percentage}%</div>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full mt-2 overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }} animate={{ width: `${stats.percentage}%` }} transition={{ duration: 1 }}
                    className={cn(
                      "h-full rounded-full",
                      stats.percentage >= 90 ? "bg-emerald-500" : stats.percentage >= 75 ? "bg-amber-500" : "bg-red-500"
                    )}
                  />
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column: Calendar */}
          <div className="lg:col-span-8">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <AttendanceCalendar
                records={records}
                month={month}
                year={year}
                onMonthChange={(m, y) => { setMonth(m); setYear(y); }}
                onDayClick={handleDayClick}
              />
            </motion.div>
          </div>
        </div>
      )}

      {/* Detail Modal (Reused from Admin Attendance Page) */}
      {detailRecord && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-indigo-50">
                  <Fingerprint className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">Attendance Details</h3>
                  <p className="text-[10px] text-slate-400 font-bold">{formatDate(detailRecord.date)}</p>
                </div>
              </div>
              <button onClick={() => setDetailRecord(null)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                <X className="h-4 w-4 text-slate-400" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Clock In */}
              <div>
                <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-3">Clock In</h4>
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="text-sm font-bold text-slate-800">{formatTime(detailRecord.clock_in_time)}</span>
                </div>
                {photoLoading ? (
                  <div className="bg-slate-100 rounded-2xl h-40 flex items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-slate-400" /></div>
                ) : photoUrls.in ? (
                  <img src={photoUrls.in} alt="Clock In" className="w-full rounded-2xl object-cover max-h-48 border border-slate-200" />
                ) : (
                  <div className="bg-slate-100 rounded-2xl h-32 flex items-center justify-center text-xs text-slate-400 font-bold">Photo unavailable</div>
                )}
              </div>

              {/* Clock Out */}
              <div>
                <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-3">Clock Out</h4>
                {detailRecord.clock_out_time ? (
                  <>
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-3.5 w-3.5 text-red-500" />
                      <span className="text-sm font-bold text-slate-800">{formatTime(detailRecord.clock_out_time)}</span>
                    </div>
                    {photoLoading ? (
                      <div className="bg-slate-100 rounded-2xl h-40 flex items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-slate-400" /></div>
                    ) : photoUrls.out ? (
                      <img src={photoUrls.out} alt="Clock Out" className="w-full rounded-2xl object-cover max-h-48 border border-slate-200" />
                    ) : (
                      <div className="bg-slate-100 rounded-2xl h-32 flex items-center justify-center text-xs text-slate-400 font-bold">Photo unavailable</div>
                    )}
                  </>
                ) : (
                  <p className="text-xs text-slate-400 font-medium">Not clocked out yet</p>
                )}
              </div>

              {/* Summary */}
              <div className="bg-slate-50 rounded-2xl p-4 grid grid-cols-2 gap-4">
                <div>
                  <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">Total Hours</div>
                  <div className="text-lg font-black text-slate-900 mt-1">
                    {detailRecord.working_hours ? `${detailRecord.working_hours}h` : '—'}
                  </div>
                </div>
                <div>
                  <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">Timesheet</div>
                  <div className="mt-1">
                    {detailRecord.timesheet_status === 'submitted' 
                      ? <Badge className="bg-emerald-50 text-emerald-600 border-none text-[9px] font-black uppercase rounded-lg">Submitted</Badge>
                      : <Badge className="bg-amber-50 text-amber-600 border-none text-[9px] font-black uppercase rounded-lg">Pending</Badge>
                    }
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
