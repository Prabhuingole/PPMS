'use client';

import { useState, useEffect } from 'react';
import { Fingerprint, LogIn, LogOut, Clock, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { ClockInOutModal } from './ClockInOutModal';
import axios from 'axios';

export function AttendanceWidget() {
  const { token } = useAuthStore();
  const [todayAttendance, setTodayAttendance] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'in' | 'out'>('in');
  const [submitting, setSubmitting] = useState(false);
  const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const fetchToday = async () => {
    try {
      const now = new Date();
      const res = await axios.get(`${api}/attendance/me`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { month: now.getMonth() + 1, year: now.getFullYear() }
      });
      const items = res.data?.items || [];
      const todayStr = now.toISOString().split('T')[0];
      const todayRec = items.find((r: any) => r.date === todayStr);
      setTodayAttendance(todayRec || null);
    } catch {
      setTodayAttendance(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchToday();
  }, [token]);

  const openClockIn = () => { setModalType('in'); setModalOpen(true); };
  const openClockOut = () => { setModalType('out'); setModalOpen(true); };

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
      fetchToday();
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

  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    Working: { label: 'Working', color: 'text-orange-600', bg: 'bg-orange-50' },
    Completed: { label: 'Completed', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  };

  if (loading) {
    return (
      <Card className="rounded-xl border-border shadow-sm p-5 flex items-center justify-center h-[160px]">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </Card>
    );
  }

  const status = todayAttendance?.status;
  const cfg = statusConfig[status] || null;

  return (
    <>
      <Card className="rounded-xl border-border shadow-sm p-5 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-50">
              <Fingerprint className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-foreground">Attendance Today</h3>
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
                {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'short' })}
              </p>
            </div>
          </div>
          {cfg && (
            <Badge className={cn("border-none text-[8px] font-black uppercase rounded-lg py-1 px-2.5", cfg.bg, cfg.color)}>
              {cfg.label}
            </Badge>
          )}
        </div>

        {todayAttendance ? (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-muted rounded-xl p-3">
                <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Clock In</div>
                <div className="text-sm font-black text-foreground">{formatTime(todayAttendance.clock_in_time)}</div>
              </div>
              <div className="bg-muted rounded-xl p-3">
                <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Clock Out</div>
                <div className="text-sm font-black text-foreground">
                  {todayAttendance.clock_out_time ? formatTime(todayAttendance.clock_out_time) : 'Pending'}
                </div>
              </div>
              <div className="bg-muted rounded-xl p-3">
                <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Hours</div>
                <div className="text-sm font-black text-foreground">
                  {todayAttendance.working_hours ? `${todayAttendance.working_hours}h` : '—'}
                </div>
              </div>
            </div>

            {!todayAttendance.clock_out_time && (
              <Button 
                onClick={openClockOut} 
                className="w-full bg-red-600 hover:bg-red-700 text-white rounded-xl h-10 font-bold text-xs uppercase tracking-widest shadow-lg shadow-red-600/20"
              >
                <LogOut className="mr-2 h-3.5 w-3.5" /> Clock Out
              </Button>
            )}
          </div>
        ) : (
          <Button 
            onClick={openClockIn} 
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-12 font-bold text-xs uppercase tracking-widest shadow-lg shadow-emerald-600/20"
          >
            <LogIn className="mr-2 h-4 w-4" /> Clock In
          </Button>
        )}
      </Card>

      <ClockInOutModal
        open={modalOpen}
        type={modalType}
        onClose={() => setModalOpen(false)}
        onCapture={handleCapture}
        loading={submitting}
      />
    </>
  );
}
