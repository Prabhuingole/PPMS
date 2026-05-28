'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  Download,
  Trash2,
  Edit2,
  Eye,
  Mail,
  Phone,
  Loader2,
  AlertCircle,
  Users,
  Briefcase
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
import { DeleteConfirmationModal } from "@/components/ui/delete-confirmation-modal";
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { employeeService } from '@/services/employeeService';
import { Employee } from '@/types';
import { toast } from 'sonner';
import { useWebSocketEvent } from '@/hooks/useWebSocketEvent';
import { EmployeeForm } from '@/components/employees/EmployeeForm';
import { useAuthStore } from '@/store/authStore';

export default function EmployeeListPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useWebSocketEvent('EMPLOYEES_UPDATED', () => setRefreshTrigger(prev => prev + 1));

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newEmployeeName, setNewEmployeeName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
  }, [searchTerm, roleFilter, refreshTrigger]);

  const onSubmit = async (values: any) => {
    try {
      setIsSubmitting(true);
      if (editingEmployee) {
        await employeeService.updateEmployee(editingEmployee.id, values);
        toast.success('Employee updated successfully');
        setIsAddModalOpen(false);
      } else {
        const result = await employeeService.createEmployee(values);
        setNewEmployeeName(result.full_name);
        setIsAddModalOpen(false);
        setIsPasswordModalOpen(true);
        toast.success('Employee deployed to the system');
      }
      fetchEmployees();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setIsAddModalOpen(true);
  };

  const confirmDelete = (employee: Employee) => {
    setEmployeeToDelete(employee);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!employeeToDelete) return;
    setIsDeleting(true);
    try {
      await employeeService.deleteEmployee(employeeToDelete.id);
      toast.success('Employee deleted');
      fetchEmployees();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || error.message || 'Failed to delete employee');
    } finally {
      setIsDeleting(false);
      setDeleteModalOpen(false);
      setEmployeeToDelete(null);
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

  const handleDownload = () => {
    if (employees.length === 0) {
      toast.error('No data to download');
      return;
    }

    const headers = ['Employee ID', 'Full Name', 'Email', 'Mobile Number', 'Role', 'Designation', 'Status'];
    const csvRows = [headers.join(',')];

    employees.forEach(emp => {
      const row = [
        emp.employee_id || '',
        `"${emp.full_name || ''}"`,
        emp.email || '',
        emp.mobile_number || '',
        emp.role || '',
        `"${emp.designation || ''}"`,
        emp.is_active ? 'Active' : 'Inactive'
      ];
      csvRows.push(row.join(','));
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `employees_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const generateNextEmployeeId = () => {
    if (!employees || employees.length === 0) return 'SAM001';

    let maxId = 0;
    let prefix = 'SAM';

    employees.forEach(emp => {
      if (!emp.employee_id) return;
      const match = String(emp.employee_id).match(/^([a-zA-Z]+)(\d+)$/);
      if (match) {
        prefix = match[1];
        const num = parseInt(match[2], 10);
        if (num > maxId) maxId = num;
      }
    });

    const nextNum = maxId + 1;
    return `${prefix}${nextNum.toString().padStart(3, '0')}`;
  };

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto pb-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <div className="inline-flex items-center justify-center p-2 bg-indigo-50 rounded-xl mb-2 text-indigo-600">
            <Users className="h-5 w-5" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 uppercase">Employee Core</h2>
          <p className="text-slate-500 font-medium text-xs mt-1 max-w-md">Orchestrate and manage your entire workforce through this centralized command hub.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            className="rounded-lg border-slate-200 h-9 px-4 font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all"
            onClick={handleDownload}
          >
            <Download className="mr-2 h-4 w-4" /> Export Data
          </Button>
            <Button
              onClick={() => {
                setEditingEmployee(null);
                setIsAddModalOpen(true);
              }}
              className="h-9 bg-slate-900 text-white hover:bg-slate-800 rounded-lg shadow-sm px-6 font-black text-xs uppercase tracking-widest hover:-translate-y-0.5 transition-all"
            >
              <Plus className="mr-2 h-4 w-4" /> Add Employee
            </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-12">
          <Card className="border-none rounded-2xl shadow-sm overflow-hidden bg-white/80 backdrop-blur-xl">
            <CardHeader className="bg-white border-b border-slate-100 p-4">
              <div className="flex flex-col lg:flex-row gap-3 items-center justify-between">
                <div className="relative flex-1 w-full group max-w-2xl">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                  <Input
                    placeholder="Search by name, email, or ID..."
                    className="pl-9 h-10 bg-slate-50/50 rounded-lg border-slate-100 focus-visible:ring-indigo-500/20 focus-visible:bg-white shadow-inner font-semibold transition-all text-xs"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-3 w-full lg:w-auto">
                  <Select value={roleFilter} onValueChange={(val) => setRoleFilter(val || 'all')}>
                    <SelectTrigger className="h-10 w-full lg:w-[140px] rounded-lg border-slate-100 bg-slate-50/50 hover:bg-white focus:bg-white transition-all font-black text-[10px] uppercase tracking-widest px-3">
                      <SelectValue placeholder="Role">
                        {roleFilter === 'all' ? 'All Roles' : roleFilter === 'employee' ? 'Employee' : roleFilter === 'intern' ? 'Intern' : 'Role'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="rounded-lg border-slate-100 shadow-xl p-1">
                      <SelectItem value="all" className="rounded-md py-2 font-black text-[10px] uppercase tracking-widest">All Roles</SelectItem>
                      <SelectItem value="employee" className="rounded-md py-2 font-black text-[10px] uppercase tracking-widest">Employee</SelectItem>
                      <SelectItem value="intern" className="rounded-md py-2 font-black text-[10px] uppercase tracking-widest">Intern</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="h-10 px-4 flex items-center justify-center rounded-lg bg-slate-900 text-white shadow-sm shrink-0">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[11px] font-black uppercase tracking-widest">{total} Total</span>
                    </div>
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
                      <TableHead className="text-[10px] uppercase font-black text-slate-400 py-3 px-4 tracking-widest">Status</TableHead>
                      <TableHead className="text-[10px] uppercase font-black text-slate-400 py-3 px-4 text-right tracking-widest">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell colSpan={6} className="h-24 text-center">
                            <Loader2 className="h-6 w-6 animate-spin mx-auto text-indigo-300" />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : employees.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-48 text-center">
                          <div className="flex flex-col items-center justify-center text-slate-400">
                            <Users className="h-12 w-12 mb-4 opacity-20" />
                            <span className="font-bold text-sm uppercase tracking-widest">No resources detected</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      <AnimatePresence>
                        {employees.map((emp, i) => (
                          <motion.tr
                            key={emp.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ delay: i * 0.05, duration: 0.3 }}
                            onClick={() => router.push(`/superadmin/employees/${emp.id}`)}
                            className="group border-b border-slate-50 hover:bg-white hover:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] transition-all cursor-pointer relative z-0 hover:z-10"
                          >
                            <TableCell className="font-mono text-xs font-black text-slate-400 px-4 py-2">
                              {emp.employee_id}
                            </TableCell>
                            <TableCell className="px-4 py-2">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8 ring-2 ring-white shadow-sm">
                                  <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-blue-600 text-white text-[10px] font-black">
                                    {emp.full_name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                  <span className="text-xs font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{emp.full_name}</span>
                                  <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">{emp.role}</span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="px-4 py-2">
                              <div className="flex items-center gap-2">
                                <Briefcase className="h-3.5 w-3.5 text-slate-300" />
                                <span className="text-xs font-bold text-slate-700">{emp.designation || 'Unassigned'}</span>
                              </div>
                            </TableCell>
                            <TableCell className="px-4 py-2">
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500">
                                  <Mail className="h-3 w-3 text-slate-300" /> {emp.email}
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500">
                                  <Phone className="h-3 w-3 text-slate-300" /> {emp.mobile_number || 'No contact'}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="px-4 py-2">
                              <Badge
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleStatus(emp.id, emp.is_active);
                                }}
                                className={cn(
                                  "text-[9px] uppercase font-black px-3 py-1 rounded-full border-none shadow-sm cursor-pointer hover:scale-105 transition-all",
                                  emp.is_active
                                    ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                                    : "bg-rose-50 text-rose-600 hover:bg-rose-100"
                                )}
                              >
                                {emp.is_active ? 'Active' : 'Suspended'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right px-4 py-2">
                              <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(`/superadmin/employees/${emp.id}`);
                                  }}
                                  className="h-7 w-7 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all bg-white shadow-sm border border-slate-100"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEdit(emp);
                                  }}
                                  className="h-7 w-7 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-all bg-white shadow-sm border border-slate-100"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    confirmDelete(emp);
                                  }}
                                  className="h-7 w-7 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all bg-white shadow-sm border border-slate-100"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
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

      <EmployeeForm 
        mode={editingEmployee ? 'edit' : 'create'}
        isOpen={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        defaultValues={editingEmployee ? {
          employee_id: editingEmployee.employee_id || '',
          full_name: editingEmployee.full_name,
          email: editingEmployee.email,
          mobile_number: editingEmployee.mobile_number || '',
          role: editingEmployee.role,
          designation: editingEmployee.designation || '',
        } : {
          employee_id: generateNextEmployeeId(),
          full_name: '',
          email: '',
          mobile_number: '',
          role: 'employee',
          designation: '',
        }}
        onSubmit={onSubmit}
        isSubmitting={isSubmitting}
      />

      <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
        <DialogContent className="sm:max-w-[480px] rounded-[2rem] p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-emerald-500 p-6 text-white text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-20 pointer-events-none transform translate-x-1/4 -translate-y-1/4">
              <Mail className="w-32 h-32" />
            </div>
            <div className="h-16 w-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner ring-1 ring-white/30">
              <Mail className="h-8 w-8 text-white" />
            </div>
            <DialogHeader className="relative z-10">
              <DialogTitle className="text-2xl font-black uppercase tracking-tight text-white text-center">
                Transmission Sent
              </DialogTitle>
              <DialogDescription className="text-emerald-50 font-semibold text-xs mt-1 text-center max-w-sm mx-auto">
                Resource <span className="font-black text-white">{newEmployeeName}</span> has been securely initialized in the network.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="p-6 bg-white text-center space-y-4">
            <p className="text-slate-600 font-medium text-xs">
              An automated email containing cryptographic access keys (temporary password) has been dispatched.
            </p>
            <Button
              className="w-full h-10 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-black uppercase text-[10px] tracking-widest shadow-sm hover:-translate-y-0.5 transition-transform"
              onClick={() => setIsPasswordModalOpen(false)}
            >
              Acknowledge & Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        onConfirm={handleDelete}
        itemName={`Employee "${employeeToDelete?.full_name}"`}
        isDeleting={isDeleting}
      />
    </div>
  );
}
