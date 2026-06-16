'use client';

import { useState } from 'react';
import { useCompanies } from '@/services/companyService';
import { CompanyTable } from '@/components/company/CompanyTable';
import { InHouseCompanyFormModal } from '@/components/company/InHouseCompanyFormModal';
import { CompanyDetailsDrawer } from '@/components/company/CompanyDetailsDrawer';
import { Company } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Loader2, Plus, Building2, Search, Filter } from 'lucide-react';
import { useDebounce } from 'use-debounce';
import { useRouter } from 'next/navigation';

export default function CompaniesPage() {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const [debouncedSearch] = useDebounce(searchTerm, 500);

  const { data, isLoading } = useCompanies({
    page,
    limit: 10,
    search: debouncedSearch || undefined,
    status: statusFilter === 'all' ? undefined : statusFilter,
    company_type: 'in_house',
  });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [viewCompany, setViewCompany] = useState<Company | null>(null);
  
  const [showAdminPrompt, setShowAdminPrompt] = useState(false);
  const [newCompanyId, setNewCompanyId] = useState<number | null>(null);
  const router = useRouter();

  const handleCreate = () => {
    setSelectedCompany(null);
    setIsFormOpen(true);
  };

  const handleEdit = (company: Company) => {
    setSelectedCompany(company);
    setIsFormOpen(true);
  };

  const handleView = (company: Company) => {
    setViewCompany(company);
    setIsDrawerOpen(true);
  };

  return (
    <div className="flex-1 p-4 sm:p-8 bg-muted/10 min-h-[calc(100vh-4rem)]">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-border shadow-sm">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-2">
              <Building2 className="w-8 h-8 text-blue-600" />
              In House Companies
            </h1>
            <p className="text-muted-foreground mt-1 text-lg">Manage your in-house teams working on client projects.</p>
          </div>
          <Button onClick={handleCreate} className="h-11 px-6 shadow-sm">
            <Plus className="w-4 h-4 mr-2" />
            Add In House Company
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-xl border border-border shadow-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search companies by name, code, or email..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="pl-9 bg-muted/50 border-transparent hover:bg-muted focus:bg-background transition-colors"
            />
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select 
              value={statusFilter} 
              onValueChange={(val) => {
                setStatusFilter(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-[160px] bg-muted/50 border-transparent hover:bg-muted focus:bg-background">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table / Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center py-24 bg-white rounded-xl border border-border">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="space-y-4">
            <CompanyTable 
              companies={data?.items || []} 
              onEdit={handleEdit} 
              onView={handleView} 
            />
            
            {/* Pagination Controls */}
            {data && data.pages > 1 && (
              <div className="flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-border">
                <div className="text-sm text-muted-foreground">
                  Showing <span className="font-medium text-foreground">{(page - 1) * 10 + 1}</span> to <span className="font-medium text-foreground">{Math.min(page * 10, data.total)}</span> of <span className="font-medium text-foreground">{data.total}</span> companies
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <div className="text-sm font-medium px-2 text-foreground">
                    Page {page} of {data.pages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(data.pages, p + 1))}
                    disabled={page === data.pages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <InHouseCompanyFormModal 
        open={isFormOpen} 
        onOpenChange={setIsFormOpen} 
        company={selectedCompany} 
        defaultCompanyType="in_house"
        onSuccessCreate={(company) => {
          setNewCompanyId(company.id);
          setShowAdminPrompt(true);
        }}
      />

      <CompanyDetailsDrawer
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        company={viewCompany}
        onEdit={handleEdit}
        onReactivateSuccess={() => {
          setPage(1); // Refresh data
        }}
      />
      
      <Dialog open={showAdminPrompt} onOpenChange={setShowAdminPrompt}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Company Created Successfully</DialogTitle>
            <DialogDescription>
              Would you like to create a Company Admin for this new company now?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowAdminPrompt(false)}>
              Not right now
            </Button>
            <Button onClick={() => router.push(`/superadmin/employees?create_admin=true&company_id=${newCompanyId}`)}>
              Create Admin
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
