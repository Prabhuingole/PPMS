'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { billingService } from '@/services/billingService';
import { formatCurrency } from '@/lib/formatters/currency';
import { INVOICE_STATUS_CONFIG } from '@/lib/constants/invoice-status';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, FileText, ChevronRight } from 'lucide-react';
import { companyService } from '@/services/companyService';

export default function InvoiceListPage() {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [vendorFilter, setVendorFilter] = useState<string>('ALL');
  const [clientFilter, setClientFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: invoices, isLoading } = useQuery({
    queryKey: ['invoices', statusFilter, vendorFilter, clientFilter],
    queryFn: () => billingService.listInvoices({
      status: statusFilter !== 'ALL' ? statusFilter : undefined,
      vendor_id: vendorFilter !== 'ALL' ? Number(vendorFilter) : undefined,
      client_id: clientFilter !== 'ALL' ? Number(clientFilter) : undefined,
    }),
  });

  const { data: companies } = useQuery({
    queryKey: ['companies'],
    queryFn: () => companyService.getCompanies(),
  });

  // Client-side search (as simple text filter)
  const filteredInvoices = React.useMemo(() => {
    if (!invoices) return [];
    if (!searchQuery) return invoices;
    const lowerQuery = searchQuery.toLowerCase();
    return invoices.filter(inv => 
      inv.invoice_number.toLowerCase().includes(lowerQuery)
    );
  }, [invoices, searchQuery]);

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Invoices</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage, view, and track all billing invoices.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="text-lg">All Invoices</CardTitle>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-[250px]">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search invoice number..."
                  className="pl-9 h-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] h-10">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  {Object.entries(INVOICE_STATUS_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Advanced filters could go here */}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-slate-200 overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50/80">
                <TableRow>
                  <TableHead className="font-semibold text-slate-700">Invoice Number</TableHead>
                  <TableHead className="font-semibold text-slate-700">Client</TableHead>
                  <TableHead className="font-semibold text-slate-700">Vendor</TableHead>
                  <TableHead className="text-right font-semibold text-slate-700">Total</TableHead>
                  <TableHead className="font-semibold text-slate-700">Status</TableHead>
                  <TableHead className="text-right font-semibold text-slate-700">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array(5).fill(0).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell align="right"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                      <TableCell align="right"><Skeleton className="h-8 w-8 rounded-md ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                      No invoices found matching your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInvoices.map((invoice) => {
                    const statusConfig = INVOICE_STATUS_CONFIG[invoice.status] || {
                      label: invoice.status,
                      variant: 'secondary',
                      colorClass: 'bg-slate-100 text-slate-700',
                    };
                    
                    // Simple helper to find company names if we have the list
                    const clientName = companies?.find(c => c.id === invoice.client_company_id)?.name || `Client #${invoice.client_company_id}`;
                    const vendorName = companies?.find(c => c.id === invoice.vendor_company_id)?.name || `Vendor #${invoice.vendor_company_id}`;

                    return (
                      <TableRow key={invoice.id} className="hover:bg-slate-50/50">
                        <TableCell className="font-medium text-slate-900">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-slate-400" />
                            {invoice.invoice_number}
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-600">{clientName}</TableCell>
                        <TableCell className="text-slate-600">{vendorName}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(invoice.total_amount, invoice.currency)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusConfig.variant} className={statusConfig.colorClass}>
                            {statusConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/superadmin/billing/invoices/${invoice.id}`}>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-500 hover:text-slate-900">
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
