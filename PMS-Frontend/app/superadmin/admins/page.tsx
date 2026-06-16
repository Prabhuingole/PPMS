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
  Edit2,
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
import { SearchBar } from '@/components/ui/SearchBar';
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
import { EnterpriseModalHeader } from '@/components/ui/enterprise-modal-header';
import { EnterpriseModalFooter } from '@/components/ui/enterprise-modal-footer';
import { FormGrid } from '@/components/ui/form-grid';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { adminService } from '@/services/adminService';
import { companyService } from '@/services/companyService';
import { Employee, Company } from '@/types';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuthStore } from '@/store/authStore';

const adminSchema = z.object({
  employee_id: z.string({ required_error: 'This field is required' }).min(1, 'This field is required'),
  full_name: z.string({ required_error: 'This field is required' }).min(1, 'This field is required').regex(/^[A-Za-z\s]+$/, 'Name cannot contain numbers or special characters'),
  email: z.string({ required_error: 'This field is required' }).trim().toLowerCase().email('Please enter a valid email address').refine(val => val.endsWith('@gmail.com') || val === 'admin@sambhav.com', { message: 'Must be a @gmail.com address' }),
  mobile_number: z.string({ required_error: 'This field is required' }).regex(/^[7-9]\d{9}$/, 'Please enter a valid number'),
  role: z.literal('admin'),
  designation: z.string({ required_error: 'This field is required' }).min(1, 'This field is required'),
  company_id: z.string().optional(),
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
      company_id: '',
    }
  });

  const [companies, setCompanies] = useState<Company[]>([]);

  useEffect(() => {
    companyService.getCompanies({ company_type: 'in_house' }).then(setCompanies).catch(console.error);
  }, []);

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
      const payload = { ...values, company_id: values.company_id ? parseInt(values.company_id) : undefined };
      const result = await adminService.createAdmin(payload as any);
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
      const payload = { ...values, company_id: values.company_id ? parseInt(values.company_id) : undefined };
      await adminService.updateAdmin(adminToEdit.id, payload as any);
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
    <>
      <ManagementLayout
        title="Administrators" 
        description="Manage administrative accounts and permissions." 
        headerActions={
          user?.role === 'superadmin' && (
            <Button
              onClick={() => {
                form.reset();
                form.setValue('employee_id', generateNextAdminId());
                setIsAddModalOpen(true);
              }}
              className="bg-primary text-white hover:bg-indigo-700 rounded-lg h-10 px-5 text-sm font-semibold shadow-sm transition-all"
            >
              <Plus className="mr-2 h-4 w-4" /> Add New Admin
            </Button>
          )
        }
      >
        <DataTable
          data={admins}
          isLoading={loading}
          searchPlaceholder="Search admins by name or email..."
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          toolbarActions={
            <div className="h-10 px-4 flex items-center justify-center rounded-lg bg-background border border-border text-muted-foreground shadow-sm shrink-0 font-medium text-sm">
              Total: {total}
            </div>
          }
          emptyState={
            <EmptyState 
              icon={ShieldAlert}
              title="No Admins Found"
              description="There are currently no administrative accounts matching your criteria."
              className="border-0 rounded-none w-full min-h-[400px]"
            />
          }
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
                    <AvatarFallback className="bg-slate-900 text-white text-xs font-bold">
                      {emp.full_name.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-foreground">{emp.full_name}</span>
                    <span className="text-[9px] font-bold text-muted-foreground tracking-wider">{emp.role}</span>
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
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-foreground">{emp.designation || 'System Admin'}</span>
                  {emp.company_name && (
                    <span className="text-[9px] font-bold text-indigo-500 tracking-wider">
                      {emp.company_name}
                    </span>
                  )}
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
                    <Phone className="h-3 w-3 text-slate-300" /> {emp.mobile_number || 'N/A'}
                  </div>
                </div>
              )
            },
            {
              header: 'Actions',
              align: 'right',
              width: '50px',
              cell: (emp) => (
                <div className="flex justify-end items-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger className="h-8 w-8 p-0 inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground">
<span className="sr-only">Open menu</span>
<MoreHorizontal className="h-4 w-4" />
</DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.stopPropagation();
                          setAdminToEdit(emp);
                          form.reset({
                            employee_id: emp.employee_id || '',
                            full_name: emp.full_name,
                            email: emp.email,
                            mobile_number: emp.mobile_number || '',
                            role: 'admin',
                            designation: emp.designation || 'System Admin',
                            company_id: emp.company_id?.toString() || '',
                          });
                          setIsEditModalOpen(true);
                        }}
                        className="cursor-pointer"
                      >
                        <Edit2 className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.stopPropagation();
                          setAdminToDelete(emp);
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

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden border-border gap-0">
          <EnterpriseModalHeader
            title="Add New Admin"
            subtitle="Configure root-level access parameters securely."
            icon={ShieldCheck}
            intent="normal"
          />

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col">
              <div className="space-y-6 p-6 bg-background">
                <FormGrid>
                  <FormField
                    control={form.control}
                    name="employee_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required className="text-sm font-semibold text-foreground">Identifier</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            readOnly
                            className="h-10 bg-muted/30 cursor-not-allowed text-muted-foreground"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="full_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required className="text-sm font-semibold text-foreground">Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Admin Name" {...field} className="h-10" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </FormGrid>

                <FormGrid>
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required className="text-sm font-semibold text-foreground">Email Address</FormLabel>
                        <FormControl>
                          <Input placeholder="admin@sambhav.com" {...field} className="h-10" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="mobile_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required className="text-sm font-semibold text-foreground">Mobile Number</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="9876543210"
                            {...field}
                            maxLength={10}
                            onChange={(e) => {
                              field.onChange(e.target.value.replace(/\D/g, '').slice(0, 10));
                            }}
                            className="h-10"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </FormGrid>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="designation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required className="text-sm font-semibold text-foreground">Designation</FormLabel>
                        <FormControl>
                          <Input placeholder="System Administrator" {...field} className="h-10" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="company_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold text-foreground">Company</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-10 w-full">
                              <SelectValue placeholder="Select Company (Optional)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {companies.map(c => (
                              <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <EnterpriseModalFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddModalOpen(false)}
                  className="h-10 px-4"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-10 px-6"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : 'Add New Admin'}
                </Button>
              </EnterpriseModalFooter>
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
        <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden border-border gap-0">
          <EnterpriseModalHeader
            title="Edit Admin Details"
            subtitle={`Update details for ${adminToEdit?.full_name}`}
            icon={ShieldCheck}
            intent="normal"
          />

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onEditSubmit)} className="flex flex-col">
              <div className="space-y-6 p-6 bg-background">
                <FormGrid>
                  <FormField
                    control={form.control}
                    name="employee_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required className="text-sm font-semibold text-foreground">Identifier</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            readOnly
                            className="h-10 bg-muted/30 cursor-not-allowed text-muted-foreground"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="full_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required className="text-sm font-semibold text-foreground">Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Admin Name" {...field} className="h-10" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </FormGrid>

                <FormGrid>
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required className="text-sm font-semibold text-foreground">Email Address</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="admin@gmail.com" 
                            {...field} 
                            className="h-10" 
                            readOnly={adminToEdit?.email === 'admin@sambhav.com'}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="mobile_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required className="text-sm font-semibold text-foreground">Mobile Number</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="9876543210"
                            {...field}
                            maxLength={10}
                            onChange={(e) => {
                              field.onChange(e.target.value.replace(/\D/g, '').slice(0, 10));
                            }}
                            className="h-10"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </FormGrid>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="designation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required className="text-sm font-semibold text-foreground">Designation</FormLabel>
                        <FormControl>
                          <Input placeholder="System Administrator" {...field} className="h-10" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="company_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold text-foreground">Company</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-10 w-full">
                              <SelectValue placeholder="Select Company (Optional)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {companies.map(c => (
                              <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <EnterpriseModalFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditModalOpen(false)}
                  className="h-10 px-4"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-10 px-6"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : 'Save Changes'}
                </Button>
              </EnterpriseModalFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
        <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-border gap-0">
          <EnterpriseModalHeader
            title="Admin Initialized"
            subtitle={`${newAdminName} has been provisioned successfully.`}
            icon={ShieldCheck}
            intent="success"
          />
          <div className="p-6 bg-background space-y-4">
            <p className="text-sm text-foreground">
              A temporary password has been emailed to them. They will be forced to secure their account upon first login.
            </p>
          </div>
          <EnterpriseModalFooter>
            <Button
              className="h-10 px-6"
              onClick={() => setIsPasswordModalOpen(false)}
            >
              Close
            </Button>
          </EnterpriseModalFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!adminToDelete} onOpenChange={(open) => !open && setAdminToDelete(null)}>
        <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-border gap-0">
          <EnterpriseModalHeader
            title="Delete Admin?"
            subtitle="This action is permanent and cannot be undone."
            icon={AlertTriangle}
            intent="danger"
          />
          <div className="p-6 bg-background space-y-6">
            <div className="flex flex-col p-4 bg-muted/50 rounded-lg border border-border">
              <span className="text-sm font-semibold text-foreground">{adminToDelete?.full_name}</span>
              <span className="text-sm text-muted-foreground">{adminToDelete?.email}</span>
            </div>
          </div>
          <EnterpriseModalFooter>
            <Button
              variant="outline"
              className="h-10 px-4"
              onClick={() => setAdminToDelete(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="h-10 px-6"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete Admin'}
            </Button>
          </EnterpriseModalFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

