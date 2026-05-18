'use client';

import { 
  Users, 
  UserRound, 
  Briefcase, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Calendar,
  ArrowUpRight,
  TrendingUp,
  Activity,
  Zap
} from 'lucide-react';
import { motion } from 'motion/react';
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
import { Button } from '@/components/ui/button';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line,
  Cell,
  PieChart,
  Pie,
  AreaChart,
  Area
} from 'recharts';
import { cn } from '@/lib/utils';

const stats = [
  { label: 'Total Employees', value: '142', icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: '+12%', trendUp: true },
  { label: 'Total Projects', value: '38', icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-50', trend: 'Active: 24', trendUp: true },
  { label: 'Pending Timesheets', value: '29', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', trend: 'Action Req.', trendUp: true },
  { label: 'System Health', value: '99.8%', icon: Zap, color: 'text-emerald-500', bg: 'bg-emerald-50/50', trend: 'Live', trendUp: true },
];

const projectOverviews = [
  { name: 'Infrastructure Migration (Google Cloud)', progress: 75, color: 'bg-blue-500', status: 'In Progress' },
  { name: 'Mobile App Revamp v2.0', progress: 42, color: 'bg-emerald-500', status: 'Active' },
  { name: 'Client Portal Integration', progress: 91, color: 'bg-amber-500', status: 'Near Completion' },
];

const recentLogs = [
  { id: 1, user: 'Marcus Kane', initials: 'MK', action: 'logged 8h', project: 'Infrastructure Migration', time: '2h ago' },
  { id: 2, user: 'Elena Lopez', initials: 'EL', action: 'logged 4.5h', project: 'Mobile App Revamp', time: '4h ago' },
  { id: 3, user: 'Late Entry Notification', initials: '⚠️', action: 'David Smith missed Wed', project: 'System Alert', time: '5h ago', warning: true },
  { id: 4, user: 'Jordan Singh', initials: 'JS', action: 'approved logs', project: 'Product Design', time: '6h ago' },
];

const employeeStatus = [
  { name: 'Sarah Jenkins', dept: 'Engineering', project: 'Infra Migration', today: '8.0h', weekly: '40h / 40h', status: 'Active' },
  { name: 'Michael Cho', dept: 'Design', project: 'Mobile v2.0', today: '6.5h', weekly: '32h / 40h', status: 'Active' },
  { name: 'David Lee', dept: 'Engineering', project: 'Cloud Security', today: '4.0h', weekly: '38h / 40h', status: 'On Leave' },
];

export default function DashboardPage() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-5 h-full max-w-[1600px] mx-auto">
      {/* Stat Cards Row */}
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="col-span-1 md:col-span-3"
        >
          <Card className="border-slate-200 rounded-2xl shadow-sm h-full flex flex-col justify-between p-5 hover:shadow-md transition-shadow group">
            <div className="flex justify-between items-start">
              <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">{stat.label}</span>
              <span className={cn(
                "text-[10px] px-2 py-0.5 rounded font-bold",
                stat.bg,
                stat.color
              )}>
                {stat.trend}
              </span>
            </div>
            <div className="mt-4 flex items-end justify-between">
               <div className="text-3xl font-bold text-slate-900">{stat.value}</div>
               <div className={cn("p-2 rounded-lg transition-transform group-hover:scale-110", stat.bg)}>
                  <stat.icon className={cn("h-4 w-4", stat.color)} />
               </div>
            </div>
          </Card>
        </motion.div>
      ))}

      {/* Main Project Overview Column */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.4 }}
        className="col-span-1 md:col-span-8 row-span-1 md:row-span-3"
      >
        <Card className="h-full border-slate-200 rounded-2xl shadow-sm p-6 overflow-hidden flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <div>
               <h3 className="text-lg font-bold text-slate-900">Active Projects Overview</h3>
               <p className="text-xs text-slate-400 mt-1">Real-time status of current development cycles</p>
            </div>
            <div className="flex space-x-2">
              <button className="text-[10px] font-bold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors">Weekly</button>
              <button className="text-[10px] font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg">Monthly</button>
            </div>
          </div>
          
          <div className="flex-1 space-y-8">
            {projectOverviews.map((proj, idx) => (
              <div key={idx} className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                   <div className="flex items-center space-x-2">
                      <div className={cn("w-2 h-2 rounded-full", proj.color.replace('bg-', 'bg-'))}></div>
                      <span className="font-bold text-slate-800">{proj.name}</span>
                   </div>
                   <span className="text-slate-400 font-medium">{proj.progress}% Complete</span>
                </div>
                <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                   <motion.div 
                     initial={{ width: 0 }}
                     animate={{ width: `${proj.progress}%` }}
                     transition={{ duration: 1, delay: 0.6 + (idx * 0.2) }}
                     className={cn("h-full rounded-full shadow-inner", proj.color)} 
                   />
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-6 pt-8 border-t border-slate-100 mt-auto">
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400 mb-1 tracking-wider">Utilization</div>
              <div className="text-xl font-bold flex items-center">
                 88.4% <ArrowUpRight className="h-4 w-4 text-emerald-500 ml-1" />
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400 mb-1 tracking-wider">Avg Hours/Day</div>
              <div className="text-xl font-bold">7.2h</div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400 mb-1 tracking-wider">Productivity</div>
              <div className="text-xl font-bold text-blue-600">+4.2%</div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Recent Logs / Activity Sidebar Column */}
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5 }}
        className="col-span-1 md:col-span-4 row-span-1 md:row-span-3"
      >
        <Card className="h-full bg-slate-900 border-none rounded-2xl shadow-xl p-6 text-white flex flex-col relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -translate-y-16 translate-x-16 blur-2xl"></div>
          
          <h3 className="font-bold text-lg mb-6 flex items-center space-x-2 z-10">
            <span>Recent Logs</span>
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></span>
          </h3>
          
          <div className="space-y-6 flex-1 z-10">
            {recentLogs.map((log) => (
              <div key={log.id} className="flex items-start space-x-4 group/item">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center text-sm shrink-0 font-bold border transition-all group-hover/item:scale-110",
                  log.warning 
                    ? "bg-amber-900/40 border-amber-800/50 text-amber-200" 
                    : "bg-slate-800 border-slate-700 text-slate-300"
                )}>
                  {log.initials}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-semibold truncate">
                    {log.user} <span className="text-slate-500 font-normal ml-1">{log.action}</span>
                  </span>
                  <div className="flex items-center space-x-2 mt-0.5">
                    <span className="text-[10px] text-slate-500 truncate">{log.project}</span>
                    <span className="text-[10px] text-slate-600 font-mono italic">{log.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Button className="w-full mt-8 bg-blue-600 text-white hover:bg-blue-500 transition-all rounded-xl py-6 font-bold text-sm shadow-lg shadow-blue-900/40 group-hover:translate-y-[-2px]">
            View All System Logs
          </Button>
        </Card>
      </motion.div>

      {/* Bottom Row - Resource Status Table */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="col-span-1 md:col-span-12 row-span-1 md:row-span-2"
      >
        <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
          <div className="px-8 py-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center bg-slate-50/50 gap-4">
             <div className="flex items-center space-x-3">
                <div className="p-2 bg-white rounded-lg border border-slate-200">
                   <Activity className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                   <h3 className="text-sm font-bold text-slate-800">Employee Resource Status</h3>
                   <p className="text-[10px] text-slate-400 font-medium">Monitoring bandwidth across active project streams</p>
                </div>
             </div>
             <div className="flex items-center space-x-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                   <input 
                     type="text" 
                     placeholder="Search employees..." 
                     className="w-full bg-white border border-slate-200 rounded-xl px-9 py-2 text-xs outline-none focus:border-blue-400 transition-colors shadow-sm" 
                   />
                </div>
                <Button className="bg-blue-600 text-white hover:bg-blue-700 px-5 rounded-xl text-xs font-bold shrink-0 shadow-md">
                  + Add New
                </Button>
             </div>
          </div>
          <div className="flex-1 overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/30">
                <TableRow className="border-slate-50">
                  <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-left">Employee Name</th>
                  <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-left">Department</th>
                  <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-left">Primary Project</th>
                  <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-left">Today&apos;s Hours</th>
                  <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-left">Weekly Load</th>
                  <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-left">Status</th>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employeeStatus.map((emp, idx) => (
                  <TableRow key={idx} className="border-slate-50 hover:bg-slate-50/80 transition-colors group">
                    <TableCell className="px-8 py-3">
                       <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-[10px] text-slate-600">
                             {emp.name.split(' ').map(n=>n[0]).join('')}
                          </div>
                          <span className="text-xs font-bold text-slate-700 group-hover:text-blue-600 transition-colors">{emp.name}</span>
                       </div>
                    </TableCell>
                    <TableCell className="px-8 py-3 text-xs text-slate-500 font-medium">{emp.dept}</TableCell>
                    <TableCell className="px-8 py-3 text-xs text-slate-900 font-semibold">{emp.project}</TableCell>
                    <TableCell className="px-8 py-3 text-xs font-mono font-bold text-slate-600">{emp.today}</TableCell>
                    <TableCell className="px-8 py-3 text-xs">
                       <div className="flex items-center space-x-2 text-blue-600 font-bold">
                          <span>{emp.weekly}</span>
                       </div>
                    </TableCell>
                    <TableCell className="px-8 py-3">
                      <Badge className={cn(
                        "px-3 py-0.5 rounded-full text-[10px] font-bold border-none",
                        emp.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      )}>
                        {emp.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}

function Search(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}
