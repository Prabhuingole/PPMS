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
  Eye,
  MoreHorizontal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/ui/data-table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { ManagementLayout } from '@/components/layout/ManagementLayout';
import { EmptyState } from '@/components/ui/EmptyState';
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
import { cn } from '@/lib/utils';
import { DeleteConfirmationModal } from "@/components/ui/delete-confirmation-modal";
import { motion, AnimatePresence } from 'motion/react';
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
    <>
    <ManagementLayout
      title="Reporting Managers"
      description="Manage the leaders who oversee project delivery."
      headerActions={
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
          className="bg-primary text-white hover:bg-indigo-700 rounded-lg h-10 px-5 text-sm font-semibold shadow-sm transition-all"
        >
          <Plus className="mr-2 h-4 w-4" /> Add Manager
        </Button>
      }
    >
      <DataTable
        data={managers}
        isLoading={loading}
        searchPlaceholder="Search managers..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        toolbarActions={
          <div className="h-10 px-4 flex items-center justify-center rounded-lg bg-background border border-border text-muted-foreground shadow-sm shrink-0 font-medium text-sm">
            Total: {total}
          </div>
        }
        emptyState={
          <EmptyState
            icon={UserCheck}
            title="No Managers Found"
            description="There are currently no reporting managers matching your criteria."
            className="border-0 rounded-none w-full min-h-[400px]"
          />
        }
        onRowClick={(manager) => router.push(`/superadmin/reporting-managers/${manager.id}`)}
        columns={[
          {
            header: 'Manager Name',
            accessorKey: 'full_name',
            sortable: true,
            cell: (manager) => (
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="h-8 w-8 ring-2 ring-white shadow-sm">
                    <AvatarFallback className="bg-slate-900 text-white text-xs font-bold">
                      {manager.full_name.split(' ').map((n: string) => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className={cn(
                    "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-white shadow-sm",
                    manager.status === 'active' ? "bg-emerald-500" : "bg-red-500"
                  )}></div>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">{manager.full_name}</span>
                  <span className="text-[9px] font-bold text-muted-foreground tracking-wider">ID: #{manager.id}</span>
                </div>
              </div>
            )
          },
          {
            header: 'Designation',
            accessorKey: 'designation',
            sortable: true,
            hideOnMobile: true,
            cell: (manager) => (
              <div className="flex items-center gap-2">
                 <Briefcase className="h-3.5 w-3.5 text-slate-300" />
                 <span className="text-xs font-bold text-foreground">{manager.designation || 'Specialist'}</span>
              </div>
            )
          },
          {
            header: 'Contact Channels',
            accessorKey: 'email',
            sortable: true,
            hideOnMobile: true,
            cell: (manager) => (
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                  <Mail className="h-3 w-3 text-slate-300" /> {manager.email}
                </div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                  <Phone className="h-3 w-3 text-slate-300" /> {manager.mobile_number || 'No contact'}
                </div>
              </div>
            )
          },
          {
            header: 'Actions',
            align: 'right',
            width: '50px',
            cell: (manager) => (
              <div onClick={(e) => e.stopPropagation()} className="flex items-center justify-end ">
                <DropdownMenu>
                  <DropdownMenuTrigger className="h-8 w-8 p-0 inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground">
<span className="sr-only">Open menu</span>
<MoreHorizontal className="h-4 w-4" />
</DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/superadmin/reporting-managers/${manager.id}`);
                      }}
                      className="cursor-pointer"
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(manager);
                      }}
                      className="cursor-pointer"
                    >
                      <Edit2 className="mr-2 h-4 w-4" />
                      Edit Manager
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.stopPropagation();
                        confirmDelete(manager);
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

      {/* Modern High-Fidelity Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden border-border gap-0">
          <EnterpriseModalHeader
            title={editingManager ? 'Edit Manager' : 'Register New Manager'}
            subtitle={editingManager ? 'Update manager profile' : 'Fill in the details to add a new manager'}
            icon={UserPlus}
            intent="normal"
          />
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col">
              <div className="p-6 bg-background space-y-6">
                <div className="grid grid-cols-1 gap-4">
                  <FormField
                    control={form.control}
                    name="full_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold text-foreground">Full Name <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="Enter full name..." {...field} className="h-10" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormGrid>
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold text-foreground">Email Address <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="manager@system.com" {...field} className="h-10" />
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
                        <FormLabel className="text-sm font-semibold text-foreground">Mobile Number <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="9876543210" 
                            {...field} 
                            maxLength={10}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                              field.onChange(value);
                            }}
                            className="h-10" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </FormGrid>

                <div className="grid grid-cols-1 gap-4">
                  <FormField
                    control={form.control}
                    name="designation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold text-foreground">Designation <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="Senior Lead Manager" {...field} className="h-10" />
                        </FormControl>
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
                  onClick={() => setIsModalOpen(false)}
                  className="h-10 px-4"
                >
                  Discard Changes
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="h-10 px-6"
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
              </EnterpriseModalFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>



      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        onConfirm={handleDelete}
        itemName={`Reporting Manager "${managerToDelete?.full_name}"`}
        isDeleting={isDeleting}
      />
    </>
  );
}

