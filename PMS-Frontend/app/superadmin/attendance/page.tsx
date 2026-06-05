'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Fingerprint, Loader2, Eye, X, Clock, User, Mail, Shield, Calendar, Search } from 'lucide-react';
import { motion } from 'motion/react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
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
  user_name: string | null;
  user_email: string | null;
  user_role: string | null;
  timesheet_status: string | null;
}

export default function AdminAttendancePage() {
  const router = useRouter();
  const { token } = useAuthStore();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [statusFilter, setStatusFilter] = useState('');
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailRecord, setDetailRecord] = useState<AttendanceRecord | null>(null);
  const [photoUrls, setPhotoUrls] = useState<{ in?: string; out?: string }>({});
  const [photoLoading, setPhotoLoading] = useState(false);
  const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { month, year, limit: 200 };
      if (statusFilter) params.status = statusFilter;
      const res = await axios.get(`${api}/attendance/all`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      setRecords(res.data?.items || []);
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [token, month, year, statusFilter, api]);

  useEffect(() => {
    if (token) fetchData();
  }, [token, fetchData]);

  const openDetail = async (rec: AttendanceRecord) => {
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

  const getStatusBadge = (rec: AttendanceRecord) => {
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

  const monthNames = ['','January','February','March','April','May','June','July','August','September','October','November','December'];

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 uppercase">Attendance Management</h2>
          <p className="text-slate-500 font-medium text-sm">View and audit all employee attendance records</p>
        </div>
      </div>

      {/* Filters */}
      <Card className="rounded-2xl border-slate-200 shadow-sm p-4 bg-white">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Month</span>
            <select
              value={month}
              onChange={e => setMonth(Number(e.target.value))}
              className="text-xs font-bold text-slate-700 border border-slate-200 rounded-xl px-3 py-2 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i+1} value={i+1}>{monthNames[i+1]}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Year</span>
            <select
              value={year}
              onChange={e => setYear(Number(e.target.value))}
              className="text-xs font-bold text-slate-700 border border-slate-200 rounded-xl px-3 py-2 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Status</span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="text-xs font-bold text-slate-700 border border-slate-200 rounded-xl px-3 py-2 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="">All</option>
              <option value="Working">Working</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
          <div className="ml-auto text-[10px] font-black uppercase tracking-widest text-slate-400">
            {records.length} records
          </div>
        </div>
      </Card>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      ) : records.length === 0 ? (
        <Card className="rounded-2xl border-slate-200 shadow-sm p-12 text-center">
          <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-sm font-bold text-slate-400">No attendance records found for {monthNames[month]} {year}</p>
        </Card>
      ) : (
        <Card className="rounded-2xl border-slate-200 shadow-sm bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left text-[9px] font-black uppercase tracking-widest text-slate-400 px-6 py-3">Employee</th>
                  <th className="text-left text-[9px] font-black uppercase tracking-widest text-slate-400 px-4 py-3">Date</th>
                  <th className="text-left text-[9px] font-black uppercase tracking-widest text-slate-400 px-4 py-3">Clock In</th>
                  <th className="text-left text-[9px] font-black uppercase tracking-widest text-slate-400 px-4 py-3">Clock Out</th>
                  <th className="text-left text-[9px] font-black uppercase tracking-widest text-slate-400 px-4 py-3">Hours</th>
                  <th className="text-left text-[9px] font-black uppercase tracking-widest text-slate-400 px-4 py-3">Status</th>
                  <th className="text-left text-[9px] font-black uppercase tracking-widest text-slate-400 px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.map((rec, idx) => (
                  <motion.tr
                    key={rec.id}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.02 }}
                    className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[10px] text-white font-black shrink-0">
                          {rec.user_name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-800">{rec.user_name || 'Unknown'}</div>
                          <div className="text-[10px] text-slate-400 font-medium">{rec.user_email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-xs font-bold text-slate-700">{formatDate(rec.date)}</td>
                    <td className="px-4 py-3.5 text-xs font-medium text-slate-600">{formatTime(rec.clock_in_time)}</td>
                    <td className="px-4 py-3.5 text-xs font-medium text-slate-600">
                      {rec.clock_out_time ? formatTime(rec.clock_out_time) : <span className="text-slate-400">Pending</span>}
                    </td>
                    <td className="px-4 py-3.5 text-xs font-bold text-slate-700">
                      {rec.working_hours ? `${rec.working_hours}h` : '—'}
                    </td>
                    <td className="px-4 py-3.5">{getStatusBadge(rec)}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="rounded-lg text-[10px] font-bold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                          onClick={() => openDetail(rec)}
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" /> View
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="rounded-lg text-[10px] font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                          onClick={() => router.push(`/superadmin/attendance/${rec.user_id}`)}
                        >
                          <Calendar className="h-3.5 w-3.5 mr-1" /> Calendar
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Detail Modal */}
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
              {/* Employee Info */}
              <div className="bg-slate-50 rounded-2xl p-4 space-y-2">
                <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-3">Employee Information</h4>
                <div className="flex items-center gap-2"><User className="h-3.5 w-3.5 text-slate-400" /><span className="text-xs font-bold text-slate-700">{detailRecord.user_name}</span></div>
                <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-slate-400" /><span className="text-xs font-medium text-slate-600">{detailRecord.user_email}</span></div>
                <div className="flex items-center gap-2"><Shield className="h-3.5 w-3.5 text-slate-400" /><span className="text-xs font-medium text-slate-600 capitalize">{detailRecord.user_role}</span></div>
              </div>

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
