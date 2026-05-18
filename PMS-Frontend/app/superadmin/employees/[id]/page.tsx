'use client';

import { useState, useEffect, use } from 'react';
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  Calendar, 
  Shield, 
  Edit2, 
  User as UserIcon,
  Briefcase,
  CheckCircle2,
  XCircle,
  Loader2,
  ExternalLink,
  History,
  Clock,
  MapPin,
  AlertCircle,
  FileText
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { employeeService } from '@/services/employeeService';
import { Employee } from '@/types';
import { toast } from 'sonner';

export default function EmployeeDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [employee, setEmployee] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const data = await employeeService.getEmployee(parseInt(resolvedParams.id));
        setEmployee(data);
      } catch (error) {
        toast.error('Failed to load resource data from system');
        router.push('/superadmin/employees');
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [resolvedParams.id, router]);

  if (loading) {
    return (
      <div className="flex h-[80vh] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
           <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
           <p className="text-sm font-bold text-slate-400 uppercase tracking-widest animate-pulse">Syncing Node Data...</p>
        </div>
      </div>
    );
  }

  if (!employee) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <Button 
          variant="ghost" 
          onClick={() => router.back()}
          className="rounded-xl hover:bg-slate-100 font-bold text-[10px] uppercase tracking-widest text-slate-500"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Directory
        </Button>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-xl border-slate-200 font-bold text-[10px] uppercase tracking-widest">
             <ExternalLink className="mr-2 h-3.5 w-3.5" /> Export Dossier
          </Button>
          <Button className="bg-blue-600 text-white hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-200 px-6 font-bold text-[10px] uppercase tracking-widest">
            <Edit2 className="mr-2 h-3.5 w-3.5" /> Modify Node
          </Button>
        </div>
      </div>

      {/* Hero Profile Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative"
      >
        <div className="h-48 w-full bg-slate-900 rounded-[2.5rem] overflow-hidden relative">
           <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-transparent"></div>
           <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-32 translate-x-32"></div>
        </div>
        
        <div className="px-10 -mt-20">
           <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-3xl bg-white/90 backdrop-blur-xl">
             <CardContent className="p-8">
               <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
                  <Avatar className="h-40 w-40 ring-8 ring-white shadow-xl rounded-[2rem]">
                    <AvatarFallback className="bg-slate-900 text-white text-3xl font-black rounded-[2rem]">
                      {employee.full_name.split(' ').map((n: string) => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                       <h1 className="text-4xl font-black text-slate-900 tracking-tight">{employee.full_name}</h1>
                       <Badge className={cn(
                         "rounded-full px-4 py-1 text-[10px] font-black uppercase tracking-widest border-none shadow-sm",
                         employee.is_active ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                       )}>
                         {employee.is_active ? 'Active Node' : 'Deactivated'}
                       </Badge>
                       <Badge variant="outline" className="rounded-full px-4 py-1 text-[10px] font-black uppercase tracking-widest border-slate-200 text-slate-400">
                          ID: {employee.employee_id}
                       </Badge>
                    </div>
                    
                    <div className="flex flex-wrap gap-6 text-slate-500">
                       <div className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-bold uppercase tracking-tight">{employee.designation}</span>
                       </div>
                       <div className="flex items-center gap-2 border-l border-slate-200 pl-6">
                          <Shield className="h-4 w-4 text-slate-400" />
                          <span className="text-sm font-bold uppercase tracking-tight text-blue-600/80">{employee.role}</span>
                       </div>
                    </div>
                  </div>

                  <div className="flex md:flex-col gap-3 shrink-0">
                     <div className="text-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Active Projects</div>
                        <div className="text-xl font-black text-slate-900">{employee.projects?.length || 0}</div>
                     </div>
                     <div className="text-center p-4 bg-blue-50 rounded-2xl border border-blue-100">
                        <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Total Logs</div>
                        <div className="text-xl font-black text-blue-600">{employee.timesheets?.length || 0}</div>
                     </div>
                  </div>
               </div>
             </CardContent>
           </Card>
        </div>
      </motion.div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column - Contact & Identity */}
        <div className="space-y-8">
           <Card className="border-slate-100 shadow-xl shadow-slate-200/20 rounded-3xl overflow-hidden">
             <CardHeader className="bg-slate-50/50 py-4 border-b border-slate-100">
                <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center">
                   <UserIcon className="mr-2 h-3.5 w-3.5 text-blue-600" /> Personal Identity
                </CardTitle>
             </CardHeader>
             <CardContent className="p-6 space-y-6">
                <div className="space-y-1">
                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Username</span>
                   <span className="text-sm font-bold text-slate-800">@{employee.username}</span>
                </div>
                <div className="space-y-1">
                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">System Email</span>
                   <div className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 text-blue-500" />
                      <span className="text-sm font-bold text-slate-800">{employee.email}</span>
                   </div>
                </div>
                <div className="space-y-1">
                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Primary Contact</span>
                   <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-blue-500" />
                      <span className="text-sm font-bold text-slate-800">{employee.mobile_number || 'No contact verified'}</span>
                   </div>
                </div>
                <div className="space-y-1">
                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Onboarded Since</span>
                   <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-blue-500" />
                      <span className="text-sm font-bold text-slate-800">
                        {new Date(employee.joining_date).toLocaleDateString()}
                      </span>
                   </div>
                </div>
             </CardContent>
           </Card>

           <Card className="border-none bg-slate-900 text-white rounded-3xl p-8 shadow-xl">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-6">Permission Level</h4>
              <div className="flex items-center gap-4 mb-6">
                 <div className="h-12 w-12 bg-white/10 rounded-2xl flex items-center justify-center">
                    <Shield className="h-6 w-6 text-white" />
                 </div>
                 <div className="text-xl font-black uppercase tracking-tight">{employee.role}</div>
              </div>
              <p className="text-[10px] font-medium opacity-60 leading-relaxed uppercase tracking-widest">
                 Authorized for {employee.role} operations across Sambhav network nodes.
              </p>
           </Card>
        </div>

        {/* Right Column - Dynamic Data Streams */}
        <div className="md:col-span-2 space-y-8">
           {/* Active Projects List */}
           <Card className="border-slate-100 shadow-xl shadow-slate-200/20 rounded-3xl overflow-hidden">
             <CardHeader className="bg-slate-50/50 py-6 border-b border-slate-100 px-8">
                <CardTitle className="text-lg font-black text-slate-900 uppercase tracking-tight">Assigned Project Streams</CardTitle>
                <CardDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                   Real-time project involvement from database
                </CardDescription>
             </CardHeader>
             <CardContent className="p-0">
                {!employee.projects || employee.projects.length === 0 ? (
                  <div className="p-12 text-center bg-slate-50/20">
                     <AlertCircle className="h-8 w-8 text-slate-200 mx-auto mb-4" />
                     <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No active project assignments found</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {employee.projects.map((proj: any) => (
                      <div key={proj.id} className="p-8 hover:bg-slate-50/50 transition-colors flex items-center justify-between group">
                         <div className="flex items-center gap-6">
                            <div className="h-12 w-12 bg-white border-2 border-slate-100 rounded-2xl flex items-center justify-center shadow-sm group-hover:border-blue-200 transition-colors">
                               <Briefcase className="h-6 w-6 text-blue-600" />
                            </div>
                            <div className="space-y-1">
                               <div className="text-sm font-black text-slate-800">{proj.name}</div>
                               <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{proj.code || 'NO-CODE'} &bull; {proj.client_name}</div>
                            </div>
                         </div>
                         <Badge className={cn(
                           "rounded-full px-3 py-0.5 text-[10px] font-black uppercase tracking-widest",
                           proj.status === 'active' ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                         )}>
                            {proj.status}
                         </Badge>
                      </div>
                    ))}
                  </div>
                )}
             </CardContent>
           </Card>

           {/* Recent Timesheets Table */}
           <Card className="border-slate-100 shadow-xl shadow-slate-200/20 rounded-3xl overflow-hidden">
             <CardHeader className="bg-slate-50/50 py-6 border-b border-slate-100 px-8">
                <CardTitle className="text-lg font-black text-slate-900 uppercase tracking-tight">Recent Activity Logs</CardTitle>
                <CardDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                   Latest timesheet entries synchronized from database
                </CardDescription>
             </CardHeader>
             <CardContent className="p-0">
                {!employee.timesheets || employee.timesheets.length === 0 ? (
                  <div className="p-12 text-center bg-slate-50/20">
                     <FileText className="h-8 w-8 text-slate-200 mx-auto mb-4" />
                     <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No activity logs recorded yet</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader className="bg-slate-50/50">
                       <TableRow className="border-slate-100">
                          <TableHead className="px-8 text-[10px] font-black uppercase tracking-widest py-4">Date</TableHead>
                          <TableHead className="text-[10px] font-black uppercase tracking-widest py-4">Project</TableHead>
                          <TableHead className="text-[10px] font-black uppercase tracking-widest py-4">Hours</TableHead>
                          <TableHead className="text-[10px] font-black uppercase tracking-widest py-4">Status</TableHead>
                       </TableRow>
                    </TableHeader>
                    <TableBody>
                       {employee.timesheets.slice(0, 5).map((log: any) => (
                         <TableRow key={log.id} className="border-slate-50 hover:bg-slate-50/80 transition-colors">
                            <TableCell className="px-8 text-xs font-bold text-slate-600">
                               {new Date(log.date).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-xs font-black text-slate-800">
                               {log.project_name || 'System Task'}
                            </TableCell>
                            <TableCell className="text-xs font-mono font-black text-blue-600">
                               {log.hours.toFixed(1)}h
                            </TableCell>
                            <TableCell>
                               <Badge className={cn(
                                 "text-[9px] font-black uppercase tracking-tighter px-2",
                                 log.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                               )}>
                                  {log.status}
                               </Badge>
                            </TableCell>
                         </TableRow>
                       ))}
                    </TableBody>
                  </Table>
                )}
                {employee.timesheets?.length > 5 && (
                  <div className="p-4 text-center border-t border-slate-50">
                     <Button variant="ghost" className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        View Full History ({employee.timesheets.length} Logs)
                     </Button>
                  </div>
                )}
             </CardContent>
           </Card>
        </div>
      </div>
    </div>
  );
}
