'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { BillingReport } from '@/services/billingService';
import { formatCurrency } from '@/lib/formatters/currency';

interface CostChartsProps {
  data: BillingReport;
}

export function CostCharts({ data }: CostChartsProps) {
  // Consultant Allocation Pie Data
  const allocationData = [
    { name: 'Assigned', value: data.assigned_consultants || 0 },
    { name: 'Unassigned', value: data.unassigned_consultants || 0 }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
      <Card>
        <CardHeader>
          <CardTitle>Cost By Project</CardTitle>
          <CardDescription>Accumulated cost per project</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.cost_by_project || []} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="project_name" />
              <YAxis tickFormatter={(value) => `$${value}`} />
              <RechartsTooltip formatter={(value: number) => formatCurrency(value, 'USD')} />
              <Bar dataKey="cost" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cost By Consultant</CardTitle>
          <CardDescription>Accumulated cost per consultant</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.cost_by_consultant || []} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="consultant_name" />
              <YAxis tickFormatter={(value) => `$${value}`} />
              <RechartsTooltip formatter={(value: number) => formatCurrency(value, 'USD')} />
              <Bar dataKey="cost" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Cost Trend</CardTitle>
          <CardDescription>Cost accumulation over time</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.monthly_cost_trends || []} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => `$${value}`} />
              <RechartsTooltip formatter={(value: number) => formatCurrency(value, 'USD')} />
              <Line type="monotone" dataKey="cost" stroke="#8b5cf6" strokeWidth={3} activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Consultant Allocation</CardTitle>
          <CardDescription>Assigned vs Unassigned Consultants</CardDescription>
        </CardHeader>
        <CardContent className="h-80 flex justify-center items-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={allocationData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {allocationData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#ef4444'} />
                ))}
              </Pie>
              <RechartsTooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
