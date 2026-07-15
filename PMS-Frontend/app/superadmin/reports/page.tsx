'use client';

import { useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Filter, Search, Users, CheckCircle, Clock, XCircle, AlertTriangle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { handleApiError } from '@/utils/handleApiError';
import { format, subDays, startOfMonth } from 'date-fns';
import { AttendanceSummaryRecord, DailyAttendanceRecord } from '@/types';
import { ErrorState } from '@/components/ui/error-state';

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState('last_30_days');
  const [activeTab, setActiveTab] = useState('attendance');
  const [search, setSearch] = useState('');

  const getDateParams = (range: string): Record<string, string> => {
    const today = new Date();
    if (range === 'today') return { start_date: format(today, 'yyyy-MM-dd'), end_date: format(today, 'yyyy-MM-dd') };
    if (range === 'last_7_days') return { start_date: format(subDays(today, 7), 'yyyy-MM-dd'), end_date: format(today, 'yyyy-MM-dd') };
    if (range === 'last_30_days') return { start_date: format(subDays(today, 30), 'yyyy-MM-dd'), end_date: format(today, 'yyyy-MM-dd') };
    if (range === 'this_month') return { start_date: format(startOfMonth(today), 'yyyy-MM-dd'), end_date: format(today, 'yyyy-MM-dd') };
    return {};
  };

  // Fetch Attendance Summary
  const { data: attendanceData, isLoading, error } = useQuery({
    queryKey: ['reports', 'attendance', dateRange],
    queryFn: async () => {
      const params = new URLSearchParams(getDateParams(dateRange)).toString();
      const response = await api.get(`/reports/attendance?${params}`);
      return response.data as AttendanceSummaryRecord[];
    }
  });

  // Fetch Daily Logs
  const { data: dailyData, isLoading: dailyLoading } = useQuery({
    queryKey: ['reports', 'daily', dateRange],
    queryFn: async () => {
      const params = new URLSearchParams(getDateParams(dateRange)).toString();
      const response = await api.get(`/reports/attendance/daily?${params}`);
      return response.data as DailyAttendanceRecord[];
    }
  });

  const handleExport = async (type: string) => {
    try {
      const params = new URLSearchParams({ report_type: type, ...getDateParams(dateRange) }).toString();
      const response = await api.post(`/reports/export?${params}`, null, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Report_${type}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err: any) {
      handleApiError(err);
    }
  };

  if (error) return <ErrorState title="Failed to load reports" />;

  return (
    <PageLayout>
      <PageHeader 
        title="Reports" 
        description="Monitor attendance, working hours, and productivity"
      />

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input 
              type="text"
              placeholder="Search employee..."
              className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px] bg-background border-border rounded-xl">
              <SelectValue placeholder="Date Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="last_7_days">Last 7 Days</SelectItem>
              <SelectItem value="last_30_days">Last 30 Days</SelectItem>
              <SelectItem value="this_month">This Month</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            className="rounded-xl bg-background"
          >
            <Filter className="mr-2 h-4 w-4" /> Filters
          </Button>
          <Button 
            onClick={() => handleExport(activeTab)}
            className="rounded-xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
          >
            <Download className="mr-2 h-4 w-4" /> Export Excel
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4 border-border bg-card/50 backdrop-blur-sm shadow-sm rounded-xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Users className="h-5 w-5" /></div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Team Members</div>
              <div className="text-2xl font-black">{attendanceData?.length || 0}</div>
            </div>
          </div>
        </Card>
        <Card className="p-4 border-border bg-card/50 backdrop-blur-sm shadow-sm rounded-xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 text-green-600 rounded-lg"><CheckCircle className="h-5 w-5" /></div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Present Today</div>
              <div className="text-2xl font-black">—</div>
            </div>
          </div>
        </Card>
        <Card className="p-4 border-border bg-card/50 backdrop-blur-sm shadow-sm rounded-xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 text-red-600 rounded-lg"><XCircle className="h-5 w-5" /></div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Absent Today</div>
              <div className="text-2xl font-black">—</div>
            </div>
          </div>
        </Card>
        <Card className="p-4 border-border bg-card/50 backdrop-blur-sm shadow-sm rounded-xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 text-orange-600 rounded-lg"><AlertTriangle className="h-5 w-5" /></div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Missing Records</div>
              <div className="text-2xl font-black">—</div>
            </div>
          </div>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-muted p-1 rounded-xl mb-6 inline-flex w-auto">
          <TabsTrigger value="attendance" className="rounded-lg text-sm font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm px-6">Attendance Summary</TabsTrigger>
          <TabsTrigger value="daily" className="rounded-lg text-sm font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm px-6">Daily Logs</TabsTrigger>
          <TabsTrigger value="timesheets" className="rounded-lg text-sm font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm px-6">Timesheet Compliance</TabsTrigger>
          <TabsTrigger value="productivity" className="rounded-lg text-sm font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm px-6">Productivity</TabsTrigger>
        </TabsList>

        <TabsContent value="attendance" className="m-0">
          <Card className="rounded-2xl border-border bg-card overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="p-4 text-xs font-black uppercase tracking-wider text-muted-foreground">Employee</th>
                    <th className="p-4 text-xs font-black uppercase tracking-wider text-muted-foreground">Company</th>
                    <th className="p-4 text-xs font-black uppercase tracking-wider text-muted-foreground">Working Days</th>
                    <th className="p-4 text-xs font-black uppercase tracking-wider text-muted-foreground">Present</th>
                    <th className="p-4 text-xs font-black uppercase tracking-wider text-muted-foreground">Absent</th>
                    <th className="p-4 text-xs font-black uppercase tracking-wider text-muted-foreground">Missing Out</th>
                    <th className="p-4 text-xs font-black uppercase tracking-wider text-muted-foreground">Total Hours</th>
                    {dateRange === 'today' && <th className="p-4 text-xs font-black uppercase tracking-wider text-muted-foreground">Clock In</th>}
                    {dateRange === 'today' && <th className="p-4 text-xs font-black uppercase tracking-wider text-muted-foreground">Clock Out</th>}
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={dateRange === 'today' ? 9 : 7} className="p-8 text-center text-muted-foreground">Loading attendance data...</td>
                    </tr>
                  ) : attendanceData?.length === 0 ? (
                    <tr>
                      <td colSpan={dateRange === 'today' ? 9 : 7} className="p-8 text-center text-muted-foreground">No records found.</td>
                    </tr>
                  ) : (
                    attendanceData?.map((record) => (
                      <tr key={record.user_id} className="border-b border-border hover:bg-muted/30 transition-colors">
                        <td className="p-4">
                          <div className="font-bold text-sm text-foreground">{record.name}</div>
                          <div className="text-xs text-muted-foreground">{record.employee_id}</div>
                        </td>
                        <td className="p-4 text-sm">{record.company}</td>
                        <td className="p-4 text-sm font-medium">{record.total_working_days}</td>
                        <td className="p-4 text-sm font-medium text-green-600">{record.present_days}</td>
                        <td className="p-4 text-sm font-medium text-red-600">{record.absent_days}</td>
                        <td className="p-4 text-sm font-medium text-orange-600">{record.missing_clock_out}</td>
                        <td className="p-4 text-sm font-bold">{record.total_working_hours}h</td>
                        {dateRange === 'today' && (
                          <td className="p-4 text-sm whitespace-nowrap">
                            {record.clock_in ? format(new Date(record.clock_in + (!record.clock_in.endsWith('Z') ? 'Z' : '')), 'hh:mm a') : '—'}
                          </td>
                        )}
                        {dateRange === 'today' && (
                          <td className="p-4 text-sm whitespace-nowrap">
                            {record.clock_out ? format(new Date(record.clock_out + (!record.clock_out.endsWith('Z') ? 'Z' : '')), 'hh:mm a') : '—'}
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="daily" className="m-0">
          <Card className="rounded-2xl border-border bg-card overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="p-4 text-xs font-black uppercase tracking-wider text-muted-foreground">Date</th>
                    <th className="p-4 text-xs font-black uppercase tracking-wider text-muted-foreground">Employee</th>
                    <th className="p-4 text-xs font-black uppercase tracking-wider text-muted-foreground">Clock In</th>
                    <th className="p-4 text-xs font-black uppercase tracking-wider text-muted-foreground">Clock Out</th>
                    <th className="p-4 text-xs font-black uppercase tracking-wider text-muted-foreground">Total Hours</th>
                    <th className="p-4 text-xs font-black uppercase tracking-wider text-muted-foreground">Status</th>
                    <th className="p-4 text-xs font-black uppercase tracking-wider text-muted-foreground">Timesheet Filled</th>
                  </tr>
                </thead>
                <tbody>
                  {dailyLoading ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-muted-foreground">Loading daily logs...</td>
                    </tr>
                  ) : dailyData?.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-muted-foreground">No records found.</td>
                    </tr>
                  ) : (
                    dailyData?.map((record, idx) => (
                      <tr key={`${record.user_id}-${record.date}-${idx}`} className="border-b border-border hover:bg-muted/30 transition-colors">
                        <td className="p-4 text-sm font-medium">{format(new Date(record.date), 'MMM dd, yyyy')}</td>
                        <td className="p-4">
                          <div className="font-bold text-sm text-foreground">{record.name}</div>
                          <div className="text-xs text-muted-foreground">{record.employee_id}</div>
                        </td>
                        <td className="p-4 text-sm whitespace-nowrap">
                          {record.clock_in ? format(new Date(record.clock_in + (!record.clock_in.endsWith('Z') ? 'Z' : '')), 'hh:mm a') : '—'}
                        </td>
                        <td className="p-4 text-sm whitespace-nowrap">
                          {record.clock_out ? format(new Date(record.clock_out + (!record.clock_out.endsWith('Z') ? 'Z' : '')), 'hh:mm a') : '—'}
                        </td>
                        <td className="p-4 text-sm font-bold">{record.total_hours}h</td>
                        <td className="p-4 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${record.status === 'Present' ? 'bg-green-100 text-green-700' : record.status === 'Absent' ? 'bg-red-100 text-red-700' : record.status === 'Yet to Clock Out' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                            {record.status}
                          </span>
                        </td>
                        <td className="p-4 text-sm">
                          {record.timesheet_filled ? (
                            <div className="flex items-center text-green-600"><CheckCircle className="h-4 w-4 mr-1" /> Yes</div>
                          ) : (
                            <div className="flex items-center text-red-600"><XCircle className="h-4 w-4 mr-1" /> No</div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
        <TabsContent value="timesheets" className="m-0">
          <Card className="rounded-2xl border-border bg-card p-12 text-center shadow-sm">
            <h3 className="text-lg font-bold text-foreground mb-2">Timesheet Compliance Report</h3>
            <p className="text-sm text-muted-foreground">Coming soon</p>
          </Card>
        </TabsContent>
        <TabsContent value="productivity" className="m-0">
          <Card className="rounded-2xl border-border bg-card p-12 text-center shadow-sm">
            <h3 className="text-lg font-bold text-foreground mb-2">Productivity Report</h3>
            <p className="text-sm text-muted-foreground">Coming soon</p>
          </Card>
        </TabsContent>
      </Tabs>
    </PageLayout>
  );
}
