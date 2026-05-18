'use client';

import { 
  FileText, 
  Download, 
  TrendingUp, 
  TrendingDown, 
  PieChart as PieIcon, 
  BarChart3, 
  Calendar,
  Filter,
  Layers,
  Zap,
  Box
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';
import { motion } from 'motion/react';

const data = [
  { month: 'Jan', billable: 4200, overhead: 800 },
  { month: 'Feb', billable: 4800, overhead: 950 },
  { month: 'Mar', billable: 5100, overhead: 1100 },
  { month: 'Apr', billable: 4900, overhead: 900 },
  { month: 'May', billable: 5600, overhead: 1200 },
  { month: 'Jun', billable: 6100, overhead: 1050 },
];

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];

const projectDistribution = [
  { name: 'Core Eng', value: 45 },
  { name: 'Identity', value: 25 },
  { name: 'Mobile', value: 20 },
  { name: 'Internal', value: 10 },
];

export default function ReportsPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase">Analytic Terminal</h2>
          <p className="text-slate-500 font-medium text-sm">Aggregating resource metrics and financial relay data</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="h-12 rounded-2xl border-slate-200 px-6 font-bold text-xs uppercase tracking-widest text-slate-500 hover:bg-slate-50">
             <Layers className="mr-2 h-4 w-4" /> Manage Sets
          </Button>
          <Button className="bg-indigo-600 text-white hover:bg-indigo-700 h-12 rounded-2xl px-6 shadow-xl shadow-indigo-600/20 font-bold text-xs uppercase tracking-widest">
            <Download className="mr-2 h-4 w-4" /> Generate Report
          </Button>
        </div>
      </div>

      {/* Bento Layout for Reports */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Revenue Area Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:col-span-2 row-span-2"
        >
          <Card className="h-full border-slate-200 rounded-3xl shadow-sm p-8 flex flex-col bg-white">
            <div className="flex items-center justify-between mb-8">
               <div>
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Revenue Stream Analysis</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">H1 2026 Fiscal Throughput</p>
               </div>
               <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                     <div className="w-2 h-2 rounded-full bg-indigo-600"></div>
                     <span className="text-[10px] font-black uppercase text-slate-500">Billable</span>
                  </div>
                  <div className="flex items-center space-x-2">
                     <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                     <span className="text-[10px] font-black uppercase text-slate-500">Overhead</span>
                  </div>
               </div>
            </div>
            <div className="flex-1 min-h-[300px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                     <defs>
                        <linearGradient id="colorBillable" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                           <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                     </defs>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                     <XAxis 
                       dataKey="month" 
                       axisLine={false} 
                       tickLine={false} 
                       tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} 
                     />
                     <YAxis 
                       axisLine={false} 
                       tickLine={false} 
                       tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} 
                     />
                     <Tooltip 
                       contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }} 
                     />
                     <Area type="monotone" dataKey="billable" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorBillable)" />
                     <Area type="monotone" dataKey="overhead" stroke="#cbd5e1" strokeWidth={2} fill="transparent" />
                  </AreaChart>
               </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>

        {/* Resource Distribution Pie */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="md:col-span-1"
        >
          <Card className="h-full border-slate-200 rounded-3xl shadow-sm p-8 bg-slate-900 border-none text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -translate-y-16 translate-x-16 blur-2xl group-hover:scale-125 transition-transform"></div>
            
            <h3 className="text-lg font-black uppercase tracking-tight mb-6">Stream Allocation</h3>
            <div className="h-[220px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                     <Pie
                        data={projectDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                     >
                        {projectDistribution.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                     </Pie>
                  </PieChart>
               </ResponsiveContainer>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-4">
               {projectDistribution.map((item, idx) => (
                  <div key={idx} className="flex items-center space-x-2">
                     <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS[idx] }}></div>
                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.name}</span>
                  </div>
               ))}
            </div>
          </Card>
        </motion.div>

        {/* Small Stat Cards in Bento */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="md:col-span-1"
        >
           <Card className="h-full border-slate-200 rounded-3xl p-8 bg-white border border-slate-200 shadow-sm flex flex-col justify-between group">
              <div className="flex justify-between items-start">
                 <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100 transition-transform group-hover:rotate-6">
                    <TrendingUp className="h-6 w-6 text-emerald-600" />
                 </div>
                 <Badge className="bg-emerald-50 text-emerald-600 border-none font-black text-[10px]">+14.2%</Badge>
              </div>
              <div className="mt-8">
                 <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Profitability</span>
                 <div className="text-4xl font-black text-slate-900 mt-2">$284.5K</div>
              </div>
           </Card>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="md:col-span-1"
        >
           <Card className="h-full border-slate-200 rounded-3xl p-8 bg-white border border-slate-200 shadow-sm flex flex-col justify-between group">
              <div className="flex justify-between items-start">
                 <div className="p-3 bg-indigo-50 rounded-2xl border border-indigo-100 transition-transform group-hover:-rotate-6">
                    <Zap className="h-6 w-6 text-indigo-600" />
                 </div>
                 <Badge className="bg-indigo-50 text-indigo-600 border-none font-black text-[10px]">Optimal</Badge>
              </div>
              <div className="mt-8">
                 <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Resource Vel.</span>
                 <div className="text-4xl font-black text-slate-900 mt-2">8.4x</div>
              </div>
           </Card>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="md:col-span-1"
        >
           <Card className="h-full border-slate-200 rounded-3xl p-8 bg-white border border-slate-200 shadow-sm flex flex-col justify-between group">
              <div className="flex items-center space-x-2">
                 <div className="p-2 bg-slate-50 rounded-lg">
                    <Box className="h-4 w-4 text-slate-400" />
                 </div>
                 <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Global Cluster</span>
              </div>
              <div className="mt-8">
                 <div className="text-3xl font-black text-slate-900">12 Nodes</div>
                 <p className="text-[10px] text-slate-400 font-bold uppercase mt-2">Synchronized across 4 zones</p>
              </div>
              <div className="mt-6 flex items-center space-x-1">
                 {[1,2,3,4].map(i => (
                    <div key={i} className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                       <div className="h-full bg-emerald-500 rounded-full w-full"></div>
                    </div>
                 ))}
              </div>
           </Card>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="md:col-span-1"
        >
           <Card className="h-full border-slate-200 rounded-3xl p-8 bg-white border border-slate-200 shadow-sm flex flex-col justify-center items-center text-center group hover:bg-indigo-600 transition-colors">
              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-white/10 transition-colors">
                 <FileText className="h-6 w-6 text-indigo-600 group-hover:text-white" />
              </div>
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 group-hover:text-white">Custom Analytics</h4>
              <p className="text-[10px] text-slate-400 font-bold mt-2 group-hover:text-white/60">Configure complex relay filters</p>
           </Card>
        </motion.div>
      </div>
    </div>
  );
}
