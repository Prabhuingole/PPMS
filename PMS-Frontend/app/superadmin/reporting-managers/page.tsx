'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  UserCheck,
  Building2,
  Mail,
  Phone,
} from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ManagementLayout } from '@/components/layout/ManagementLayout';
import { EmptyState } from '@/components/ui/EmptyState';
import { cn } from '@/lib/utils';
import { employeeService } from '@/services/employeeService';
import { Employee } from '@/types';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { ReportingManagerFormModal } from '@/components/reporting-managers/ReportingManagerFormModal';

export default function ReportingManagerListPage() {
  const [managers, setManagers] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  const router = useRouter();

  const fetchManagers = async () => {
    try {
      setLoading(true);
      const data = await employeeService.getEmployees({
        page: 1,
        limit: 1000,
        search: searchTerm,
        is_reporting_manager: true
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
  }, [searchTerm]);

  return (
    <>
    <ManagementLayout
      title="Reporting Managers"
      description="View the leaders who oversee project delivery."
      headerActions={
        <Button onClick={() => setIsAddModalOpen(true)} className="h-9 shadow-sm font-semibold">
          <Plus className="w-4 h-4 mr-2" />
          Add Reporting Manager
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
            description="There are currently no team members acting as reporting managers."
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
                    manager.is_active ? "bg-emerald-500" : "bg-red-500"
                  )}></div>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">{manager.full_name}</span>
                  <span className="text-[9px] font-bold text-muted-foreground tracking-wider">EMP-ID: #{manager.employee_id}</span>
                </div>
              </div>
            )
          },
          {
            header: 'Designation',
            accessorKey: 'designation',
            sortable: true,
            cell: (manager) => (
              <Badge variant="secondary" className="font-semibold px-2.5 py-0.5 text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 border-0">
                {manager.designation || 'N/A'}
              </Badge>
            )
          },
          {
            header: 'Company',
            accessorKey: 'company_name',
            cell: (manager) => (
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-semibold text-slate-700">
                  {manager.company_name || 'In-House'}
                </span>
              </div>
            )
          },
          {
            header: 'Contact Info',
            accessorKey: 'email',
            cell: (manager) => (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                  <Mail className="h-3 w-3 shrink-0" />
                  <span className="text-xs font-medium">{manager.email}</span>
                </div>
                {manager.mobile_number && (
                  <div className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                    <Phone className="h-3 w-3 shrink-0" />
                    <span className="text-[11px] font-medium">{manager.mobile_number}</span>
                  </div>
                )}
              </div>
            )
          },
          {
            header: 'Status',
            accessorKey: 'is_active',
            cell: (manager) => (
              <Badge variant="outline" className={cn(
                "font-semibold text-[10px] tracking-wide uppercase px-2 py-0.5 border",
                manager.is_active 
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-red-50 text-red-700 border-red-200"
              )}>
                {manager.is_active ? 'Active' : 'Inactive'}
              </Badge>
            )
          }
        ]}
      />
    </ManagementLayout>
    <ReportingManagerFormModal 
      open={isAddModalOpen} 
      onOpenChange={setIsAddModalOpen}
      onSuccess={fetchManagers}
    />
    </>
  );
}
