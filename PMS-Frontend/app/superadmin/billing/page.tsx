'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/formatters/currency';
import { billingService } from '@/services/billingService';
import { CostCharts } from '@/components/billing/CostCharts';
import { CreditCard, DollarSign, Clock, FileText, ArrowRight, Briefcase, Users, UserCheck, UserMinus } from 'lucide-react';
import Link from 'next/link';

export default function BillingDashboard() {
  const { data: reports, isLoading } = useQuery({
    queryKey: ['billingReports'],
    queryFn: () => billingService.getBillingReports(),
    staleTime: 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold">Cost & Resource Analytics</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Cost & Resource Analytics</h1>
          <p className="text-sm text-slate-500 mt-1">
            Overview of consultant utilization, project costs, and capacity planning.
          </p>
        </div>
        <Link href="/superadmin/billing/invoices">
          <Button className="gap-2">
            View All Invoices <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Cost Metrics */}
        <Card className="border-l-4 border-l-blue-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Cost</CardTitle>
            <DollarSign className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {formatCurrency(reports?.total_cost, 'USD')}
            </div>
            <p className="text-xs text-slate-500 mt-1">Overall accumulated cost</p>
          </CardContent>
        </Card>

        {/* Utilization Metrics */}
        <Card className="border-l-4 border-l-emerald-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Utilization %</CardTitle>
            <Clock className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {reports?.utilization_percentage?.toFixed(1) || '0.0'}%
            </div>
            <p className="text-xs text-slate-500 mt-1">Billable / Total Hours</p>
          </CardContent>
        </Card>

        {/* Resource Metrics */}
        <Card className="border-l-4 border-l-purple-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Assigned Consultants</CardTitle>
            <UserCheck className="w-4 h-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {reports?.assigned_consultants || 0}
            </div>
            <p className="text-xs text-slate-500 mt-1">Active on projects</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Unassigned Consultants</CardTitle>
            <UserMinus className="w-4 h-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {reports?.unassigned_consultants || 0}
            </div>
            <p className="text-xs text-slate-500 mt-1">Available capacity</p>
          </CardContent>
        </Card>

        {/* Secondary row */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Hours</CardTitle>
            <Clock className="w-4 h-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {reports?.total_hours?.toFixed(1) || '0.0'}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Billable Hours</CardTitle>
            <Clock className="w-4 h-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {reports?.billable_hours?.toFixed(1) || '0.0'}
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Open Projects</CardTitle>
            <Briefcase className="w-4 h-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {reports?.open_projects || 0}
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Active Consultants</CardTitle>
            <Users className="w-4 h-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {reports?.active_consultants || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {reports && <CostCharts data={reports} />}
    </div>
  );
}
