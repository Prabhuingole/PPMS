'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Briefcase, 
  Mail, 
  Phone, 
  ShieldCheck, 
  CalendarDays,
  User,
  MoreVertical,
  Activity,
  Edit2,
  UserPlus,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { reportingManagerService } from '@/services/reportingManagerService';
import { ReportingManager } from '@/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const reportingManagerSchema = z.object({
  full_name: z.string().min(2, 'Full Name is required').regex(/^[^0-9]+$/, 'Full Name cannot contain numbers'),
  email: z.string().trim().toLowerCase().email('Please enter a valid email address').refine(val => val.endsWith('@gmail.com'), 'Email must be a @gmail.com address'),
  mobile_number: z.string()
    .length(10, 'Mobile number must be exactly 10 digits')
    .regex(/^[6-9]\d{9}$/, 'This format input is required (10 digits starting with 6-9)'),
  designation: z.string().min(2, 'Designation is required'),
});

type ReportingManagerFormValues = z.infer<typeof reportingManagerSchema>;

export default function ReportingManagerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const managerId = parseInt(params.id as string, 10);

  const [manager, setManager] = useState<ReportingManager | null>(null);
  const [loading, setLoading] = useState(true);
  const [backPath, setBackPath] = useState('/superadmin/reporting-managers');

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const bp = searchParams.get('backPath');
      if (bp) {
        setBackPath(bp);
      }
    }
  }, []);

  const form = useForm<ReportingManagerFormValues>({
    resolver: zodResolver(reportingManagerSchema),
    defaultValues: {
      full_name: '',
      email: '',
      mobile_number: '',
      designation: '',
    }
  });

  useEffect(() => {
    const fetchManager = async () => {
      try {
        setLoading(true);
        if (isNaN(managerId)) {
          toast.error("Invalid Manager ID");
          router.push('/superadmin/reporting-managers');
          return;
        }
        const data = await reportingManagerService.getReportingManager(managerId);
        setManager(data);
      } catch (error: any) {
        toast.error(error.response?.data?.detail || 'Failed to fetch manager details');
        router.push('/superadmin/reporting-managers');
      } finally {
        setLoading(false);
      }
    };

    fetchManager();
  }, [managerId, router]);

  if (loading) {
    return <ProfileSkeleton />;
  }

  if (!manager) {
    return null; // Will redirect in useEffect
  }

  const handleEditClick = () => {
    if (!manager) return;
    form.reset({
      full_name: manager.full_name,
      email: manager.email,
      mobile_number: manager.mobile_number || '',
      designation: manager.designation || '',
    });
    setIsEditModalOpen(true);
  };

  const onSubmit = async (values: ReportingManagerFormValues) => {
    try {
      setIsSubmitting(true);
      await reportingManagerService.updateReportingManager(managerId, values);
      toast.success('Reporting manager updated successfully');
      setIsEditModalOpen(false);
      setManager({ ...manager, ...values });
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to save reporting manager');
    } finally {
      setIsSubmitting(false);
    }
  };

  const assignedProjectsCount = manager.managed_projects?.length || 0;
  
  // Note: 'status' was requested to be removed, but the mock instructions say:
  // "Status badge (Active)". I will omit it based on previous prompt to remove status completely,
  // or I can show a generic "Registered" badge. Let's just omit status since we removed it from the model entirely.

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Sticky Top Bar */}
      <div className="sticky top-0 z-30 bg-slate-50/80 backdrop-blur-md border-b border-slate-200/60 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => router.push(backPath)}
            className="h-10 w-10 rounded-full hover:bg-slate-200/50 text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-tight">Manager Profile</h1>
            <p className="text-xs font-medium text-slate-500">Profile & Assigned Projects</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={handleEditClick}
            className="h-10 rounded-xl bg-white border-slate-200 text-slate-700 font-bold text-xs uppercase tracking-widest hover:bg-slate-50"
          >
            <Edit2 className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 mt-6 space-y-6">
        {/* Hero Profile Card */}
        <Card className="border border-slate-200/60 shadow-sm rounded-2xl bg-white overflow-hidden">
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
              <Avatar className="h-24 w-24 sm:h-32 sm:w-32 ring-1 ring-slate-200 shadow-sm">
                <AvatarFallback className="bg-slate-100 text-slate-600 text-3xl sm:text-4xl font-semibold uppercase tracking-tight">
                  {manager.full_name?.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <Badge variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-200 border-none px-2.5 py-0.5 rounded-md font-medium text-[11px] uppercase tracking-wider">
                      Reporting Manager
                    </Badge>
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
                    {manager.full_name}
                  </h2>
                </div>

                <div className="flex flex-wrap gap-y-3 gap-x-6 text-sm font-medium text-slate-600">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-slate-400" />
                    <span>{manager.designation || 'Specialist'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-slate-400" />
                    <span>ID: #{manager.id}</span>
                  </div>
                  {manager.updated_at && (
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-slate-400" />
                      <span>Updated: {format(new Date(manager.updated_at), 'MMM d, yyyy')}</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Stats Block */}
              <div className="flex gap-6 pt-6 md:pt-0 md:pl-8 md:border-l border-slate-100 w-full md:w-auto">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Projects</span>
                  <span className="text-3xl font-bold text-slate-900 tracking-tight">{assignedProjectsCount}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Information Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border border-slate-200/60 shadow-sm rounded-2xl bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-slate-500">Identity Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <InfoRow label="Full Name" value={manager.full_name} />
              <InfoRow label="Manager ID" value={`#${manager.id}`} />
              <InfoRow label="Designation" value={manager.designation || 'N/A'} />
            </CardContent>
          </Card>

          <Card className="border border-slate-200/60 shadow-sm rounded-2xl bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-slate-500">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <InfoRow label="Email Address" value={manager.email} icon={<Mail className="h-4 w-4 text-slate-400" />} />
              <InfoRow label="Mobile Number" value={manager.mobile_number || 'Not provided'} icon={<Phone className="h-4 w-4 text-slate-400" />} />
            </CardContent>
          </Card>
        </div>

        {/* Managed Projects Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900 tracking-tight px-1">Managed Projects</h3>
          <Card className="border border-slate-200/60 shadow-sm rounded-2xl bg-white overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="border-slate-100 hover:bg-transparent">
                  <TableHead className="h-12 text-xs font-semibold text-slate-500 uppercase tracking-wider">Project Details</TableHead>
                  <TableHead className="h-12 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {manager.managed_projects && manager.managed_projects.length > 0 ? (
                  manager.managed_projects.map((project) => (
                    <TableRow 
                      key={project.id} 
                      onClick={() => router.push(`/superadmin/projects/${project.id}?backPath=/superadmin/reporting-managers/${manager.id}`)}
                      className="border-slate-100 hover:bg-slate-50/50 transition-colors cursor-pointer"
                    >
                      <TableCell className="py-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">{project.name}</span>
                          <span className="text-xs text-slate-500 mt-0.5">{project.code}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "uppercase text-[10px] font-semibold tracking-wider px-2 py-0.5 border-none rounded-md",
                            project.status === 'active' ? "bg-emerald-50 text-emerald-700" :
                            project.status === 'completed' ? "bg-indigo-50 text-indigo-700" :
                            project.status === 'on-hold' ? "bg-amber-50 text-amber-700" :
                            "bg-slate-100 text-slate-600"
                          )}
                        >
                          {project.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={2} className="h-48 text-center">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <Briefcase className="h-10 w-10 text-slate-300" />
                        <p className="text-sm font-medium text-slate-500">No projects assigned yet</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      </div>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] p-0 overflow-hidden flex flex-col border-none shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)] rounded-[2.5rem] bg-white">
          <div className="bg-gradient-to-br from-slate-900 to-indigo-950 p-6 sm:p-10 text-white relative shrink-0 overflow-hidden">
             <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
             <div className="flex items-center gap-4 sm:gap-6 relative z-10">
               <div className="h-16 w-16 bg-white/10 rounded-[1.5rem] backdrop-blur-md flex items-center justify-center border border-white/20 shadow-2xl">
                 <UserPlus className="h-8 w-8 text-indigo-400" />
               </div>
                <DialogHeader>
                  <DialogTitle className="text-xl sm:text-3xl font-black uppercase tracking-tighter text-white">
                    Edit Manager
                  </DialogTitle>
                  <DialogDescription className="text-indigo-300 font-bold uppercase text-[10px] tracking-[0.2em] mt-1">
                    Update manager profile
                  </DialogDescription>
                </DialogHeader>
             </div>
          </div>
          
          <div className="p-6 sm:p-10 bg-white overflow-y-auto flex flex-col max-h-[90vh]">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-6">
                    <FormField
                      control={form.control}
                      name="full_name"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] flex items-center gap-2">
                             <User className="h-3 w-3" /> Full Name <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input placeholder="Enter full name..." {...field} className="h-14 rounded-2xl border-slate-200/80 bg-slate-50/50 focus:bg-white transition-all pl-12 text-sm font-bold shadow-sm" />
                              <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                            </div>
                          </FormControl>
                          <FormMessage className="text-[10px] font-bold text-red-500" />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] flex items-center gap-2">
                             <Mail className="h-3 w-3" /> Email Address <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input placeholder="manager@gmail.com" {...field} className="h-14 rounded-2xl border-slate-200/80 bg-slate-50/50 focus:bg-white transition-all pl-12 text-sm font-bold shadow-sm" />
                              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                            </div>
                          </FormControl>
                          <FormMessage className="text-[10px] font-bold text-red-500" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="mobile_number"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] flex items-center gap-2">
                             <Phone className="h-3 w-3" /> Mobile Number <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input 
                                placeholder="9876543210" 
                                {...field} 
                                maxLength={10}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                                  field.onChange(value);
                                }}
                                className="h-14 rounded-2xl border-slate-200/80 bg-slate-50/50 focus:bg-white transition-all pl-12 text-sm font-bold shadow-sm" 
                              />
                              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                            </div>
                          </FormControl>
                          <FormMessage className="text-[10px] font-bold text-red-500" />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-8">
                    <FormField
                      control={form.control}
                      name="designation"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] flex items-center gap-2">
                             <Briefcase className="h-3 w-3" /> Designation <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input placeholder="Senior Lead Manager" {...field} className="h-14 rounded-2xl border-slate-200/80 bg-slate-50/50 focus:bg-white transition-all pl-12 text-sm font-bold shadow-sm" />
                              <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                            </div>
                          </FormControl>
                          <FormMessage className="text-[10px] font-bold text-red-500" />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-4 pt-6 border-t border-slate-100 flex-wrap shrink-0">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={() => setIsEditModalOpen(false)}
                    className="h-14 px-8 rounded-2xl font-black uppercase text-[10px] tracking-widest text-slate-400 hover:text-slate-900 transition-colors"
                  >
                    Discard Changes
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="h-14 px-10 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-[10px] tracking-widest shadow-2xl shadow-indigo-200 disabled:opacity-50 transition-all hover:-translate-y-1 active:scale-95"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-3">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Saving...</span>
                      </div>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InfoRow({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
      <span className="text-sm font-medium text-slate-500">{label}</span>
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm font-semibold text-slate-900">{value}</span>
      </div>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <div className="sticky top-0 z-30 bg-white border-b border-slate-200 px-6 py-4 flex items-center">
        <Skeleton className="h-10 w-10 rounded-full mr-4" />
        <div>
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-6 mt-8 space-y-8">
        <Card className="rounded-2xl border-slate-200/60 shadow-sm">
          <CardContent className="p-8 sm:p-10 flex flex-col md:flex-row gap-8 items-center">
            <Skeleton className="h-32 w-32 rounded-full" />
            <div className="flex-1 space-y-4 w-full">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-10 w-64" />
              <div className="flex gap-4">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-24" />
              </div>
            </div>
            <div className="pl-8 border-l border-slate-100 hidden md:block">
              <Skeleton className="h-16 w-20" />
            </div>
          </CardContent>
        </Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Skeleton className="h-64 rounded-2xl border-slate-200/60" />
          <Skeleton className="h-64 rounded-2xl border-slate-200/60" />
        </div>
        <Skeleton className="h-[400px] rounded-2xl border-slate-200/60 w-full" />
      </div>
    </div>
  );
}
