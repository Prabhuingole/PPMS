'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Trash2,
  Edit2,
  Mail,
  Phone,
  Loader2,
  UserCheck,
  Building2,
  UserPlus,
  ArrowRight,
  ShieldCheck,
  User,
  Briefcase,
  Filter,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DeleteConfirmationModal } from "@/components/ui/delete-confirmation-modal";
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { reportingManagerService } from '@/services/reportingManagerService';
import { ReportingManager } from '@/types';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useWebSocketEvent } from '@/hooks/useWebSocketEvent';

const reportingManagerSchema = z.object({
  full_name: z.string().min(2, 'Full Name is required').regex(/^[^0-9]+$/, 'Full Name cannot contain numbers'),
  email: z.string().trim().toLowerCase().email('Please enter a valid email address').refine(val => val.endsWith('@gmail.com'), 'Email must be a @gmail.com address'),
  mobile_number: z.string()
    .length(10, 'Mobile number must be exactly 10 digits')
    .regex(/^[6-9]\d{9}$/, 'This format input is required (10 digits starting with 6-9)'),
  designation: z.string().min(2, 'Designation is required'),
});

type ReportingManagerFormValues = z.infer<typeof reportingManagerSchema>;

export default function ReportingManagerListPage() {
  const [managers, setManagers] = useState<ReportingManager[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useWebSocketEvent('REPORTING_MANAGERS_UPDATED', () => setRefreshTrigger(prev => prev + 1));

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingManager, setEditingManager] = useState<ReportingManager | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const router = useRouter();

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [managerToDelete, setManagerToDelete] = useState<ReportingManager | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const form = useForm<ReportingManagerFormValues>({
    resolver: zodResolver(reportingManagerSchema),
    defaultValues: {
      full_name: '',
      email: '',
      mobile_number: '',
      designation: '',
    }
  });

  const fetchManagers = async () => {
    try {
      setLoading(true);
      const data = await reportingManagerService.getReportingManagers({
        page: 1,
        limit: 1000,
        search: searchTerm,
      });
      setManagers(data.items);
      setTotal(data.total);
      setPages(data.pages);
    } catch (error) {
      toast.error('Failed to fetch reporting managers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchManagers();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, refreshTrigger]);



  const onSubmit = async (values: ReportingManagerFormValues) => {
    try {
      setIsSubmitting(true);
      if (editingManager) {
        await reportingManagerService.updateReportingManager(editingManager.id, values);
        toast.success('Reporting manager updated successfully');
      } else {
        await reportingManagerService.createReportingManager(values);
        toast.success('Reporting manager created successfully');
      }
      setIsModalOpen(false);
      setEditingManager(null);
      form.reset();
      fetchManagers();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to save reporting manager');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (manager: ReportingManager) => {
    setEditingManager(manager);
    form.reset({
      full_name: manager.full_name,
      email: manager.email,
      mobile_number: manager.mobile_number || '',
      designation: manager.designation || '',
    });
    setIsModalOpen(true);
  };

  const confirmDelete = (manager: ReportingManager) => {
    setManagerToDelete(manager);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!managerToDelete) return;
    setIsDeleting(true);
    try {
      await reportingManagerService.deleteReportingManager(managerToDelete.id);
      toast.success('Manager deleted');
      fetchManagers();
    } catch (error) {
      toast.error('Failed to delete manager');
    } finally {
      setIsDeleting(false);
      setDeleteModalOpen(false);
      setManagerToDelete(null);
    }
  };

  return (
    <div className="space-y-8 p-1">
      {/* Header Section */}
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-1">
             <div className="h-1.5 w-8 bg-indigo-600 rounded-full"></div>
             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600">Project Management</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-900 uppercase leading-none">
            Reporting <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">Managers</span>
          </h2>
          <p className="text-slate-500 font-medium text-base">Manage the leaders who oversee project delivery.</p>
        </div>
        <div className="flex items-center gap-4">
          <Button 
            onClick={() => {
              setEditingManager(null);
              form.reset({
                full_name: '',
                email: '',
                mobile_number: '',
                designation: '',
              });
              setIsModalOpen(true);
            }}
            className="bg-slate-900 text-white hover:bg-slate-800 rounded-2xl h-14 px-8 shadow-2xl shadow-indigo-200 transition-all hover:-translate-y-1 active:scale-95 group"
          >
            <Plus className="mr-2 h-5 w-5 group-hover:rotate-90 transition-transform" /> 
            <span className="font-bold uppercase tracking-wider text-xs">Add Manager</span>
          </Button>
        </div>
      </div>

      {/* Main Table Card */}
      <Card className="border-none rounded-[2.5rem] shadow-2xl shadow-slate-200/50 overflow-hidden bg-white/80 backdrop-blur-xl border border-white">
        <CardHeader className="bg-slate-50/40 p-4 sm:p-8 border-b border-slate-100">
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
              <div className="flex flex-col sm:flex-row flex-wrap items-center gap-3 w-full xl:w-auto">
                <div className="relative w-full sm:w-64 shrink-0">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    placeholder="Search managers..." 
                    className="pl-9 h-10 rounded-xl border-slate-200 bg-slate-50 text-sm focus-visible:ring-blue-500/20 focus-visible:border-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

              </div>

              <div className="px-5 py-3 rounded-xl bg-slate-900 text-white hidden sm:flex items-center gap-2.5 shadow-xl shadow-slate-900/10 shrink-0">
                 <ShieldCheck className="h-4 w-4 text-indigo-400" />
                 <span className="text-[10px] font-black uppercase tracking-widest leading-none">{total} Managers</span>
              </div>
            </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="border-slate-100/50 hover:bg-transparent">
                <TableHead className="text-[10px] uppercase font-black text-slate-400 py-6 px-10 tracking-[0.2em]">Manager Name</TableHead>
                <TableHead className="text-[10px] uppercase font-black text-slate-400 py-6 tracking-[0.2em]">Designation</TableHead>
                <TableHead className="text-[10px] uppercase font-black text-slate-400 py-6 tracking-[0.2em]">Contact Channels</TableHead>
                <TableHead className="text-[10px] uppercase font-black text-slate-400 py-6 text-right px-10 tracking-[0.2em]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-slate-50">
                    <TableCell colSpan={5} className="h-24 text-center">
                       <Loader2 className="h-8 w-8 animate-spin mx-auto text-indigo-200" />
                    </TableCell>
                  </TableRow>
                ))
              ) : managers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-60 text-center">
                    <div className="flex flex-col items-center justify-center space-y-4 opacity-40">
                       <UserCheck className="h-16 w-16 text-slate-300" />
                       <p className="text-sm font-bold text-slate-500 uppercase tracking-widest italic">Zero Records Discovered</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                managers.map((manager, i) => (
                  <motion.tr
                    key={manager.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.3 }}
                    className="group border-slate-50 hover:bg-indigo-50/30 transition-all cursor-pointer"
                    onClick={() => {
                      router.push(`/superadmin/reporting-managers/${manager.id}`);
                    }}
                  >
                    <TableCell className="py-6 px-10">
                      <div className="flex items-center gap-5">
                        <div className="relative">
                          <Avatar className="h-14 w-14 ring-4 ring-white shadow-xl group-hover:scale-105 transition-transform duration-300">
                            <AvatarFallback className="bg-gradient-to-br from-slate-800 to-slate-900 text-white text-sm font-black uppercase">
                              {manager.full_name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className={cn(
                            "absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-white shadow-sm",
                            manager.status === 'active' ? "bg-emerald-500" : "bg-red-500"
                          )}></div>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-base font-black text-slate-800 group-hover:text-indigo-600 transition-colors leading-none tracking-tight">{manager.full_name}</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID Reference: #{manager.id}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                         <div className="p-2 bg-slate-100 rounded-xl text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                            <Building2 className="h-4 w-4" />
                         </div>
                         <span className="text-sm font-bold text-slate-700 tracking-tight">{manager.designation || 'Specialist'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-3 text-[11px] font-bold text-slate-500 group-hover:text-slate-700 transition-colors">
                          <Mail className="h-3.5 w-3.5 text-indigo-400" /> {manager.email}
                        </div>
                        <div className="flex items-center gap-3 text-[11px] font-bold text-slate-500 group-hover:text-slate-700 transition-colors">
                          <Phone className="h-3.5 w-3.5 text-indigo-400" /> {manager.mobile_number || 'No contact'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right px-10">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/superadmin/reporting-managers/${manager.id}`);
                          }}
                          className="h-10 w-10 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-white hover:shadow-sm transition-all"
                        >
                          <Eye className="h-5 w-5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(manager);
                          }}
                          className="h-10 w-10 rounded-xl text-slate-400 hover:text-amber-600 hover:bg-white hover:shadow-sm transition-all"
                        >
                          <Edit2 className="h-5 w-5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            confirmDelete(manager);
                          }}
                          className="h-10 w-10 rounded-xl text-slate-400 hover:text-red-600 hover:bg-white hover:shadow-sm transition-all"
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </div>
                    </TableCell>
                  </motion.tr>
                ))
              )}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modern High-Fidelity Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] p-0 overflow-hidden flex flex-col border-none shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)] rounded-[2.5rem] bg-white">
          <div className="bg-gradient-to-br from-slate-900 to-indigo-950 p-6 sm:p-10 text-white relative shrink-0 overflow-hidden">
             {/* Decorative element */}
             <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
             
             <div className="flex items-center gap-4 sm:gap-6 relative z-10">
               <div className="h-16 w-16 bg-white/10 rounded-[1.5rem] backdrop-blur-md flex items-center justify-center border border-white/20 shadow-2xl">
                 <UserPlus className="h-8 w-8 text-indigo-400" />
               </div>
                <DialogHeader>
                  <DialogTitle className="text-xl sm:text-3xl font-black uppercase tracking-tighter text-white">
                    {editingManager ? 'Edit Manager' : 'Register New Manager'}
                  </DialogTitle>
                  <DialogDescription className="text-indigo-300 font-bold uppercase text-[10px] tracking-[0.2em] mt-1">
                    {editingManager ? 'Update manager profile' : 'Fill in the details to add a new manager'}
                  </DialogDescription>
                </DialogHeader>
             </div>
          </div>
          
          <div className="p-6 sm:p-10 bg-white overflow-y-auto flex flex-col max-h-[90vh]">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="space-y-6">
                  {/* Identity Section */}
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

                  {/* Connectivity Grid */}
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
                              <Input placeholder="manager@system.com" {...field} className="h-14 rounded-2xl border-slate-200/80 bg-slate-50/50 focus:bg-white transition-all pl-12 text-sm font-bold shadow-sm" />
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

                  {/* Professional Section */}
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
                    onClick={() => setIsModalOpen(false)}
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
                        <span>{editingManager ? 'Saving...' : 'Adding...'}</span>
                      </div>
                    ) : (
                      editingManager ? 'Save Changes' : 'Add Manager'
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </DialogContent>
      </Dialog>



      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        onConfirm={handleDelete}
        itemName={`Reporting Manager "${managerToDelete?.full_name}"`}
        isDeleting={isDeleting}
      />
    </div>
  );
}
