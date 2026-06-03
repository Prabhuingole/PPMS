'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  ShieldAlert,
  Loader2,
  Users,
  ShieldCheck,
  Mail,
  Phone,
  Trash2,
  AlertTriangle,
  Edit2
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
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { adminService } from '@/services/adminService';
import { Employee } from '@/types';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuthStore } from '@/store/authStore';

const adminSchema = z.object({
  employee_id: z.string().min(2, 'Admin ID is required'),
  full_name: z.string().min(2, 'Full Name is required').regex(/^[A-Za-z\s]+$/, 'Name cannot contain numbers or special characters'),
  email: z.string().trim().toLowerCase().email('Invalid email').refine(val => val.endsWith('@gmail.com') || val === 'admin@sambhav.com', { message: 'Must be a @gmail.com address' }),
  mobile_number: z.string().regex(/^[7-9]\d{9}$/, 'Must be a 10-digit Indian number starting with 7, 8, or 9'),
  role: z.literal('admin'),
  designation: z.string().min(2, 'Designation is required'),
});

type AdminFormValues = z.infer<typeof adminSchema>;

export default function AdminListPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [admins, setAdmins] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newAdminName, setNewAdminName] = useState('');
  const [adminToDelete, setAdminToDelete] = useState<Employee | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [adminToEdit, setAdminToEdit] = useState<Employee | null>(null);

  const form = useForm<AdminFormValues>({
    resolver: zodResolver(adminSchema),
    defaultValues: {
      employee_id: '',
      full_name: '',
      email: '',
      mobile_number: '',
      role: 'admin',
      designation: '',
    }
  });

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const data = await adminService.getAdmins({
        page: 1,
        limit: 100,
        search: searchTerm,
      });
      setAdmins(data.items);
      setTotal(data.total);
    } catch (error) {
      toast.error('Failed to fetch admins');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAdmins();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const onSubmit = async (values: AdminFormValues) => {
    try {
      setIsSubmitting(true);
      const result = await adminService.createAdmin(values);
      setNewAdminName(result.full_name);
      setIsAddModalOpen(false);
      setIsPasswordModalOpen(true);
      toast.success('Admin account initialized securely');
      fetchAdmins();
      form.reset();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to create admin');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onEditSubmit = async (values: AdminFormValues) => {
    if (!adminToEdit) return;
    try {
      setIsSubmitting(true);
      await adminService.updateAdmin(adminToEdit.id, values);
      toast.success('Admin updated successfully');
      setIsEditModalOpen(false);
      setAdminToEdit(null);
      fetchAdmins();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to update admin');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!adminToDelete) return;
    try {
      setIsDeleting(true);
      await adminService.deleteAdmin(adminToDelete.id);
      toast.success('Admin deleted successfully');
      setAdminToDelete(null);
      fetchAdmins();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to delete admin');
    } finally {
      setIsDeleting(false);
    }
  };

  const generateNextAdminId = () => {
    if (!admins || admins.length === 0) return 'ADM001';
    let maxId = 0;
    let prefix = 'ADM';
    admins.forEach(emp => {
      if (!emp.employee_id) return;
      const match = String(emp.employee_id).match(/^([a-zA-Z]+)(\d+)$/);
      if (match) {
        prefix = match[1];
        const num = parseInt(match[2], 10);
        if (num > maxId) maxId = num;
      }
    });
    return `${prefix}${(maxId + 1).toString().padStart(3, '0')}`;
  };

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto pb-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <div className="inline-flex items-center justify-center p-2 bg-slate-900 rounded-xl mb-2 text-white">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 uppercase">Admin Hub</h2>
          <p className="text-slate-500 font-medium text-xs mt-1 max-w-md">Manage root privileges and administrative accounts globally.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {user?.role === 'superadmin' && (
            <Button
              onClick={() => {
                form.reset();
                form.setValue('employee_id', generateNextAdminId());
                setIsAddModalOpen(true);
              }}
              className="h-9 bg-slate-900 text-white hover:bg-slate-800 rounded-lg shadow-sm px-6 font-black text-xs uppercase tracking-widest hover:-translate-y-0.5 transition-all"
            >
              <Plus className="mr-2 h-4 w-4" /> Add New Admin
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-12">
          <Card className="border-none rounded-2xl shadow-sm overflow-hidden bg-white/80 backdrop-blur-xl">
            <CardHeader className="bg-white border-b border-slate-100 p-4">
              <div className="flex flex-col lg:flex-row gap-3 items-center justify-between">
                <div className="relative flex-1 w-full group max-w-2xl">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
                  <Input
                    placeholder="Search admins by name or email..."
                    className="pl-9 h-10 bg-slate-50/50 rounded-lg border-slate-100 focus-visible:ring-slate-500/20 focus-visible:bg-white shadow-inner font-semibold transition-all text-xs"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="h-10 px-4 flex items-center justify-center rounded-lg bg-slate-900 text-white shadow-sm shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[11px] font-black uppercase tracking-widest">{total} Admins</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 bg-white/40">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50/80">
                    <TableRow className="border-slate-100 hover:bg-transparent">
                      <TableHead className="w-[100px] text-[10px] uppercase font-black text-slate-400 py-3 px-4 tracking-widest">ID</TableHead>
                      <TableHead className="text-[10px] uppercase font-black text-slate-400 py-3 px-4 tracking-widest">Profile</TableHead>
                      <TableHead className="text-[10px] uppercase font-black text-slate-400 py-3 px-4 tracking-widest">Position</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold text-slate-400 py-3 px-4 tracking-widest">Contact</TableHead>

                      <TableHead className="text-[10px] uppercase font-black text-slate-400 py-3 px-4 tracking-widest text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell colSpan={5} className="h-24 text-center">
                            <Loader2 className="h-6 w-6 animate-spin mx-auto text-slate-300" />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : admins.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-48 text-center">
                          <div className="flex flex-col items-center justify-center text-slate-400">
                            <ShieldAlert className="h-12 w-12 mb-4 opacity-20" />
                            <span className="font-bold text-sm uppercase tracking-widest">No Admins Found</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      <AnimatePresence mode="popLayout">
                        {admins.map((emp, i) => (
                          <motion.tr
                            key={emp.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ delay: i * 0.05, duration: 0.3 }}
                            className="group border-b border-slate-50 hover:bg-white hover:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] transition-all cursor-default"
                          >
                            <TableCell className="font-mono text-xs font-black text-slate-400 px-4 py-2">
                              {emp.employee_id}
                            </TableCell>
                            <TableCell className="px-4 py-2">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8 ring-2 ring-white shadow-sm">
                                  <AvatarFallback className="bg-slate-900 text-white text-[10px] font-black">
                                    {emp.full_name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                  <span className="text-xs font-black text-slate-900">{emp.full_name}</span>
                                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{emp.role}</span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="px-4 py-2">
                              <span className="text-xs font-bold text-slate-700">{emp.designation || 'System Admin'}</span>
                            </TableCell>
                            <TableCell className="px-4 py-2">
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500">
                                  <Mail className="h-3 w-3 text-slate-300" /> {emp.email}
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500">
                                  <Phone className="h-3 w-3 text-slate-300" /> {emp.mobile_number || 'N/A'}
                                </div>
                              </div>
                            </TableCell>

                            <TableCell className="px-4 py-2 text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setAdminToEdit(emp);
                                  form.reset({
                                    employee_id: emp.employee_id || '',
                                    full_name: emp.full_name,
                                    email: emp.email,
                                    mobile_number: emp.mobile_number || '',
                                    role: 'admin',
                                    designation: emp.designation || 'System Admin',
                                  });
                                  setIsEditModalOpen(true);
                                }}
                                className="h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors mr-2"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setAdminToDelete(emp)}
                                className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[700px] rounded-2xl p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-slate-900 p-6 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
              <ShieldCheck className="w-24 h-24" />
            </div>
            <DialogHeader className="relative z-10">
              <DialogTitle className="text-2xl font-black uppercase tracking-tight text-white">
                Add New Admin
              </DialogTitle>
              <DialogDescription className="text-slate-400 font-medium text-xs mt-1">
                Configure root-level access parameters securely.
              </DialogDescription>
            </DialogHeader>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-6 bg-white">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="employee_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Identifier <span className="text-rose-500">*</span></FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          readOnly
                          className="h-10 rounded-lg border-slate-100 bg-slate-50 cursor-not-allowed text-slate-500 font-bold"
                        />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Full Name <span className="text-rose-500">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="Admin Name" {...field} className="h-10 rounded-lg border-slate-200 bg-slate-50/50 focus-visible:bg-white font-semibold text-sm" />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Email Address <span className="text-rose-500">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="admin@sambhav.com" {...field} className="h-10 rounded-lg border-slate-200 bg-slate-50/50 focus-visible:bg-white font-semibold text-sm" />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="mobile_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mobile Number <span className="text-rose-500">*</span></FormLabel>
                      <FormControl>
                        <Input
                          placeholder="9876543210"
                          {...field}
                          maxLength={10}
                          onChange={(e) => {
                            field.onChange(e.target.value.replace(/\D/g, '').slice(0, 10));
                          }}
                          className="h-10 rounded-lg border-slate-200 bg-slate-50/50 focus-visible:bg-white font-semibold text-sm"
                        />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-4">
                <FormField
                  control={form.control}
                  name="designation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Designation <span className="text-rose-500">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="System Administrator" {...field} className="h-10 rounded-lg border-slate-200 bg-slate-50/50 focus-visible:bg-white font-semibold text-sm" />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter className="pt-4 border-t border-slate-50">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-lg h-10 px-4 font-black uppercase tracking-widest text-[10px] text-slate-500 hover:text-slate-900"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg h-10 px-6 font-black uppercase tracking-widest text-[10px] shadow-sm"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : 'Add New Admin'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditModalOpen} onOpenChange={(open) => {
        setIsEditModalOpen(open);
        if (!open) {
          setAdminToEdit(null);
          form.reset();
        }
      }}>
        <DialogContent className="sm:max-w-[700px] rounded-2xl p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-slate-900 p-6 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
              <ShieldCheck className="w-24 h-24" />
            </div>
            <DialogHeader className="relative z-10">
              <DialogTitle className="text-2xl font-black uppercase tracking-tight text-white">
                Edit Admin Details
              </DialogTitle>
              <DialogDescription className="text-slate-400 font-medium text-xs mt-1">
                Update details for {adminToEdit?.full_name}
              </DialogDescription>
            </DialogHeader>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onEditSubmit)} className="space-y-4 p-6 bg-white">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="employee_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Identifier <span className="text-rose-500">*</span></FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          readOnly
                          className="h-10 rounded-lg border-slate-100 bg-slate-50 cursor-not-allowed text-slate-500 font-bold"
                        />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Full Name <span className="text-rose-500">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="Admin Name" {...field} className="h-10 rounded-lg border-slate-200 bg-slate-50/50 focus-visible:bg-white font-semibold text-sm" />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Email Address <span className="text-rose-500">*</span></FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="admin@gmail.com" 
                          {...field} 
                          className="h-10 rounded-lg border-slate-200 bg-slate-50/50 focus-visible:bg-white font-semibold text-sm" 
                          readOnly={adminToEdit?.email === 'admin@sambhav.com'}
                        />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="mobile_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mobile Number <span className="text-rose-500">*</span></FormLabel>
                      <FormControl>
                        <Input
                          placeholder="9876543210"
                          {...field}
                          maxLength={10}
                          onChange={(e) => {
                            field.onChange(e.target.value.replace(/\D/g, '').slice(0, 10));
                          }}
                          className="h-10 rounded-lg border-slate-200 bg-slate-50/50 focus-visible:bg-white font-semibold text-sm"
                        />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-4">
                <FormField
                  control={form.control}
                  name="designation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Designation <span className="text-rose-500">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="System Administrator" {...field} className="h-10 rounded-lg border-slate-200 bg-slate-50/50 focus-visible:bg-white font-semibold text-sm" />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter className="pt-4 border-t border-slate-50">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsEditModalOpen(false)}
                  className="rounded-lg h-10 px-4 font-black uppercase tracking-widest text-[10px] text-slate-500 hover:text-slate-900"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg h-10 px-6 font-black uppercase tracking-widest text-[10px] shadow-sm"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : 'Save Changes'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
        <DialogContent className="sm:max-w-[480px] rounded-[2rem] p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-emerald-500 p-6 text-white text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-20 pointer-events-none transform translate-x-1/4 -translate-y-1/4">
              <ShieldCheck className="w-32 h-32" />
            </div>
            <DialogHeader className="relative z-10">
              <DialogTitle className="text-2xl font-black uppercase tracking-tight text-white text-center">
                Admin Initialized
              </DialogTitle>
              <DialogDescription className="text-emerald-50 font-semibold text-xs mt-1 text-center max-w-sm mx-auto">
                {newAdminName} has been provisioned successfully.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="p-6 bg-white text-center space-y-4">
            <p className="text-slate-600 font-medium text-xs">
              A temporary password has been emailed to them. They will be forced to secure their account upon first login.
            </p>
            <Button
              className="w-full h-10 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-black uppercase text-[10px] tracking-widest shadow-sm hover:-translate-y-0.5 transition-transform"
              onClick={() => setIsPasswordModalOpen(false)}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!adminToDelete} onOpenChange={(open) => !open && setAdminToDelete(null)}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-rose-500 p-6 text-white text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-20 pointer-events-none transform translate-x-1/4 -translate-y-1/4">
              <AlertTriangle className="w-32 h-32" />
            </div>
            <DialogHeader className="relative z-10">
              <DialogTitle className="text-2xl font-black uppercase tracking-tight text-white text-center">
                Delete Admin?
              </DialogTitle>
              <DialogDescription className="text-rose-50 font-semibold text-xs mt-1 text-center">
                This action is permanent and cannot be undone.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="p-6 bg-white text-center space-y-6">
            <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-xs font-black text-slate-900">{adminToDelete?.full_name}</span>
              <span className="text-[10px] font-bold text-slate-500 mt-1">{adminToDelete?.email}</span>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 h-10 rounded-lg font-black uppercase text-[10px] tracking-widest"
                onClick={() => setAdminToDelete(null)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1 h-10 rounded-lg font-black uppercase text-[10px] tracking-widest shadow-sm"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete Admin'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
