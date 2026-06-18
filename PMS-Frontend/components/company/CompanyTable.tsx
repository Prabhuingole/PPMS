'use client';

import { useState } from 'react';
import { Company } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Edit, Eye, PowerOff, Building2, Trash2 } from 'lucide-react';
import { CompanyStatusBadge } from './CompanyStatusBadge';
import { useDeactivateCompany, useDeleteCompany } from '@/services/companyService';
import { DeleteConfirmationModal } from '@/components/ui/delete-confirmation-modal';
import toast from 'react-hot-toast';

interface CompanyTableProps {
  companies: Company[];
  onEdit: (company: Company) => void;
  onView: (company: Company) => void;
}

export function CompanyTable({ companies, onEdit, onView }: CompanyTableProps) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
  
  const deactivateMutation = useDeactivateCompany();
  const deleteMutation = useDeleteCompany();

  const handleDeactivate = async (id: number) => {
    if (!confirm('Are you sure you want to deactivate this company? Users will no longer be able to log in.')) return;
    try {
      await deactivateMutation.mutateAsync(id);
      toast.success('Company deactivated successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to deactivate company');
    }
  };

  const handleDelete = async () => {
    if (!companyToDelete) return;
    try {
      await deleteMutation.mutateAsync(companyToDelete.id);
      toast.success('Company deleted successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to delete company');
    } finally {
      setIsDeleteModalOpen(false);
      setCompanyToDelete(null);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (companies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white border border-border border-dashed rounded-xl">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
          <Building2 className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-bold mb-2 text-foreground">No companies found</h3>
        <p className="text-muted-foreground text-center max-w-sm mb-6">
          Get started by creating a new tenant company.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-xl border border-border bg-white overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Company</TableHead>
              <TableHead>Client Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created Date</TableHead>
              <TableHead className="w-[80px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {companies.map((company) => (
              <TableRow key={company.id} className="hover:bg-muted/20">
                <TableCell>
                  <div className="font-semibold text-foreground">{company.company_name || company.name}</div>
                  <div className="text-xs font-mono text-muted-foreground mt-0.5">{company.code}</div>
                </TableCell>
                <TableCell className="text-muted-foreground">{company.contact_person || '—'}</TableCell>
                <TableCell className="text-muted-foreground">{company.email || '—'}</TableCell>
                <TableCell className="text-muted-foreground">{company.phone || '—'}</TableCell>
                <TableCell>
                  <CompanyStatusBadge status={company.status} />
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate((company as any).created_at)}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger render={
                      <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-muted">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    } />
                    <DropdownMenuContent align="end" className="w-[160px]">
                      <DropdownMenuItem onClick={() => onView(company)} className="cursor-pointer">
                        <Eye className="mr-2 h-4 w-4" />
                        <span>View Details</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(company)} className="cursor-pointer">
                        <Edit className="mr-2 h-4 w-4" />
                        <span>Edit</span>
                      </DropdownMenuItem>
                      {company.status !== 'inactive' && (
                        <DropdownMenuItem 
                          onClick={() => handleDeactivate(company.id)} 
                          className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-700"
                        >
                          <PowerOff className="mr-2 h-4 w-4" />
                          <span>Deactivate</span>
                        </DropdownMenuItem>
                      )}
                      <div 
                        role="menuitem"
                        onClick={(e) => {
                          e.stopPropagation(); // Stop event from reaching DropdownMenu
                          setCompanyToDelete(company);
                          setIsDeleteModalOpen(true);
                        }} 
                        className="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-red-50 focus:bg-red-50 text-red-600 focus:text-red-700 mt-1"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Delete</span>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <DeleteConfirmationModal 
        isOpen={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        onConfirm={handleDelete}
        itemName={companyToDelete ? `the company "${companyToDelete.name}"` : 'this company'}
        isDeleting={deleteMutation.isPending}
      />
    </>
  );
}
