'use client';

import { 
  Briefcase, 
  Clock, 
  TrendingUp, 
  Zap, 
  Calendar, 
  ArrowUpRight, 
  History, 
  PlusCircle,
  FileText
} from 'lucide-react';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const stats = [
  { label: 'Assigned Projects', value: '4', icon: Briefcase, color: 'text-indigo-600', bg: 'bg-indigo-50', desc: 'Active engagements' },
  { label: "Today's Logged Hours", value: '6.5', icon: Clock, color: 'text-emerald-600', bg: 'bg-emerald-50', desc: 'Target: 8.0h' },
  { label: 'Weekly Overtime', value: '2.5', icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50', desc: 'Cumulative this week' },
  { label: 'Downtime Status', value: '0.0', icon: TrendingUp, color: 'text-slate-400', bg: 'bg-slate-50', desc: 'No idle time detected' },
];

const recentLogs = [
  { id: 1, project: 'Identity Protocol v2', hours: '4.0h', status: 'Approved', date: 'Yesterday' },
  { id: 2, project: 'Cloud Migration', hours: '2.5h', status: 'Pending', date: 'Today' },
  { id: 3, project: 'Internal Meeting', hours: '1.0h', status: 'Approved', date: 'Monday' },
];

export default function EmployeeDashboard() {
  return (
    <div className="space-y-8 max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase">Operational Console</h2>
          <p className="text-slate-500 font-medium text-sm">Welcome back, Resource Node 042</p>
        </div>
        <div className="flex items-center gap-3">
           <Link 
             href="/employee/timesheets/add"
             className={cn(buttonVariants(), "bg-indigo-600 text-white hover:bg-indigo-700 rounded-2xl h-12 px-6 shadow-xl shadow-indigo-600/20 font-bold uppercase text-xs tracking-widest")}
           >
              <PlusCircle className="mr-2 h-4 w-4" /> Log Activity
           </Link>
        </div>
      </div>

      {/* Bento Grid Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="border-slate-200 rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow group h-full flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className={cn("p-2 rounded-lg transition-transform group-hover:scale-110", stat.bg)}>
                  <stat.icon className={cn("h-4 w-4", stat.color)} />
                </div>
                <Badge className={cn("bg-slate-50 text-slate-400 border-none font-bold text-[9px] uppercase tracking-widest", stat.color === 'text-emerald-600' && 'bg-emerald-50 text-emerald-600')}>
                   {stat.color === 'text-emerald-600' ? 'On Track' : 'Normal'}
                </Badge>
              </div>
              <div className="mt-8">
                <div className="text-3xl font-black text-slate-900">{stat.value}{stat.label.includes('Hours') && 'h'}</div>
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">{stat.label}</div>
                <p className="text-[10px] text-slate-400 font-bold mt-2 italic">{stat.desc}</p>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Weekly Bandwidth Chart Placeholder/Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="col-span-1 md:col-span-8"
        >
          <Card className="rounded-3xl border-slate-200 shadow-sm p-8 bg-white h-full flex flex-col">
             <div className="flex items-center justify-between mb-8">
                <div>
                   <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Weekly Utilization</h3>
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Resource Bandwidth Monitor</p>
                </div>
                <div className="text-right">
                   <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-xl">88% Capacity</span>
                </div>
             </div>

             <div className="space-y-6 flex-1">
                {[
                  { day: 'Monday', hours: 8, color: 'bg-indigo-500' },
                  { day: 'Tuesday', hours: 9.5, color: 'bg-indigo-600' },
                  { day: 'Wednesday', hours: 6.5, color: 'bg-indigo-400' },
                  { day: 'Thursday', hours: 8, color: 'bg-indigo-500' },
                  { day: 'Friday', hours: 4, color: 'bg-slate-200' },
                ].map((item, idx) => (
                  <div key={idx} className="space-y-2">
                     <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                        <span>{item.day}</span>
                        <span>{item.hours}h</span>
                     </div>
                     <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${(item.hours / 10) * 100}%` }}
                          transition={{ duration: 1, delay: 0.5 + idx * 0.1 }}
                          className={cn("h-full rounded-full", item.color)} 
                        />
                     </div>
                  </div>
                ))}
             </div>

             <div className="mt-8 pt-8 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-6">
                   <div>
                      <span className="text-[9px] font-black uppercase text-slate-400 block mb-1">Weekly Target</span>
                      <span className="text-sm font-black text-slate-800">40.0h</span>
                   </div>
                   <div>
                      <span className="text-[9px] font-black uppercase text-slate-400 block mb-1">Current Sync</span>
                      <span className="text-sm font-black text-indigo-600">32.0h</span>
                   </div>
                </div>
                <Button variant="ghost" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600">
                  Full Analytics <ArrowUpRight className="ml-2 h-3 w-3" />
                </Button>
             </div>
          </Card>
        </motion.div>

        {/* Recent Activity Sidebar */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="col-span-1 md:col-span-4"
        >
          <Card className="rounded-3xl border-slate-200 shadow-xl bg-slate-900 p-8 text-white h-full flex flex-col relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -translate-y-16 translate-x-16 blur-2xl group-hover:scale-125 transition-transform"></div>
             
             <h3 className="font-bold text-lg mb-6 flex items-center space-x-2 z-10">
                <span>Recent Relays</span>
                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></span>
             </h3>

             <div className="space-y-6 flex-1 z-10">
                {recentLogs.map((log) => (
                  <div key={log.id} className="flex items-start justify-between group/item">
                     <div className="flex flex-col min-w-0">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{log.date}</span>
                        <span className="text-sm font-bold truncate group-hover/item:text-indigo-400 transition-colors">{log.project}</span>
                        <span className="text-[10px] font-medium text-slate-400 mt-0.5">{log.hours} documented</span>
                     </div>
                     <Badge className={cn(
                       "bg-white/10 text-white border-none font-bold text-[8px] uppercase tracking-widest h-fit",
                       log.status === 'Approved' ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
                     )}>
                        {log.status}
                     </Badge>
                  </div>
                ))}
             </div>

             <Button className="w-full mt-8 bg-indigo-600 text-white hover:bg-indigo-500 transition-all rounded-xl py-6 font-bold text-xs uppercase tracking-widest shadow-lg shadow-indigo-900/40 relative z-10 overflow-hidden">
                <span className="relative z-10">View Audit Log</span>
                <History className="ml-2 h-3.5 w-3.5 relative z-10" />
             </Button>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
