'use client';

import { useState } from 'react';
import { 
  Check, 
  X, 
  Clock, 
  Calendar as CalendarIcon, 
  Filter, 
  Search, 
  ArrowUpRight,
  TrendingUp,
  History,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const pendingTimesheets = [
  { id: 'TS001', employee: 'Alice Vance', initials: 'AV', project: 'Identity Protocol v2', date: '2026-05-06', hours: 8, status: 'pending', desc: 'Design review and documentation phase' },
  { id: 'TS002', employee: 'Bob Smith', initials: 'BS', project: 'Cloud Migration', date: '2026-05-06', hours: 7.5, status: 'pending', desc: 'S3 bucket policy auditing and IAM cleanup' },
  { id: 'TS003', employee: 'Charlie Day', initials: 'CD', project: 'Fintech Mobile v4', date: '2026-05-05', hours: 9, status: 'pending', desc: 'Integration with Stripe Connect API' },
  { id: 'TS004', employee: 'Diana Ross', initials: 'DR', project: 'Identity Protocol v2', date: '2026-05-05', hours: 8, status: 'pending', desc: 'OAuth 2.0 flow stabilization' },
];

export default function TimesheetApprovalPage() {
  const [timesheets, setTimesheets] = useState(pendingTimesheets);

  const handleAction = (id: string, action: 'approve' | 'reject') => {
    setTimesheets(prev => prev.filter(ts => ts.id !== id));
    toast.success(`Timesheet ${id} ${action === 'approve' ? 'approved' : 'rejected'}`);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase">Relay Verifier</h2>
          <p className="text-slate-500 font-medium text-sm">Authenticating resource logs for billing cycles</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
             <Button variant="ghost" size="sm" className="bg-white text-slate-900 shadow-sm rounded-lg text-xs font-bold px-4">Pending</Button>
             <Button variant="ghost" size="sm" className="text-slate-500 rounded-lg text-xs font-bold px-4 hover:bg-slate-50">History</Button>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         <Card className="col-span-1 border-slate-200 rounded-3xl p-6 bg-indigo-600 text-white shadow-xl shadow-indigo-600/20 flex flex-col justify-between overflow-hidden relative group">
            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-125 transition-transform"></div>
            <div className="space-y-1 z-10">
               <span className="text-[10px] font-black uppercase tracking-widest opacity-70">Awaiting Auth</span>
               <div className="text-4xl font-black">{timesheets.length}</div>
            </div>
            <div className="mt-8 flex items-center justify-between z-10">
               <div className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-2 py-1 rounded-lg border border-white/10">Action Required</div>
               <Clock className="h-6 w-6 opacity-30" />
            </div>
         </Card>
         <Card className="col-span-1 border-slate-200 rounded-3xl p-6 bg-white shadow-sm flex flex-col justify-between overflow-hidden border border-slate-200 group">
            <div className="space-y-1">
               <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Hours</span>
               <div className="text-4xl font-black text-slate-900">{timesheets.reduce((acc, curr) => acc + curr.hours, 0)}h</div>
            </div>
            <div className="mt-8 flex items-center justify-between">
               <div className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">Verified Batch</div>
               <TrendingUp className="h-6 w-6 text-slate-100 group-hover:text-emerald-200 transition-colors" />
            </div>
         </Card>
         <Card className="col-span-2 border-slate-200 rounded-3xl p-6 bg-white shadow-sm border border-slate-200 flex items-center">
            <div className="flex-1 space-y-4">
               <div>
                  <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">System Performance</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Throughput: 94.2% Verified</p>
               </div>
               <div className="h-3 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '94%' }}
                    className="h-full bg-indigo-600 rounded-full shadow-inner" 
                  />
               </div>
            </div>
            <div className="ml-8 hidden lg:block">
               <div className="w-16 h-16 rounded-2xl border-4 border-indigo-600 border-t-slate-50 flex items-center justify-center font-black animate-spin duration-[3s]">
                  <span className="animate-none origin-bottom-right scale-75">⚡</span>
               </div>
            </div>
         </Card>
      </div>

      <Card className="border-slate-200 rounded-3xl shadow-sm overflow-hidden bg-white">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input placeholder="Search logs by resource or node..." className="pl-11 h-12 bg-white rounded-2xl border-slate-200 focus-visible:ring-indigo-500/20 transition-all shadow-sm" />
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" className="h-12 rounded-2xl border-slate-200 px-6 font-bold text-xs uppercase tracking-widest text-slate-500">
                <Filter className="mr-2 h-4 w-4" /> Filter Stream
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/20">
              <TableRow className="border-slate-50">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Resource Node</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Project Stream</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Log Date</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Duration</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Status</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Integrity Verification</th>
              </TableRow>
            </TableHeader>
            <TableBody>
              {timesheets.length === 0 ? (
                <TableRow>
                   <TableCell colSpan={6} className="py-20 text-center">
                      <div className="flex flex-col items-center max-w-xs mx-auto">
                         <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-200 mb-4 border border-slate-100">
                            <History className="h-8 w-8" />
                         </div>
                         <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Queue Depleted</h3>
                         <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2 leading-relaxed">
                            No logs currently awaiting manual verification. Review the archive for historical data.
                         </p>
                      </div>
                   </TableCell>
                </TableRow>
              ) : (
                timesheets.map((ts, i) => (
                  <motion.tr 
                    key={ts.id}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="group border-slate-50 hover:bg-slate-50/50 transition-all border-l-2 border-l-transparent hover:border-l-indigo-600"
                  >
                    <TableCell className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-10 w-10 border-2 border-white shadow-sm ring-1 ring-slate-100">
                          <AvatarFallback className="bg-slate-900 text-white font-black text-[10px]">
                            {ts.initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-slate-800">{ts.employee}</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter italic max-w-[200px] truncate">{ts.desc}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-8 py-6">
                       <div className="inline-flex items-center space-x-2 px-3 py-1 bg-slate-100 rounded-lg border border-slate-200">
                          <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                          <span className="text-[10px] font-black text-slate-700 uppercase tracking-tight">{ts.project}</span>
                       </div>
                    </TableCell>
                    <TableCell className="px-8 py-6">
                       <div className="flex items-center text-xs font-bold text-slate-600">
                          <CalendarIcon className="mr-2 h-3.5 w-3.5 text-slate-300" />
                          {ts.date}
                       </div>
                    </TableCell>
                    <TableCell className="px-8 py-6">
                       <div className="flex items-center">
                          <div className="text-sm font-black text-slate-800">{ts.hours}h</div>
                          {ts.hours > 8 && (
                            <Badge className="ml-2 bg-amber-50 text-amber-600 border-none font-bold text-[9px] uppercase tracking-widest px-1.5">OT</Badge>
                          )}
                       </div>
                    </TableCell>
                    <TableCell className="px-8 py-6">
                      <Badge className="bg-slate-50 text-slate-400 font-black text-[9px] uppercase tracking-widest border-none px-3 py-1 rounded-lg">
                        {ts.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-2.5 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-10 w-10 p-0 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-600 hover:text-white transition-all shadow-lg shadow-emerald-600/0 hover:shadow-emerald-600/20"
                          onClick={() => handleAction(ts.id, 'approve')}
                        >
                          <Check className="h-5 w-5" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-10 w-10 p-0 rounded-xl bg-red-50 text-red-600 border border-red-100 hover:bg-red-600 hover:text-white transition-all shadow-lg shadow-red-600/0 hover:shadow-red-600/20"
                          onClick={() => handleAction(ts.id, 'reject')}
                        >
                          <X className="h-5 w-5" />
                        </Button>
                      </div>
                    </TableCell>
                  </motion.tr>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
