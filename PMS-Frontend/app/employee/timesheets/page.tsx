'use client';

import { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const myTimesheets = [
  { id: 'TS042', project: 'Identity Protocol v2', date: '2026-05-07', hours: 8.0, status: 'approved', overtime: 0, desc: 'OAuth 2.0 flow implementation for mobile clients' },
  { id: 'TS041', project: 'Cloud Migration', date: '2026-05-06', hours: 9.5, status: 'pending', overtime: 1.5, desc: 'Infrastructure audit and IAM role refinement' },
  { id: 'TS040', project: 'Internal Meeting', date: '2026-05-05', hours: 6.5, status: 'approved', overtime: 0, desc: 'Sprint planning and retrospective' },
  { id: 'TS039', project: 'Fintech Mobile v4', date: '2026-05-04', hours: 8.0, status: 'approved', overtime: 0, desc: 'Bug fixes in transaction history module' },
  { id: 'TS038', project: 'Other: Learning', date: '2026-05-03', hours: 4.0, status: 'approved', overtime: 0, desc: 'Research on React 19 features' },
];

export default function MyTimesheetsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
           <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase">Relay History</h2>
           <p className="text-slate-500 font-medium text-sm">Archived work activity for Resource Node 042</p>
        </div>
        <Link 
           href="/employee/timesheets/add"
           className={cn(buttonVariants(), "bg-indigo-600 text-white hover:bg-indigo-700 rounded-2xl h-12 px-6 shadow-xl shadow-indigo-600/20 font-bold uppercase text-xs tracking-widest")}
        >
             <Plus className="mr-2 h-4 w-4" /> Add Entry
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
         <Card className="border-slate-200 rounded-2xl p-6 bg-white shadow-sm flex flex-col justify-between group">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-8">Confirmed Syncs</div>
            <div className="flex items-end justify-between">
               <div className="text-4xl font-black text-slate-900">124</div>
               <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" />
               </div>
            </div>
         </Card>
         <Card className="border-slate-200 rounded-2xl p-6 bg-white shadow-sm flex flex-col justify-between group">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-8">Active Quota</div>
            <div className="flex items-end justify-between">
               <div className="text-4xl font-black text-slate-900">32h</div>
               <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                  <TrendingUp className="h-4 w-4" />
               </div>
            </div>
         </Card>
         <Card className="border-slate-200 rounded-2xl p-6 bg-slate-900 border-none shadow-xl text-white md:col-span-2 group overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl group-hover:scale-125 transition-transform translate-x-12 -translate-y-12"></div>
            <div className="flex justify-between items-start h-full">
               <div className="space-y-4">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Productivity Rating</span>
                  <div className="text-4xl font-black">94.2%</div>
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Optimized performance cluster</p>
               </div>
               <Button variant="ghost" className="text-white hover:bg-white/10 rounded-xl h-12 bg-white/5 border border-white/10 px-6 font-black uppercase text-[10px] tracking-widest z-10">
                  Export PDF
               </Button>
            </div>
         </Card>
      </div>

      <Card className="border-slate-200 rounded-3xl shadow-sm overflow-hidden bg-white">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-6">
           <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative w-full sm:w-96">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                 <Input 
                   placeholder="Search activity clusters..." 
                   className="h-11 pl-11 rounded-xl bg-white border-slate-200 focus-visible:ring-indigo-500/20 text-xs font-bold"
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                 />
              </div>
           </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/20">
              <TableRow className="border-slate-100">
                <TableHead className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Relay ID</TableHead>
                <TableHead className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Stream</TableHead>
                <TableHead className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Timestamp</TableHead>
                <TableHead className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Payload (h)</TableHead>
                <TableHead className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Sync Status</TableHead>
                <TableHead className="px-8 py-5 text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {myTimesheets.map((ts, i) => (
                <TableRow key={ts.id} className="group border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <TableCell className="px-8 py-5 font-mono text-[10px] font-bold text-slate-300 italic uppercase">
                    #{ts.id}
                  </TableCell>
                  <TableCell className="px-8 py-5">
                     <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-800">{ts.project}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter truncate max-w-[200px]">{ts.desc}</span>
                     </div>
                  </TableCell>
                  <TableCell className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest">
                     {ts.date}
                  </TableCell>
                  <TableCell className="px-8 py-5">
                     <div className="flex items-center">
                        <span className="text-sm font-black text-slate-900">{ts.hours.toFixed(1)}</span>
                        {ts.overtime > 0 && (
                          <Badge className="ml-2 bg-amber-50 text-amber-600 border-none font-bold text-[8px] uppercase tracking-widest px-1.5">+{ts.overtime}h</Badge>
                        )}
                     </div>
                  </TableCell>
                  <TableCell className="px-8 py-5">
                    <Badge 
                      className={cn(
                        "text-[9px] uppercase font-black px-3 py-1 rounded-lg border-none",
                        ts.status === 'approved' ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                      )}
                    >
                      {ts.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-8 py-5 text-right">
                     <Button variant="ghost" size="sm" className="h-8 w-8 text-slate-300 hover:text-indigo-600 p-0">
                        <ArrowRight className="h-4 w-4" />
                     </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
