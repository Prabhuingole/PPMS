'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Fingerprint, Loader2, Eye, X, Clock, User, Mail, Shield, Calendar, Search, MoreHorizontal } from 'lucide-react';
import { motion } from 'motion/react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import api from '@/services/api';
import { handleApiError } from '@/utils/handleApiError';
import { ErrorState } from '@/components/ui/error-state';
import { AttendanceStatusBadge } from '@/components/employee/AttendanceStatusBadge';
import { AttendanceDetailModal, AttendanceRecord } from '@/components/employee/AttendanceDetailModal';
import { ManagementLayout } from '@/components/layout/ManagementLayout';
import { FilterGroup } from '@/components/ui/filter-group';
import { EmptyState } from '@/components/ui/EmptyState';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DataTable } from '@/components/ui/data-table';
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
} from "@/components/ui/select";


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
  
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { month, year, limit: 200 };
      if (statusFilter && statusFilter !== 'all') params.status = statusFilter;
      const res = await api.get(`/attendance/all`, {
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

  const openDetail = (rec: AttendanceRecord) => {
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


  const monthNames = ['','January','February','March','April','May','June','July','August','September','October','November','December'];

  const filteredRecords = records.filter(rec => 
    !searchTerm || 
    rec.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    rec.user_email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <ManagementLayout
        title="Attendance Management"
        description="View and audit all employee attendance records"
      >
        <DataTable
          data={filteredRecords}
          isLoading={loading}
          searchPlaceholder="Search employees..."
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          filters={
            <div className="flex flex-wrap items-center gap-3">
                <Select value={month.toString()} onValueChange={(val) => setMonth(Number(val))}>
                  <SelectTrigger className="w-[140px] h-10 bg-background text-sm font-medium text-muted-foreground border-border">
                    <SelectValue placeholder="Select Month" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()}>
                        {monthNames[i + 1]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={year.toString()} onValueChange={(val) => setYear(Number(val))}>
                  <SelectTrigger className="w-[100px] h-10 bg-background text-sm font-medium text-muted-foreground border-border">
                    <SelectValue placeholder="Select Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {[2024, 2025, 2026, 2027].map((y) => (
                      <SelectItem key={y} value={y.toString()}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              <FilterGroup 
                options={[
                  { label: 'All', value: 'all' },
                  { label: 'Working', value: 'Working' },
                  { label: 'Completed', value: 'Completed' }
                ]}
                value={statusFilter || 'all'}
                onChange={val => setStatusFilter(val === 'all' ? '' : val)}
              />
            </div>
          }
          toolbarActions={
            <Badge variant="secondary" className="bg-muted text-muted-foreground hover:bg-slate-200 rounded-md px-2 py-1 font-medium">
              {filteredRecords.length} records
            </Badge>
          }
          emptyState={
            <EmptyState 
              icon={Calendar}
              title="No Records Found"
              description={searchTerm ? `No matches for "${searchTerm}"` : `No attendance records found for ${monthNames[month]} ${year}.`}
            />
          }
          columns={[
            {
              header: 'Employee',
              accessorKey: 'user_name',
              sortable: true,
              cell: (rec) => (
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs bg-muted text-slate-600 font-medium border border-border">
                      {rec.user_name?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">{rec.user_name || 'Unknown'}</span>
                    <span className="text-xs text-muted-foreground">{rec.user_email}</span>
                  </div>
                </div>
              )
            },
            {
              header: 'Date',
              accessorKey: 'date',
              sortable: true,
              cell: (rec) => <span className="text-sm text-muted-foreground font-medium">{formatDate(rec.date)}</span>
            },
            {
              header: 'Clock In',
              accessorKey: 'clock_in_time',
              cell: (rec) => <span className="text-sm text-slate-600">{formatTime(rec.clock_in_time)}</span>
            },
            {
              header: 'Clock Out',
              accessorKey: 'clock_out_time',
              hideOnMobile: true,
              cell: (rec) => rec.clock_out_time ? (
                <span className="text-sm text-slate-600">{formatTime(rec.clock_out_time)}</span>
              ) : (
                <span className="text-sm text-muted-foreground italic">Pending</span>
              )
            },
            {
              header: 'Hours',
              accessorKey: 'working_hours',
              sortable: true,
              hideOnMobile: true,
              cell: (rec) => (
                <span className="text-sm font-semibold text-foreground">
                  {rec.working_hours ? `${rec.working_hours}h` : '—'}
                </span>
              )
            },
            {
              header: 'Status',
              accessorKey: 'status',
              sortable: true,
              cell: (rec) => <AttendanceStatusBadge status={rec.status} timesheetStatus={rec.timesheet_status} />
            },
            {
              header: 'Actions',
              align: 'right',
              width: '50px',
              cell: (rec) => (
                <div className="flex items-center justify-end ">
                  <DropdownMenu>
                    <DropdownMenuTrigger className="h-8 w-8 p-0 inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground">
<span className="sr-only">Open menu</span>
<MoreHorizontal className="h-4 w-4" />
</DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        onClick={() => openDetail(rec)}
                        className="cursor-pointer"
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View Detail
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => router.push(`/superadmin/attendance/${rec.user_id}`)}
                        className="cursor-pointer"
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        User Calendar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )
            }
          ]}
        />
      </ManagementLayout>

      {/* Detail Modal */}
      <AttendanceDetailModal 
        record={detailRecord} 
        onClose={() => setDetailRecord(null)} 
      />
    </>
  );
}

