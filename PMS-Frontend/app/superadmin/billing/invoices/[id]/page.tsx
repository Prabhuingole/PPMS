'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { billingService } from '@/services/billingService';
import { companyService } from '@/services/companyService';
import { formatCurrency } from '@/lib/formatters/currency';
import { INVOICE_STATUS_CONFIG, INVOICE_STATUS } from '@/lib/constants/invoice-status';
import { ArrowLeft, Send, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const invoiceId = Number(id);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);

  const { data: invoice, isLoading: invoiceLoading } = useQuery({
    queryKey: ['invoice', invoiceId],
    queryFn: () => billingService.getInvoice(invoiceId),
    staleTime: 30 * 1000,
  });

  const { data: companies } = useQuery({
    queryKey: ['companies'],
    queryFn: () => companyService.getCompanies(),
  });

  const issueMutation = useMutation({
    mutationFn: () => billingService.issueInvoice(invoiceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['billingReports'] });
    }
  });

  const payMutation = useMutation({
    mutationFn: () => billingService.payInvoice(invoiceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['billingReports'] });
    }
  });

  const cancelMutation = useMutation({
    mutationFn: () => billingService.cancelInvoice(invoiceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['billingReports'] });
    }
  });

  if (invoiceLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[200px] w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-slate-800">Invoice Not Found</h2>
          <Button onClick={() => router.push('/superadmin/billing/invoices')} className="mt-4">
            Return to Invoices
          </Button>
        </div>
      </div>
    );
  }

  const statusConfig = INVOICE_STATUS_CONFIG[invoice.status] || {
    label: invoice.status,
    variant: 'secondary',
    colorClass: 'bg-slate-100 text-slate-700',
  };

  const clientName = companies?.find(c => c.id === invoice.client_company_id)?.name || `Client #${invoice.client_company_id}`;
  const vendorName = companies?.find(c => c.id === invoice.vendor_company_id)?.name || `Vendor #${invoice.vendor_company_id}`;

  const isDraft = invoice.status === INVOICE_STATUS.DRAFT;
  const isIssued = invoice.status === INVOICE_STATUS.ISSUED;
  const isOverdue = invoice.status === INVOICE_STATUS.OVERDUE;
  const canPay = isIssued || isOverdue;

  return (
    <div className="p-6 space-y-6 max-w-[1200px] mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/superadmin/billing/invoices">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Invoice {invoice.invoice_number}
        </h1>
        <Badge variant={statusConfig.variant} className={statusConfig.colorClass}>
          {statusConfig.label}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Actions Sidebar */}
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isDraft && (
                <>
                  <AlertDialog open={isIssueModalOpen} onOpenChange={setIsIssueModalOpen}>
                    <Button onClick={() => setIsIssueModalOpen(true)} className="w-full justify-start gap-2 bg-blue-600 hover:bg-blue-700">
                      <Send className="w-4 h-4" /> Issue Invoice
                    </Button>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Issue this invoice?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will finalize the invoice and mark it as ISSUED. Associated timesheets will become permanently locked.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setIsIssueModalOpen(false)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => {
                            setIsIssueModalOpen(false);
                            issueMutation.mutate();
                          }} className="bg-blue-600">
                          Confirm Issue
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  <AlertDialog open={isCancelModalOpen} onOpenChange={setIsCancelModalOpen}>
                    <Button onClick={() => setIsCancelModalOpen(true)} variant="outline" className="w-full justify-start gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200">
                      <XCircle className="w-4 h-4" /> Cancel Invoice
                    </Button>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Cancel invoice?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. The invoice will be cancelled and timesheets will be freed for re-invoicing.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setIsCancelModalOpen(false)}>Go Back</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => {
                            setIsCancelModalOpen(false);
                            cancelMutation.mutate();
                          }} className="bg-red-600">
                          Confirm Cancel
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}

              {canPay && (
                <AlertDialog open={isPayModalOpen} onOpenChange={setIsPayModalOpen}>
                  <Button onClick={() => setIsPayModalOpen(true)} className="w-full justify-start gap-2 bg-emerald-600 hover:bg-emerald-700">
                    <CheckCircle className="w-4 h-4" /> Mark as Paid
                  </Button>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Mark invoice as Paid?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will log the revenue as collected. Ensure you have verified the payment before proceeding.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel onClick={() => setIsPayModalOpen(false)}>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => {
                          setIsPayModalOpen(false);
                          payMutation.mutate();
                        }} className="bg-emerald-600">
                        Confirm Payment
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}

              {!isDraft && !canPay && (
                <div className="text-sm text-slate-500 italic text-center py-4">
                  No actions available for current status.
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-slate-500">Vendor</p>
                <p className="font-semibold text-slate-900">{vendorName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Client</p>
                <p className="font-semibold text-slate-900">{clientName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Created By</p>
                <p className="text-slate-900">User #{invoice.created_by_id}</p>
              </div>
              {invoice.issued_by_id && (
                <div>
                  <p className="text-sm font-medium text-slate-500">Issued By</p>
                  <p className="text-slate-900">User #{invoice.issued_by_id}</p>
                </div>
              )}
              {invoice.paid_by_id && (
                <div>
                  <p className="text-sm font-medium text-slate-500">Paid By</p>
                  <p className="text-slate-900">User #{invoice.paid_by_id}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Financial Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-600">Subtotal</span>
                  <span className="font-medium">{formatCurrency(invoice.subtotal, invoice.currency)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-600">Tax Amount</span>
                  <span className="font-medium">{formatCurrency(invoice.tax_amount, invoice.currency)}</span>
                </div>
                <div className="flex justify-between items-center py-3 mt-2">
                  <span className="text-lg font-bold text-slate-900">Total</span>
                  <span className="text-2xl font-bold text-slate-900">
                    {formatCurrency(invoice.total_amount, invoice.currency)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Associated Timesheets</CardTitle>
              <CardDescription>Breakdown of hours billed in this invoice</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border border-slate-200 overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>User ID</TableHead>
                      <TableHead>Project ID</TableHead>
                      <TableHead className="text-right">Hours</TableHead>
                      <TableHead className="text-right">Rate</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(!invoice.timesheets || invoice.timesheets.length === 0) ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-slate-500 py-6">
                          No timesheet details found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      invoice.timesheets.map((ts: any) => (
                        <TableRow key={ts.id}>
                          <TableCell>{new Date(ts.date).toLocaleDateString()}</TableCell>
                          <TableCell>#{ts.user_id}</TableCell>
                          <TableCell>#{ts.project_id}</TableCell>
                          <TableCell className="text-right">{ts.hours}</TableCell>
                          <TableCell className="text-right">{formatCurrency(ts.billed_rate, invoice.currency)}</TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(ts.hours * ts.billed_rate, invoice.currency)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
