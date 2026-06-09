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
  History,
  Clock,
  MapPin,
  AlertCircle,
  FileText,
  Paperclip,
  FolderKanban,
  Fingerprint,
  AtSign,
  Activity,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Trash2,
  UserCheck,
  UserX
} from 'lucide-react';
import api from '@/services/api';
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { DeleteConfirmationModal } from "@/components/ui/delete-confirmation-modal";
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { employeeService } from '@/services/employeeService';
import { Employee } from '@/types';
import { toast } from 'sonner';
import { EmployeeForm } from '@/components/employees/EmployeeForm';

export default function EmployeeDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [employee, setEmployee] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [statusReason, setStatusReason] = useState('');
  const [isStatusChanging, setIsStatusChanging] = useState(false);

  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedTimesheet, setSelectedTimesheet] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [visibleLogsCount, setVisibleLogsCount] = useState(5);

  const handleViewTimesheetDetails = (log: any) => {
    setSelectedTimesheet(log);
    setIsDetailModalOpen(true);
  };

  const handleDownloadAttachment = (timesheetId: number) => {
    window.open(`/superadmin/timesheets/view-doc?id=${timesheetId}`, '_blank');
  };

  const handleEdit = () => {
    setIsEditModalOpen(true);
  };

  const onSubmit = async (values: any) => {
    try {
      setIsSubmitting(true);
      const updated = await employeeService.updateEmployee(employee.id, values);
      setEmployee(updated); // Update the local state
      toast.success('Employee updated successfully');
      setIsEditModalOpen(false);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await employeeService.deleteEmployee(employee.id);
      toast.success('Employee deleted successfully');
      router.push('/superadmin/employees');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to delete employee');
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  const handleToggleStatus = async () => {
    try {
      setIsStatusChanging(true);
      const updated = await employeeService.toggleStatus(employee.id, !employee.is_active, statusReason);
      setEmployee(updated);
      toast.success(`Employee ${updated.is_active ? 'activated' : 'deactivated'} successfully`);
      setIsStatusModalOpen(false);
      setStatusReason('');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Operation failed');
    } finally {
      setIsStatusChanging(false);
    }
  };

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
           <p className="text-sm font-bold text-muted-foreground tracking-wider animate-pulse">Syncing Node Data...</p>
        </div>
      </div>
    );
  }

  if (!employee) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <Button 
          variant="ghost" 
          onClick={() => router.back()}
          className="rounded-xl hover:bg-muted font-bold text-xs tracking-wider text-muted-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <div className="flex items-center gap-3">
          <Button onClick={() => setIsStatusModalOpen(true)} className={cn("text-white rounded-xl shadow-lg px-6 font-bold text-xs tracking-wider", employee.is_active ? "bg-amber-500 hover:bg-amber-600 shadow-amber-200" : "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200")}>
            {employee.is_active ? <UserX className="mr-2 h-3.5 w-3.5" /> : <UserCheck className="mr-2 h-3.5 w-3.5" />}
            {employee.is_active ? 'Deactivate' : 'Activate'}
          </Button>
          <Button onClick={handleEdit} className="bg-blue-600 text-white hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-200 px-6 font-bold text-xs tracking-wider">
            <Edit2 className="mr-2 h-3.5 w-3.5" /> Edit Profile
          </Button>
          <Button onClick={() => setIsDeleteModalOpen(true)} className="bg-rose-600 text-white hover:bg-rose-700 rounded-xl shadow-lg shadow-rose-200 px-6 font-bold text-xs tracking-wider">
            <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete Profile
          </Button>
        </div>
      </div>

      {/* Hero Profile Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full"
      >
        <Card className="border border-border shadow-sm rounded-xl bg-background overflow-hidden relative">
          <div className="h-2 w-full bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600"></div>
          <CardContent className="p-5 sm:p-6">
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-pink-500 rounded-full blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
                <Avatar className="h-20 w-20 sm:h-24 sm:w-24 ring-4 ring-white shadow-md rounded-full relative z-10 transform group-hover:scale-105 transition-transform duration-500">
                  <AvatarFallback className="bg-gradient-to-br from-slate-900 to-slate-800 text-white text-2xl font-bold rounded-full">
                    {employee.full_name.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                  </AvatarFallback>
                </Avatar>
              </div>
              
              <div className="flex-1 space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-xl sm:text-3xl font-bold text-foreground tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">{employee.full_name}</h1>
                  <Badge className={cn(
                    "rounded-full px-2.5 py-0.5 text-[8px] font-bold tracking-wider border-none shadow-md",
                    employee.is_active ? "bg-emerald-400 text-white shadow-emerald-400/30" : "bg-rose-500 text-white shadow-rose-500/30"
                  )}>
                    {employee.is_active ? 'Active Node' : 'Deactivated'}
                  </Badge>
                </div>
                
                <div className="flex flex-wrap gap-3.5 text-slate-600 bg-muted/30 w-fit p-1 rounded-xl border border-border shadow-sm">
                  <div className="flex items-center gap-1.5 px-2.5">
                    <Briefcase className="h-3.5 w-3.5 text-indigo-500" />
                    <span className="text-xs font-bold tracking-wider">{employee.designation}</span>
                  </div>
                  <div className="w-px h-3.5 bg-slate-200 self-center"></div>
                  <div className="flex items-center gap-1.5 px-2.5">
                    <Shield className="h-3.5 w-3.5 text-pink-500" />
                    <span className="text-xs font-bold tracking-wider">{employee.role}</span>
                  </div>
                  <div className="w-px h-3.5 bg-slate-200 self-center"></div>
                  <div className="flex items-center gap-1.5 px-2.5">
                    <Fingerprint className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-bold tracking-wider">ID: {employee.employee_id}</span>
                  </div>
                </div>
              </div>

              <div className="flex w-full md:w-auto md:flex-col gap-2.5 shrink-0">
                <div className="flex-1 text-center p-2.5 bg-gradient-to-br from-indigo-50 to-blue-50/50 rounded-xl border border-indigo-100/50 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-300 min-w-[120px]">
                  <div className="text-[9px] font-bold text-indigo-400 tracking-wider mb-0.5 flex justify-center items-center gap-1"><FolderKanban className="h-3 w-3"/> Projects</div>
                  <div className="text-lg font-bold text-indigo-700">{employee.projects?.length || 0}</div>
                </div>
                <div className="flex-1 text-center p-2.5 bg-gradient-to-br from-pink-50 to-rose-50/50 rounded-xl border border-pink-100/50 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-300 min-w-[120px]">
                  <div className="text-[9px] font-bold text-pink-400 tracking-wider mb-0.5 flex justify-center items-center gap-1"><Clock className="h-3 w-3"/> Total Logs</div>
                  <div className="text-lg font-bold text-pink-700">{employee.timesheets?.length || 0}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Contact & Identity */}
        <div className="space-y-6">
           <Card className="border border-border shadow-sm rounded-xl overflow-hidden bg-background">
             <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 to-pink-500"></div>
             <CardHeader className="py-4 px-6 border-b border-border bg-slate-50/30">
                <CardTitle className="text-xs font-bold tracking-[0.2em] text-foreground flex items-center gap-2">
                   <div className="p-1.5 bg-indigo-50 rounded-xl text-primary"><UserIcon className="h-3.5 w-3.5" /></div>
                   Personal Identity
                </CardTitle>
             </CardHeader>
             <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-3.5 group">
                   <div className="h-9 w-9 rounded-xl bg-muted/30 border border-border flex items-center justify-center text-muted-foreground group-hover:bg-indigo-50 group-hover:text-primary group-hover:border-indigo-100 transition-all">
                     <AtSign className="h-4 w-4" />
                   </div>
                   <div>
                     <span className="text-sm font-bold text-slate-800 tracking-tight">{employee.full_name}</span>
                   </div>
                </div>
                
                <div className="flex items-center gap-3.5 group">
                   <div className="h-9 w-9 rounded-xl bg-muted/30 border border-border flex items-center justify-center text-muted-foreground group-hover:bg-pink-50 group-hover:text-pink-600 group-hover:border-pink-100 transition-all">
                     <Mail className="h-4 w-4" />
                   </div>
                   <div>
                     <span className="text-[9px] font-bold text-muted-foreground tracking-wider block mb-0.5">System Email</span>
                     <span className="text-sm font-bold text-foreground">{employee.email}</span>
                   </div>
                </div>
                
                <div className="flex items-center gap-3.5 group">
                   <div className="h-9 w-9 rounded-xl bg-muted/30 border border-border flex items-center justify-center text-muted-foreground group-hover:bg-emerald-50 group-hover:text-emerald-600 group-hover:border-emerald-100 transition-all">
                     <Phone className="h-4 w-4" />
                   </div>
                   <div>
                     <span className="text-[9px] font-bold text-muted-foreground tracking-wider block mb-0.5">Primary Contact</span>
                     <span className="text-sm font-bold text-foreground">{employee.mobile_number || 'No contact verified'}</span>
                   </div>
                </div>
                
                <div className="flex items-center gap-3.5 group">
                   <div className="h-9 w-9 rounded-xl bg-muted/30 border border-border flex items-center justify-center text-muted-foreground group-hover:bg-amber-50 group-hover:text-amber-600 group-hover:border-amber-100 transition-all">
                     <Calendar className="h-4 w-4" />
                   </div>
                   <div>
                     <span className="text-[9px] font-bold text-muted-foreground tracking-wider block mb-0.5">Onboarded Since</span>
                     <span className="text-sm font-bold text-foreground">
                       {new Date(employee.joining_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                     </span>
                   </div>
                </div>
             </CardContent>
           </Card>
        </div>

        {/* Right Column - Dynamic Data Streams */}
        <div className="lg:col-span-2 space-y-6">
           {/* Active Projects List */}
           <Card className="border border-border shadow-sm rounded-xl overflow-hidden bg-background">
             <CardHeader className="bg-slate-50/50 py-4 px-6 border-b border-border flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-foreground tracking-wider flex items-center gap-2">
                    <FolderKanban className="h-4.5 w-4.5 text-indigo-500" /> Assigned Projects
                  </CardTitle>
                  <CardDescription className="text-[9px] font-bold text-muted-foreground tracking-wider mt-0.5">
                     Real-time project involvement
                  </CardDescription>
                </div>
             </CardHeader>
             <CardContent className="p-6">
                {!employee.projects || employee.projects.length === 0 ? (
                  <div className="py-12 px-4 text-center bg-slate-50/50 rounded-xl border border-dashed border-border">
                     <div className="h-10 w-10 bg-background rounded-xl shadow-sm border border-border flex items-center justify-center mx-auto mb-3">
                       <AlertCircle className="h-5 w-5 text-slate-300" />
                     </div>
                     <p className="text-xs font-bold text-muted-foreground tracking-wider">No active assignments found</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {employee.projects.map((proj: any) => (
                      <div key={proj.id} className="p-4 rounded-xl bg-background border border-border shadow-sm hover:shadow-md hover:border-indigo-100 transition-all duration-300 group">
                         <div className="flex items-start justify-between mb-3">
                            <div className="h-9 w-9 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                               <Briefcase className="h-4 w-4 text-primary" />
                            </div>
                            <Badge className={cn(
                              "rounded-md px-2 py-0.5 text-[8px] font-bold tracking-wider shadow-none border-none",
                              proj.status === 'active' ? "bg-emerald-50 text-emerald-600" : "bg-muted/30 text-muted-foreground"
                            )}>
                               <span className={cn("h-1 w-1 rounded-full mr-1 inline-block", proj.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400')}></span>
                               {proj.status}
                            </Badge>
                         </div>
                         <div className="space-y-0.5">
                            <div className="text-xs font-bold text-slate-800 line-clamp-1">{proj.name}</div>
                            <div className="text-[9px] font-bold text-muted-foreground tracking-wider line-clamp-1">{proj.code || 'NO-CODE'} &bull; {proj.client_name}</div>
                         </div>
                      </div>
                    ))}
                  </div>
                )}
             </CardContent>
           </Card>

           {/* Recent Timesheets Table */}
           <Card className="border border-border shadow-sm rounded-xl overflow-hidden bg-background">
             <CardHeader className="bg-slate-50/50 py-4 px-6 border-b border-border flex flex-row items-center justify-between">
                <div>
                   <CardTitle className="text-sm font-bold text-foreground tracking-wider flex items-center gap-2">
                     <Activity className="h-4.5 w-4.5 text-pink-500" /> Recent Activity Logs
                   </CardTitle>
                </div>
             </CardHeader>
             <CardContent className="p-0">
                {!employee.timesheets || employee.timesheets.length === 0 ? (
                  <div className="py-12 text-center bg-slate-50/30">
                     <FileText className="h-7 w-7 text-slate-200 mx-auto mb-3" />
                     <p className="text-xs font-bold text-muted-foreground tracking-wider">No activity logs recorded yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-50">
                    {employee.timesheets.slice(0, visibleLogsCount).map((log: any) => (
                      <div 
                         key={log.id} 
                         onClick={() => handleViewTimesheetDetails(log)}
                         className="flex items-center justify-between p-3 px-6 hover:bg-slate-50/80 cursor-pointer transition-colors group"
                      >
                         <div className="flex items-center gap-3">
                           <div className="h-9 w-9 bg-muted rounded-lg flex items-center justify-center group-hover:bg-pink-100 group-hover:text-pink-600 transition-colors text-muted-foreground">
                              <Calendar className="h-3.5 w-3.5" />
                           </div>
                           <div className="space-y-0.5">
                              <div className="text-xs font-bold text-slate-800 group-hover:text-pink-600 transition-colors">
                                 {log.project_name || 'System Task'}
                              </div>
                              <div className="text-[9px] font-bold text-muted-foreground tracking-wider">
                                 {new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </div>
                           </div>
                         </div>
                         <div className="flex items-center gap-3">
                           <div className="text-right">
                              <div className="text-xs font-bold font-mono text-primary">{log.hours.toFixed(1)}h</div>
                              <div className="text-[8px] font-bold text-muted-foreground tracking-wider mt-0.5">{log.status}</div>
                           </div>
                           <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-pink-500 transition-colors" />
                         </div>
                      </div>
                    ))}
                  </div>
                )}
                {employee.timesheets?.length > 5 && (
                  <div className="p-3 flex gap-2 border-t border-border bg-slate-50/50">
                     {visibleLogsCount < employee.timesheets.length && (
                       <Button 
                          variant="ghost" 
                          onClick={() => setVisibleLogsCount(prev => Math.min(prev + 5, employee.timesheets.length))}
                          className="flex-1 text-[9px] font-bold tracking-wider text-muted-foreground hover:text-primary hover:bg-indigo-50 rounded-xl h-9"
                       >
                          Load More <ChevronDown className="ml-1.5 h-3 w-3" />
                       </Button>
                     )}
                     {visibleLogsCount > 5 && (
                       <Button 
                          variant="ghost" 
                          onClick={() => setVisibleLogsCount(5)}
                          className="flex-1 text-[9px] font-bold tracking-wider text-muted-foreground hover:text-pink-600 hover:bg-pink-50 rounded-xl h-9"
                       >
                          See Less <ChevronUp className="ml-1.5 h-3 w-3" />
                       </Button>
                     )}
                  </div>
                )}
             </CardContent>
           </Card>
        </div>
      </div>

      <EmployeeForm
        mode="profile_edit"
        isOpen={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        defaultValues={{
          employee_id: employee.employee_id,
          full_name: employee.full_name,
          email: employee.email,
          mobile_number: employee.mobile_number || '',
          role: employee.role,
          designation: employee.designation || '',
        }}
        onSubmit={onSubmit}
        isSubmitting={isSubmitting}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        onConfirm={handleDelete}
        itemName={`Employee "${employee.full_name}"`}
        isDeleting={isDeleting}
      />

      {/* Activity Log History Dialog */}
      <Dialog open={isHistoryModalOpen} onOpenChange={setIsHistoryModalOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <History className="h-6 w-6 text-blue-600" />
              Activity Log History
            </DialogTitle>
            <DialogDescription className="text-muted-foreground font-medium">
              Showing all recorded timesheet entries for {employee.full_name}.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="overflow-hidden border border-border rounded-xl">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Date</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employee.timesheets?.map((log: any) => (
                    <TableRow 
                      key={log.id} 
                      className="cursor-pointer"
                      onClick={() => {
                        handleViewTimesheetDetails(log);
                      }}
                    >
                      <TableCell className="px-6 text-xs font-bold text-slate-600">
                        {new Date(log.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-xs font-bold text-slate-800">
                        {log.project_name || 'System Task'}
                      </TableCell>
                      <TableCell className="text-xs font-mono font-bold text-blue-600">
                        {log.hours.toFixed(1)}h
                      </TableCell>
                      <TableCell className="text-xs">
                        <Badge className={cn(
                          "rounded-full px-2.5 py-0.5 text-[8px] font-bold tracking-wider border-none",
                          log.status === 'approved' ? "bg-emerald-100 text-emerald-700" :
                          log.status === 'pending' ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                        )}>
                          {log.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsHistoryModalOpen(false)}
              className="rounded-xl font-bold text-xs h-10 px-6"
            >
              Close History
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Timesheet Details Dialog */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="sm:max-w-[750px] p-0 overflow-y-auto overflow-x-hidden max-h-[90vh] border border-border/50 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.25)] rounded-[2.5rem] bg-slate-50/50 backdrop-blur-xl flex flex-col [&>button]:hidden">
          <div className="w-full flex-1">
            <div className="relative bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 px-6 sm:px-8 pt-8 pb-16 shrink-0">
              <div className="absolute top-0 right-0 w-80 h-80 bg-fuchsia-500/30 rounded-full blur-3xl -translate-y-40 translate-x-32 animate-pulse" style={{ animationDuration: '4s' }} />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl translate-y-32 -translate-x-16 animate-pulse" style={{ animationDuration: '6s' }} />
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay"></div>
              
              <DialogHeader className="relative z-10">
                <DialogTitle className="text-3xl font-bold tracking-tight flex items-center gap-4 text-white drop-shadow-sm">
                  <div className="h-14 w-14 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/20 shadow-inner">
                    <Activity className="h-7 w-7 text-white" />
                  </div>
                  <div>
                     <span className="block text-white">Log Details</span>
                     <span className="block text-xs font-bold text-white/60 tracking-wider mt-1">Timesheet Submission Record</span>
                  </div>
                </DialogTitle>
              </DialogHeader>
            </div>

            {selectedTimesheet && (
              <div className="px-6 sm:px-8 pb-8 -mt-10 relative z-20 space-y-4">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ duration: 0.4, type: "spring", bounce: 0.4 }}
                >
                  <div className="bg-background rounded-xl p-2 shadow-xl shadow-slate-200/50 border border-border grid grid-cols-1 md:grid-cols-3 gap-2">
                     <div className="bg-muted/30 rounded-xl p-4 border border-border/50 hover:bg-indigo-50/50 transition-colors group">
                        <span className="text-xs font-bold text-muted-foreground tracking-wider flex items-center gap-1.5 mb-2 group-hover:text-indigo-400 transition-colors">
                          <Calendar className="h-3 w-3" /> Log Date
                        </span>
                        <span className="text-sm font-bold text-slate-800 break-words">
                          {new Date(selectedTimesheet.date).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                     </div>
                     <div className="bg-muted/30 rounded-xl p-4 border border-border/50 hover:bg-blue-50/50 transition-colors group">
                        <span className="text-xs font-bold text-muted-foreground tracking-wider flex items-center gap-1.5 mb-2 group-hover:text-blue-400 transition-colors">
                          <Clock className="h-3 w-3" /> Duration
                        </span>
                        <div className="flex items-center gap-2">
                           <span className="text-lg font-bold text-blue-600 font-mono leading-none">{selectedTimesheet.hours.toFixed(1)}</span>
                           <span className="text-xs font-bold text-blue-400 tracking-wider">Hours</span>
                        </div>
                     </div>
                     <div className="bg-muted/30 rounded-xl p-4 border border-border/50 flex flex-col justify-center gap-3">
                        <div className="flex flex-col gap-1.5">
                           <span className="text-[9px] font-bold text-muted-foreground tracking-wider">Attendance</span>
                           <Badge className={cn(
                             "w-fit rounded-md px-2 py-0.5 text-[8px] font-bold tracking-wider border-none shadow-sm whitespace-nowrap",
                             selectedTimesheet.attendance === 'full-day' ? "bg-emerald-100 text-emerald-700" :
                             selectedTimesheet.attendance === 'half-day' ? "bg-amber-100 text-amber-700" : "bg-purple-100 text-purple-700"
                           )}>
                             {selectedTimesheet.attendance ? selectedTimesheet.attendance.replace(/-/g, ' ') : 'Full Day'}
                           </Badge>
                        </div>
                        <div className="flex flex-col gap-1.5">
                           <span className="text-[9px] font-bold text-muted-foreground tracking-wider">Status</span>
                           <Badge className={cn(
                             "w-fit rounded-md px-2 py-0.5 text-[8px] font-bold tracking-wider border-none shadow-sm inline-flex items-center gap-1 whitespace-nowrap",
                             selectedTimesheet.status === 'approved' ? "bg-emerald-100 text-emerald-700" :
                             selectedTimesheet.status === 'pending' ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                           )}>
                             {selectedTimesheet.status === 'approved' && <CheckCircle2 className="h-2.5 w-2.5 shrink-0" />}
                             {selectedTimesheet.status === 'rejected' && <XCircle className="h-2.5 w-2.5 shrink-0" />}
                             {selectedTimesheet.status === 'pending' && <Loader2 className="h-2.5 w-2.5 animate-spin shrink-0" />}
                             {selectedTimesheet.status}
                           </Badge>
                        </div>
                     </div>
                  </div>
                </motion.div>

                <div className="bg-background rounded-xl p-5 sm:p-6 shadow-xl shadow-slate-200/50 border border-border space-y-6">
                  <div className="grid sm:grid-cols-2 gap-6">
                     <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
                       <span className="text-xs font-bold text-indigo-400 tracking-wider block mb-2 flex items-center gap-1.5">
                         <FolderKanban className="h-3.5 w-3.5" /> Project Stream
                       </span>
                       <div className="text-lg font-bold text-foreground tracking-tight leading-tight break-words">
                         {selectedTimesheet.project_name || 'System Task'}
                       </div>
                     </motion.div>

                     <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
                       <span className="text-xs font-bold text-muted-foreground tracking-wider block mb-2 flex items-center gap-1.5">
                         <FileText className="h-3.5 w-3.5" /> Task Title
                       </span>
                       <div className="text-sm font-bold text-foreground break-words">
                         {selectedTimesheet.task_title || '—'}
                       </div>
                     </motion.div>
                  </div>

                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <span className="text-xs font-bold text-muted-foreground tracking-wider block mb-2 flex items-center gap-1.5">
                      <History className="h-3.5 w-3.5" /> Work Description
                    </span>
                    <div className="text-sm font-medium text-slate-600 bg-muted/30 p-4 rounded-xl border border-border/80 leading-relaxed shadow-inner break-words">
                      {selectedTimesheet.description || 'No description provided.'}
                    </div>
                  </motion.div>

                  {(selectedTimesheet.feedback || selectedTimesheet.attachment_path) && (
                    <div className="pt-4 border-t border-border grid sm:grid-cols-2 gap-4">
                       {selectedTimesheet.feedback && (
                         <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.25 }} className="w-full overflow-hidden">
                           <span className="text-xs font-bold text-rose-500 tracking-wider block mb-2 flex items-center gap-1.5">
                             <AlertCircle className="h-3.5 w-3.5 shrink-0" /> Admin Feedback
                           </span>
                           <div className="text-xs font-bold text-rose-900 bg-rose-50 px-4 py-3 rounded-xl border border-rose-100/80 shadow-sm break-words whitespace-pre-wrap w-full">
                             {selectedTimesheet.feedback}
                           </div>
                         </motion.div>
                       )}

                       {selectedTimesheet.attachment_path && (
                         <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className="w-full overflow-hidden">
                           <span className="text-xs font-bold text-muted-foreground tracking-wider block mb-2 flex items-center gap-1.5">
                             <Paperclip className="h-3.5 w-3.5 shrink-0" /> Attachment Document
                           </span>
                           <Button
                             variant="outline"
                             onClick={() => handleDownloadAttachment(selectedTimesheet.id)}
                             className="w-full rounded-xl font-bold text-xs h-12 px-4 sm:px-6 flex items-center justify-between border-border hover:bg-indigo-50 hover:text-primary hover:border-indigo-200 transition-all shadow-sm group"
                           >
                             <span className="truncate shrink">{selectedTimesheet.attachment_name || 'Download File'}</span>
                             <div className="h-6 w-6 rounded-full bg-muted group-hover:bg-indigo-100 flex items-center justify-center transition-colors shrink-0 ml-2">
                                <ArrowRight className="h-3 w-3" />
                             </div>
                           </Button>
                         </motion.div>
                       )}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="px-6 sm:px-8 pb-8 pt-2 flex justify-end relative z-20">
              <Button 
                onClick={() => setIsDetailModalOpen(false)}
                className="rounded-xl font-bold text-xs h-12 px-10 bg-slate-900 text-white hover:bg-slate-800 shadow-xl shadow-slate-900/20 transition-all active:scale-95 shrink-0"
              >
                Close Details
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isStatusModalOpen} onOpenChange={setIsStatusModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{employee.is_active ? 'Deactivate' : 'Activate'} Employee</DialogTitle>
            <DialogDescription>
              Are you sure you want to {employee.is_active ? 'deactivate' : 'activate'} this employee? {employee.is_active && 'They will lose access to the system.'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium mb-2 block">Reason (Optional)</label>
            <Textarea
              placeholder="Enter reason for status change"
              value={statusReason}
              onChange={(e) => setStatusReason(e.target.value)}
              className="resize-none"
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStatusModalOpen(false)} disabled={isStatusChanging}>
              Cancel
            </Button>
            <Button 
              onClick={handleToggleStatus} 
              disabled={isStatusChanging}
              className={employee.is_active ? "bg-amber-600 hover:bg-amber-700 text-white" : "bg-emerald-600 hover:bg-emerald-700 text-white"}
            >
              {isStatusChanging && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {employee.is_active ? 'Deactivate' : 'Activate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
