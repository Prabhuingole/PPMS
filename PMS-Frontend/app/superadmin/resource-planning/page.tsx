'use client';

import { useResourceSummary } from '@/services/resourceReportingService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Users, UserCheck, UserMinus, FolderOpen, Percent, Activity } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

export default function ResourcePlanningDashboard() {
  const { data, isLoading } = useResourceSummary();

  if (isLoading) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!data) return null;

  const utilizationData = [
    { name: 'Allocated Hours', value: data.total_allocated_hours },
    { name: 'Available Hours', value: data.available_capacity_hours }
  ];

  const consultantData = [
    { name: 'Assigned', value: data.assigned_consultants },
    { name: 'Unassigned', value: data.unassigned_consultants }
  ];

  const COLORS = ['#3b82f6', '#e2e8f0'];
  const STATUS_COLORS = ['#10b981', '#f43f5e'];

  return (
    <div className="flex-1 p-4 sm:p-8 bg-muted/10 min-h-[calc(100vh-4rem)]">
      <div className="max-w-6xl mx-auto space-y-6">
        
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-2">
            <Activity className="w-8 h-8 text-blue-600" />
            Resource Planning
          </h1>
          <p className="text-muted-foreground mt-1 text-lg">High-level capacity and allocation overview.</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="shadow-sm border-border">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg text-blue-700">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Consultants</p>
                  <p className="text-2xl font-bold">{data.active_consultants}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm border-border">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg text-emerald-700">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Assigned</p>
                  <p className="text-2xl font-bold">{data.assigned_consultants}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg text-red-700">
                  <UserMinus className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Unassigned</p>
                  <p className="text-2xl font-bold">{data.unassigned_consultants}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg text-purple-700">
                  <FolderOpen className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Open Projects</p>
                  <p className="text-2xl font-bold">{data.open_projects}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border bg-slate-900 text-slate-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-800 rounded-lg text-blue-400">
                  <Percent className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-400">Total Utilization</p>
                  <p className="text-2xl font-bold">{data.utilization_percentage}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-sm border-border col-span-1">
            <CardHeader>
              <CardTitle>Capacity vs Allocation</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={utilizationData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {utilizationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value} hrs`} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border col-span-1">
            <CardHeader>
              <CardTitle>Consultant Status</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={consultantData} layout="vertical" margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" />
                  <Tooltip />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {consultantData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
