'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Download,
  Trash2,
  Edit2,
  Eye,
  Mail,
  Phone,
  Loader2,
  Key,
  Copy,
  Check,
  AlertCircle
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { employeeService } from '@/services/employeeService';
import { Employee, UserRole } from '@/types';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const employeeSchema = z.object({
  employee_id: z.string().min(2, 'Employee ID must be at least 2 characters'),
  full_name: z.string().min(2, 'Full Name is required'),
  username: z.string().min(3, 'Username must be at least 3 characters').regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers and underscores allowed'),
  email: z.string().email('Invalid email address'),
  mobile_number: z.string().length(10, 'Mobile number must be exactly 10 digits'),
  role: z.enum(['employee', 'intern']),
  designation: z.string().min(2, 'Designation is required'),
});

type EmployeeFormValues = z.infer<typeof employeeSchema>;

export default function EmployeeListPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [newEmployeeName, setNewEmployeeName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      employee_id: '',
      full_name: '',
      username: '',
      email: '',
      mobile_number: '',
      role: 'employee',
      designation: '',
    }
  });

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const data = await employeeService.getEmployees({
        page: 1,
        limit: 1000,
        search: searchTerm,
        user_type: roleFilter === 'all' ? undefined : roleFilter,
      });
      setEmployees(data.items);
      setTotal(data.total);
      setPages(data.pages);
    } catch (error) {
      toast.error('Failed to fetch resources');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEmployees();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, roleFilter]);

  const onSubmit = async (values: EmployeeFormValues) => {
    try {
      setIsSubmitting(true);
      if (editingEmployee) {
        await employeeService.updateEmployee(editingEmployee.id, values);
        toast.success('Employee updated successfully');
      } else {
        const result = await employeeService.createEmployee(values);
        setGeneratedPassword(result.temp_password);
        setNewEmployeeName(result.full_name);
        setIsPasswordModalOpen(true);
        toast.success('Employee created successfully');
      }
      setIsAddModalOpen(false);
      setEditingEmployee(null);
      fetchEmployees();
      form.reset();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    form.setValue('employee_id', employee.employee_id);
    form.setValue('full_name', employee.full_name);
    form.setValue('username', employee.username);
    form.setValue('email', employee.email);
    form.setValue('mobile_number', employee.mobile_number);
    form.setValue('role', employee.role as 'employee' | 'intern');
    form.setValue('designation', employee.designation);
    setIsAddModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this employee?')) {
      try {
        await employeeService.deleteEmployee(id);
        toast.success('Employee deleted');
        fetchEmployees();
      } catch (error) {
        toast.error('Failed to delete employee');
      }
    }
  };

  const handleToggleStatus = async (id: number, currentStatus: boolean) => {
    try {
      await employeeService.toggleStatus(id, !currentStatus);
      toast.success(`Resource ${!currentStatus ? 'activated' : 'deactivated'}`);
      fetchEmployees();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const copyPassword = () => {
    navigator.clipboard.writeText(generatedPassword);
    toast.success('Password copied to clipboard');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase">Employee List</h2>
          <p className="text-slate-500 font-medium text-sm">Manage your company employees and interns.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-xl border-slate-200">
            <Download className="mr-2 h-4 w-4" /> Download List
          </Button>
          <Button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-blue-600 text-white hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-600/20 px-6"
          >
            <Plus className="mr-2 h-4 w-4" /> Add Employee
          </Button>
        </div>
      </div>

      <Card className="border-slate-200 rounded-3xl shadow-sm overflow-hidden bg-white">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[300px] group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
              <Input 
                placeholder="Search employees..." 
                className="pl-11 h-12 bg-white rounded-xl border-slate-200 focus-visible:ring-blue-500/20 shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3">
              <Select value={roleFilter} onValueChange={(val) => setRoleFilter(val || 'all')}>
                <SelectTrigger className="h-12 w-[140px] rounded-xl border-slate-200 bg-white hover:bg-slate-50 transition-all font-bold text-xs uppercase tracking-wider flex justify-between px-4">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-slate-100 shadow-2xl p-2">
                  <SelectItem value="all" className="rounded-xl py-2.5 font-bold text-xs uppercase tracking-wider">All</SelectItem>
                  <SelectItem value="employee" className="rounded-xl py-2.5 font-bold text-xs uppercase tracking-wider">Employee</SelectItem>
                  <SelectItem value="intern" className="rounded-xl py-2.5 font-bold text-xs uppercase tracking-wider">Intern</SelectItem>
                </SelectContent>
              </Select>
              <div className="px-6 py-4 rounded-xl bg-slate-900 text-white shadow-xl shadow-slate-900/10">
                <span className="text-[10px] font-black uppercase tracking-widest">{total} Employees</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/30">
              <TableRow className="border-slate-100">
                <TableHead className="w-[100px] text-[10px] uppercase font-bold text-slate-400 py-4 px-8 tracking-widest">Employee ID</TableHead>
                <TableHead className="text-[10px] uppercase font-bold text-slate-400 py-4 tracking-widest">Name</TableHead>
                <TableHead className="text-[10px] uppercase font-bold text-slate-400 py-4 tracking-widest">Designation</TableHead>
                <TableHead className="text-[10px] uppercase font-bold text-slate-400 py-4 tracking-widest">Contact Details</TableHead>
                <TableHead className="text-[10px] uppercase font-bold text-slate-400 py-4 tracking-widest">Status</TableHead>
                <TableHead className="text-[10px] uppercase font-bold text-slate-400 py-4 text-right px-8 tracking-widest">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={6} className="h-16 text-center">
                       <Loader2 className="h-5 w-5 animate-spin mx-auto text-slate-300" />
                    </TableCell>
                  </TableRow>
                ))
              ) : employees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-slate-500 font-medium italic">
                    No resources found in current search
                  </TableCell>
                </TableRow>
              ) : (
                employees.map((emp, i) => (
                  <motion.tr
                    key={emp.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => router.push(`/superadmin/employees/${emp.id}`)}
                    className="group border-slate-50 hover:bg-slate-50/50 transition-colors cursor-pointer"
                  >
                    <TableCell className="font-mono text-[10px] font-bold text-slate-300 px-8">
                      {emp.employee_id}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-4">
                        <Avatar className="h-10 w-10 ring-2 ring-white shadow-sm">
                          <AvatarFallback className="bg-slate-900 text-white text-[10px] font-black">
                            {emp.full_name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{emp.full_name}</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">@{emp.username} &bull; {emp.role}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                         <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
                         <span className="text-xs font-semibold text-slate-600">{emp.designation || 'N/A'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-[10px] font-medium text-slate-500">
                          <Mail className="h-3 w-3 text-slate-300" /> {emp.email}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-medium text-slate-500">
                          <Phone className="h-3 w-3 text-slate-300" /> {emp.mobile_number || 'No contact'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleStatus(emp.id, emp.is_active);
                        }}
                        className={cn(
                          "text-[10px] uppercase font-bold px-3 py-0.5 rounded-full border-none shadow-sm cursor-pointer hover:opacity-80 transition-opacity",
                          emp.is_active 
                            ? "bg-emerald-100 text-emerald-700" 
                            : "bg-red-100 text-red-700"
                        )}
                      >
                        {emp.is_active ? 'active' : 'inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right px-8">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/superadmin/employees/${emp.id}`);
                          }}
                          className="h-8 w-8 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(emp);
                          }}
                          className="h-8 w-8 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-all"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(emp.id);
                          }}
                          className="h-8 w-8 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </motion.tr>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Employee Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[600px] rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase tracking-tight">
              {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
            </DialogTitle>
            <DialogDescription className="text-slate-500 font-medium">
              Create a new account for an employee or intern.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="employee_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-bold uppercase text-slate-400">Employee ID <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="SAM001" {...field} className="rounded-xl border-slate-200" />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-bold uppercase text-slate-400">Username <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="rahulvaidya" {...field} className="rounded-xl border-slate-200" />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-bold uppercase text-slate-400">Full Name <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="Rahul Vaidya" {...field} className="rounded-xl border-slate-200" />
                    </FormControl>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-bold uppercase text-slate-400">Email Address <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="rahul@sambhav.com" {...field} className="rounded-xl border-slate-200" />
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
                      <FormLabel className="text-[10px] font-bold uppercase text-slate-400">Mobile Number <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="9876543210" 
                          {...field} 
                          maxLength={10}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                            field.onChange(value);
                          }}
                          className="rounded-xl border-slate-200" 
                        />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-bold uppercase text-slate-400">User Type <span className="text-red-500">*</span></FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="rounded-xl border-slate-200">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="employee">Employee</SelectItem>
                          <SelectItem value="intern">Intern</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="designation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-bold uppercase text-slate-400">Designation <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="Sr. Developer" {...field} className="rounded-xl border-slate-200" />
                      </FormControl>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
              </div>

              <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex items-start gap-3 mt-4">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                <div className="text-[10px] font-bold text-blue-700 uppercase tracking-tight leading-relaxed">
                  Security Protocol: Credentials will be auto-generated. The password will be set as <code className="bg-blue-100 px-1 rounded">{"{username}@sam"}</code>.
                </div>
              </div>

              <DialogFooter className="pt-4">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-xl font-bold uppercase text-[10px]"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold uppercase text-[10px] px-8"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>{editingEmployee ? 'Saving...' : 'Creating...'}</span>
                    </div>
                  ) : editingEmployee ? 'Save Changes' : 'Create Account'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Password Credential Notification Modal */}
      <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-3xl border-2 border-emerald-500 bg-white">
          <div className="flex flex-col items-center text-center py-6 space-y-4">
            <div className="h-16 w-16 bg-emerald-100 rounded-full flex items-center justify-center mb-2 animate-bounce">
              <Key className="h-8 w-8 text-emerald-600" />
            </div>
            <DialogHeader>
              <DialogTitle className="text-2xl font-black uppercase text-emerald-700">Credentials Generated</DialogTitle>
              <DialogDescription className="text-slate-500 font-medium">
                Resource <span className="font-bold text-slate-800">{newEmployeeName}</span> has been initialized. 
                <br/>Copy the temporary password now:
              </DialogDescription>
            </DialogHeader>

            <div className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl relative group overflow-hidden">
               <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
               <span className="text-xl font-mono font-black text-slate-800 tracking-widest block py-2">
                 {generatedPassword}
               </span>
               <Button 
                 variant="ghost" 
                 size="sm" 
                 className="mt-4 w-full h-11 bg-white hover:bg-emerald-50 border border-slate-200 rounded-xl font-bold uppercase text-[10px]"
                 onClick={copyPassword}
               >
                 <Copy className="mr-2 h-4 w-4" /> Copy Access Secret
               </Button>
            </div>

            <p className="text-[9px] font-bold text-red-500 uppercase tracking-widest italic pt-2">
              Warning: This secret is only visible once. 
            </p>

            <Button 
              className="w-full h-12 bg-slate-900 text-white rounded-xl font-black uppercase text-[10px]"
              onClick={() => setIsPasswordModalOpen(false)}
            >
              System Operational
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
