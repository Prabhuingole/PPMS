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
  Briefcase,
  MoreHorizontal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { ManagementLayout } from '@/components/layout/ManagementLayout';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
        toast.success('Team Member updated successfully');
        setIsAddModalOpen(false);
      } else {
        const result = await employeeService.createEmployee(values);
        setNewEmployeeName(result.full_name);
        setIsAddModalOpen(false);
        setIsPasswordModalOpen(true);
        toast.success('Team Member deployed to the system');
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
      toast.success('Team Member deleted');
      fetchEmployees();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || error.message || 'Failed to delete team member');
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
    <>
      <ManagementLayout
        title="Team Members"
        description="Manage your organization's team members."
        headerActions={
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="rounded-lg border-border h-10 px-4 font-semibold text-sm hover:bg-muted transition-all"
              onClick={handleDownload}
            >
              <Download className="mr-2 h-4 w-4" /> Export Data
            </Button>
            <Button
              onClick={() => {
                setEditingEmployee(null);
                setIsAddModalOpen(true);
              }}
              className="bg-primary text-white hover:bg-indigo-700 rounded-lg h-10 px-5 text-sm font-semibold shadow-sm transition-all"
            >
              <Plus className="mr-2 h-4 w-4" /> Add Team Member
            </Button>
          </div>
        }
      >
        <DataTable
          data={employees}
          isLoading={loading}
          searchPlaceholder="Search team members..."
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          filters={
            <Select value={roleFilter} onValueChange={(val) => setRoleFilter(val || 'all')}>
              <SelectTrigger className="h-10 w-[140px] rounded-lg border-border bg-background shadow-sm font-semibold text-sm">
                <SelectValue placeholder="Role">
                  {roleFilter === 'all' ? 'All Roles' : roleFilter === 'employee' ? 'Team Member' : roleFilter === 'team_member' ? 'Team Member' : roleFilter === 'consultant' ? 'Consultant' : roleFilter === 'intern' ? 'Intern' : 'Role'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="rounded-lg border-border shadow-xl p-1">
                <SelectItem value="all" className="rounded-md py-2 font-bold text-xs">All Roles</SelectItem>
                <SelectItem value="employee" className="rounded-md py-2 font-bold text-xs">Team Member</SelectItem>
                <SelectItem value="team_member" className="rounded-md py-2 font-bold text-xs">Team Member</SelectItem>
                <SelectItem value="consultant" className="rounded-md py-2 font-bold text-xs">Consultant</SelectItem>
                <SelectItem value="intern" className="rounded-md py-2 font-bold text-xs">Intern</SelectItem>
              </SelectContent>
            </Select>
          }
          toolbarActions={
            <div className="h-10 px-4 flex items-center justify-center rounded-lg bg-background border border-border text-muted-foreground shadow-sm shrink-0 font-medium text-sm">
              Total: {total}
            </div>
          }
          emptyState={
            <EmptyState
              icon={Users}
              title="No Team Members Found"
              description="There are currently no team member records matching your criteria."
              className="border-0 rounded-none w-full min-h-[400px]"
            />
          }
          onRowClick={(emp) => router.push(`/superadmin/employees/${emp.id}`)}
          columns={[
            {
              header: 'ID',
              accessorKey: 'employee_id',
              sortable: true,
              width: '100px',
              cell: (emp) => (
                <span className="font-mono text-xs font-bold text-muted-foreground">
                  {emp.employee_id}
                </span>
              )
            },
            {
              header: 'Profile',
              accessorKey: 'full_name',
              sortable: true,
              cell: (emp) => (
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8 ring-2 ring-white shadow-sm">
                    <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-blue-600 text-white text-xs font-bold">
                      {emp.full_name.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">{emp.full_name}</span>
                    <span className="text-[9px] font-bold text-indigo-400 tracking-wider uppercase">
                      {emp.role === 'employee' || emp.role === 'team_member' ? 'Team Member'
                        : emp.role === 'intern' ? 'Intern'
                        : emp.role === 'consultant' ? 'Consultant'
                        : emp.role === 'reporting_manager' ? 'Reporting Manager'
                        : emp.role === 'admin' ? 'Admin'
                        : emp.role === 'superadmin' ? 'Super Admin'
                        : emp.role}
                    </span>
                  </div>
                </div>
              )
            },
            {
              header: 'Position',
              accessorKey: 'designation',
              sortable: true,
              hideOnMobile: true,
              cell: (emp) => (
                <div className="flex items-center gap-2">
                  <Briefcase className="h-3.5 w-3.5 text-slate-300" />
                  <span className="text-xs font-bold text-foreground">{emp.designation || 'Unassigned'}</span>
                </div>
              )
            },
            {
              header: 'Contact',
              accessorKey: 'email',
              sortable: true,
              hideOnMobile: true,
              cell: (emp) => (
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                    <Mail className="h-3 w-3 text-slate-300" /> {emp.email}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                    <Phone className="h-3 w-3 text-slate-300" /> {emp.mobile_number || 'No contact'}
                  </div>
                </div>
              )
            },
            {
              header: 'Status',
              accessorKey: 'is_active',
              sortable: true,
              cell: (emp) => (
                <Badge
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleStatus(emp.id, emp.is_active);
                  }}
                  className={cn(
                    "text-[9px]  font-bold px-3 py-1 rounded-full border-none shadow-sm cursor-pointer hover:scale-105 transition-all",
                    emp.is_active
                      ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                      : "bg-rose-50 text-rose-600 hover:bg-rose-100"
                  )}
                >
                  {emp.is_active ? 'Active' : 'Suspended'}
                </Badge>
              )
            },
            {
              header: 'Actions',
              align: 'right',
              width: '50px',
              cell: (emp) => (
                <div onClick={(e) => e.stopPropagation()} className="flex justify-end items-center ">
                  <DropdownMenu>
                    <DropdownMenuTrigger className="h-8 w-8 p-0 inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/superadmin/employees/${emp.id}`);
                        }}
                        className="cursor-pointer"
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(emp);
                        }}
                        className="cursor-pointer"
                      >
                        <Edit2 className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          confirmDelete(emp);
                        }}
                        className="cursor-pointer text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )
            }
          ]}
        />
      </ManagementLayout>

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
            <div className="h-16 w-16 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center mx-auto mb-4 shadow-inner ring-1 ring-white/30">
              <Mail className="h-8 w-8 text-white" />
            </div>
            <DialogHeader className="relative z-10">
              <DialogTitle className="text-2xl font-bold tracking-tight text-white text-center">
                Email Sent
              </DialogTitle>
              <DialogDescription className="text-emerald-50 font-semibold text-xs mt-1 text-center max-w-sm mx-auto">
                Team Member <span className="font-bold text-white">{newEmployeeName}</span> has been successfully added.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="p-6 bg-background text-center space-y-4">
            <p className="text-slate-600 font-medium text-xs">
              An email containing their temporary password has been sent to their email address.
            </p>
            <Button
              className="w-full h-10 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-xs tracking-wider shadow-sm hover:-translate-y-0.5 transition-transform"
              onClick={() => setIsPasswordModalOpen(false)}
            >
              Close
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
    </>
  );
}

