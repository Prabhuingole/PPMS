'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  Save, 
  Calendar as CalendarIcon, 
  Clock, 
  Zap, 
  Activity,
  ChevronDown,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const projects = [
  { id: 'PRJ001', name: 'Identity Protocol v2' },
  { id: 'PRJ003', name: 'Fintech Mobile v4' },
  { id: 'other', name: 'Other Work' },
];

const otherWorkCategories = [
  { id: 'meeting', name: 'Meeting', sub: ['Internal Meeting', 'External Meeting'] },
  { id: 'kt', name: 'Knowledge Transfer (KT)', sub: ['KT Taken', 'KT Given'] },
  { id: 'learning', name: 'Learning', sub: ['Learning Activities', 'Training', 'Research'] },
];

type Entry = {
  id: string;
  projectId: string;
  categoryId: string;
  subcategory: string;
  hours: number;
  description: string;
};

export default function FillTimesheetPage() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState('full-day');
  const [entries, setEntries] = useState<Entry[]>([
    { id: 'initial-row-0', projectId: '', categoryId: '', subcategory: '', hours: 0, description: '' }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalHours = entries.reduce((acc, curr) => acc + (Number(curr.hours) || 0), 0);

  const addRow = () => {
    setEntries([...entries, { id: Math.random().toString(), projectId: '', categoryId: '', subcategory: '', hours: 0, description: '' }]);
  };

  const removeRow = (id: string) => {
    if (entries.length > 1) {
      setEntries(entries.filter(e => e.id !== id));
    }
  };

  const updateEntry = (id: string, field: keyof Entry, value: any) => {
    setEntries(entries.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await new Promise(r => setTimeout(r, 1500));
      toast.success('Timesheet relay successful. Logs queued for approval.');
      // Reset form or redirect
    } catch (e) {
      toast.error('Sync failed. Please verify connectivity.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
           <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase">Activity Relay</h2>
           <p className="text-slate-500 font-medium text-sm">Transmitting work clusters to the central hub</p>
        </div>
        <div className="flex items-center gap-2 px-6 py-3 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-600/20 text-white">
           <Clock className="h-5 w-5" />
           <span className="text-lg font-black">{totalHours.toFixed(1)}h</span>
           <span className="text-[10px] font-bold uppercase tracking-widest opacity-70 ml-1">Total Logged</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: General Sync Info */}
        <div className="lg:col-span-4 space-y-6">
           <Card className="rounded-3xl border-slate-200 shadow-sm p-8 bg-white space-y-8">
              <div className="space-y-4">
                 <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sync Date</Label>
                 <Input 
                   type="date" 
                   value={date} 
                   onChange={(e) => setDate(e.target.value)}
                   className="h-12 rounded-xl border-slate-200 text-xs font-bold focus:border-indigo-500" 
                 />
              </div>

              <div className="space-y-4">
                 <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Attendance Status</Label>
                 <Select value={attendance} onValueChange={(v) => v && setAttendance(v)}>
                    <SelectTrigger className="h-12 rounded-xl border-slate-200 text-xs font-bold">
                       <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-200">
                       <SelectItem value="full-day" className="py-2.5 text-xs font-bold uppercase">Full Day</SelectItem>
                       <SelectItem value="half-day" className="py-2.5 text-xs font-bold uppercase">Half Day</SelectItem>
                       <SelectItem value="early-leave" className="py-2.5 text-xs font-bold uppercase">Early Leave</SelectItem>
                       <SelectItem value="leave" className="py-2.5 text-xs font-bold uppercase">Leave</SelectItem>
                       <SelectItem value="public-holiday" className="py-2.5 text-xs font-bold uppercase">Public Holiday</SelectItem>
                    </SelectContent>
                 </Select>
              </div>

              <div className="pt-6 border-t border-slate-100 space-y-4">
                 <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">System Threshold</span>
                    <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-slate-200 text-slate-400">8.0h / Day</Badge>
                 </div>
                 <div className="h-2 w-full bg-slate-50 rounded-full border border-slate-100 overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((totalHours / 8) * 100, 100)}%` }}
                      className={cn(
                        "h-full transition-all duration-500",
                        totalHours > 8 ? "bg-amber-500" : "bg-indigo-600"
                      )} 
                    />
                 </div>
                 <div className="flex items-center space-x-2 text-[9px] font-bold text-slate-400 italic">
                    <Info className="h-3 w-3" />
                    <span>Values over 8.0h will be tagged as Overtime (OT)</span>
                 </div>
              </div>
           </Card>

           {totalHours > 8 && (
             <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                <Card className="rounded-3xl border-none bg-amber-50 p-6 flex flex-col items-center text-center space-y-3">
                   <div className="p-3 bg-white rounded-2xl border border-amber-200 shadow-sm">
                      <Zap className="h-6 w-6 text-amber-500" />
                   </div>
                   <h4 className="text-xs font-black uppercase tracking-tight text-amber-700">Overtime Detected</h4>
                   <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Integrating {(totalHours - 8).toFixed(1)}h extra bandwidth</p>
                </Card>
             </motion.div>
           )}
        </div>

        {/* Right Side: Entries Table */}
        <div className="lg:col-span-8 space-y-6">
           <Card className="rounded-3xl border-slate-200 shadow-sm overflow-hidden bg-white">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-8 flex flex-row items-center justify-between">
                 <div>
                    <CardTitle className="text-sm font-black uppercase tracking-tight text-slate-800">Activity Clusters</CardTitle>
                    <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">Specify detailed resource utilization</CardDescription>
                 </div>
                 <Button 
                   onClick={addRow}
                   className="h-10 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest"
                 >
                    <Plus className="mr-2 h-3 w-3" /> Add Row
                 </Button>
              </CardHeader>
              <CardContent className="p-0">
                 <div className="overflow-x-auto">
                    <table className="w-full text-left">
                       <thead>
                          <tr className="bg-slate-50/20 border-b border-slate-100">
                             <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 w-1/4">Project/Stream</th>
                             <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 w-1/6">Duration</th>
                             <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Cluster Details (Task)</th>
                             <th className="px-6 py-4 w-12"></th>
                          </tr>
                       </thead>
                       <tbody>
                          <AnimatePresence>
                             {entries.map((entry, idx) => (
                                <motion.tr 
                                  key={entry.id}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  exit={{ opacity: 0, x: 10 }}
                                  className="border-b border-slate-50 last:border-b-0 hover:bg-slate-50/30 transition-colors"
                                >
                                   <td className="px-6 py-6 align-top">
                                      <div className="space-y-4">
                                         <Select value={entry.projectId} onValueChange={(v) => v && updateEntry(entry.id, 'projectId', v)}>
                                            <SelectTrigger className="h-10 rounded-lg border-slate-200 text-xs font-bold">
                                               <SelectValue placeholder="Stream ID" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl">
                                               {projects.map(p => (
                                                  <SelectItem key={p.id} value={p.id} className="text-xs font-bold uppercase">{p.name}</SelectItem>
                                               ))}
                                            </SelectContent>
                                         </Select>

                                         {entry.projectId === 'other' && (
                                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                                               <Select value={entry.categoryId} onValueChange={(v) => v && updateEntry(entry.id, 'categoryId', v)}>
                                                  <SelectTrigger className="h-10 rounded-lg border-slate-200 text-[10px] font-bold uppercase tracking-tight">
                                                     <SelectValue placeholder="Category" />
                                                  </SelectTrigger>
                                                  <SelectContent className="rounded-xl">
                                                     {otherWorkCategories.map(c => (
                                                        <SelectItem key={c.id} value={c.id} className="text-[10px] font-bold uppercase">{c.name}</SelectItem>
                                                     ))}
                                                  </SelectContent>
                                               </Select>

                                               {entry.categoryId && (
                                                  <Select value={entry.subcategory} onValueChange={(v) => v && updateEntry(entry.id, 'subcategory', v)}>
                                                     <SelectTrigger className="h-10 rounded-lg border-slate-200 text-[10px] font-bold uppercase tracking-tight">
                                                        <SelectValue placeholder="Action" />
                                                     </SelectTrigger>
                                                     <SelectContent className="rounded-xl">
                                                        {otherWorkCategories.find(c => c.id === entry.categoryId)?.sub.map(s => (
                                                           <SelectItem key={s} value={s} className="text-[10px] font-bold uppercase">{s}</SelectItem>
                                                        ))}
                                                     </SelectContent>
                                                  </Select>
                                               )}
                                            </motion.div>
                                         )}
                                      </div>
                                   </td>
                                   <td className="px-6 py-6 align-top">
                                      <div className="relative">
                                         <Input 
                                            type="number" 
                                            step="0.5" 
                                            min="0" 
                                            max="24"
                                            value={entry.hours === 0 ? '' : entry.hours}
                                            onChange={(e) => updateEntry(entry.id, 'hours', e.target.value)}
                                            className="h-10 rounded-lg border-slate-200 text-center font-black pr-6 text-sm" 
                                            placeholder="0"
                                         />
                                         <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">h</span>
                                      </div>
                                   </td>
                                   <td className="px-6 py-6 align-top">
                                      <textarea 
                                         value={entry.description}
                                         onChange={(e) => updateEntry(entry.id, 'description', e.target.value)}
                                         placeholder="Explain the work cluster payload..."
                                         className="w-full min-h-[100px] bg-slate-50 border border-slate-100 rounded-xl p-4 text-xs font-medium outline-none focus:border-indigo-400 transition-all resize-none shadow-inner"
                                      />
                                   </td>
                                   <td className="px-6 py-6 align-top">
                                      <Button 
                                         variant="ghost" 
                                         size="icon" 
                                         onClick={() => removeRow(entry.id)}
                                         className="h-8 w-8 text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                                         disabled={entries.length === 1}
                                      >
                                         <Trash2 className="h-4 w-4" />
                                      </Button>
                                   </td>
                                </motion.tr>
                             ))}
                          </AnimatePresence>
                       </tbody>
                    </table>
                 </div>
              </CardContent>
              <CardFooter className="p-8 border-t border-slate-50 bg-slate-50/20 flex flex-col sm:flex-row justify-between items-center gap-4">
                 <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                       <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full"></div>
                       <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{entries.length} Nodes Loaded</span>
                    </div>
                    {totalHours < 8 && (
                      <div className="flex items-center space-x-2 text-amber-600">
                         <Activity className="h-3 w-3" />
                         <span className="text-[10px] font-black uppercase tracking-widest">Under Capacity</span>
                      </div>
                    )}
                 </div>
                 <Button 
                   onClick={handleSubmit}
                   disabled={isSubmitting || totalHours === 0}
                   className="w-full sm:w-auto h-12 px-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-xl shadow-indigo-600/20 font-black uppercase text-xs tracking-widest transition-all group"
                 >
                   {isSubmitting ? (
                     <div className="flex items-center space-x-2 animate-pulse">
                        <Clock className="h-4 w-4 animate-spin" />
                        <span>Transmitting...</span>
                     </div>
                   ) : (
                     <div className="flex items-center space-x-2">
                        <span>Execute Relay</span>
                        <Save className="h-4 w-4 group-hover:scale-110 transition-transform" />
                     </div>
                   )}
                 </Button>
              </CardFooter>
           </Card>
        </div>
      </div>
    </div>
  );
}
