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
import api from '@/services/api';
import { handleApiError } from '@/utils/handleApiError';
import { ErrorState } from '@/components/ui/error-state';
import { AttendanceSummaryCard } from '@/components/employee/AttendanceSummaryCard';
import { AttendanceDetailModal, AttendanceRecord } from '@/components/employee/AttendanceDetailModal';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageHeader } from '@/components/layout/PageHeader';


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
  
  
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      
      // Fetch employee info
      const empRes = await api.get(`/employees/${userId}`).catch(() => null);
      if (empRes && empRes.data) {
        setEmployeeInfo(empRes.data);
      }

      // Fetch attendance records
      const res = await api.get(`/attendance/all`, {
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
    const present = records.filter(r => r.status === 'Completed' || r.status === 'WFH').length;
    const working = records.filter(r => r.status === 'Working').length;
    const pending = records.filter(r => (r.status === 'Completed' || r.status === 'WFH') && r.timesheet_status === 'pending').length;
    
    // Calculate absent days (weekdays passed without record)
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
  }, [records, month, year]);

  const handleDayClick = (dateStr: string) => {
    const rec = records.find(r => r.date === dateStr);
    if (!rec) {
      alert(`No attendance record found for ${dateStr}`);
      return;
    }
    setDetailRecord(rec);
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
        title="Employee Calendar"
        description={`Viewing attendance calendar for ${employeeInfo?.full_name || 'Employee'}`}
        actions={
          <Button 
            variant="outline" 
            onClick={() => router.back()}
            className="h-10 rounded-lg text-muted-foreground bg-background border-border"
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Info & Stats */}
          <div className="lg:col-span-4 space-y-6">
            {/* Employee Info Card */}
            <Card className="rounded-xl border-border shadow-sm p-6 bg-background">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xl text-white font-black shrink-0 shadow-lg shadow-indigo-500/30">
                  {employeeInfo?.full_name?.charAt(0) || '?'}
                </div>
                <div>
                  <h3 className="text-lg font-black text-foreground">{employeeInfo?.full_name || 'Unknown Employee'}</h3>
                  <div className="text-xs font-bold text-primary uppercase tracking-widest">{employeeInfo?.designation || 'Employee'}</div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted/30"><Mail className="h-4 w-4 text-muted-foreground" /></div>
                  <span className="text-sm font-medium text-slate-600">{employeeInfo?.email || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted/30"><Shield className="h-4 w-4 text-muted-foreground" /></div>
                  <span className="text-sm font-medium text-slate-600 capitalize">{employeeInfo?.role || 'N/A'}</span>
                </div>
              </div>
            </Card>

            {/* Summary Stats */}
            <AttendanceSummaryCard stats={stats} />
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

      <AttendanceDetailModal 
        record={detailRecord} 
        onClose={() => setDetailRecord(null)} 
      />
    </PageLayout>
  );
}
