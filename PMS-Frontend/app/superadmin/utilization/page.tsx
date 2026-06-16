'use client';

import { useUtilization } from '@/services/resourceReportingService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Zap } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function UtilizationDashboard() {
  const { data, isLoading } = useUtilization();

  if (isLoading) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!data) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'HEALTHY':
        return <Badge className="bg-emerald-100 text-emerald-800 border-0">Healthy</Badge>;
      case 'UNDERUTILIZED':
        return <Badge className="bg-slate-100 text-slate-800 border-0">Underutilized</Badge>;
      case 'FULL_CAPACITY':
        return <Badge className="bg-yellow-100 text-yellow-800 border-0">Full Capacity</Badge>;
      case 'OVERALLOCATED':
        return <Badge className="bg-red-100 text-red-800 border-0">Overallocated</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getProgressColor = (status: string) => {
    switch (status) {
      case 'HEALTHY': return 'bg-emerald-500';
      case 'UNDERUTILIZED': return 'bg-slate-400';
      case 'FULL_CAPACITY': return 'bg-yellow-500';
      case 'OVERALLOCATED': return 'bg-red-500';
      default: return 'bg-blue-500';
    }
  };

  return (
    <div className="flex-1 p-4 sm:p-8 bg-muted/10 min-h-[calc(100vh-4rem)]">
      <div className="max-w-6xl mx-auto space-y-6">
        
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-2">
            <Zap className="w-8 h-8 text-blue-600" />
            Consultant Utilization
          </h1>
          <p className="text-muted-foreground mt-1 text-lg">Monitor individual capacity, allocations, and logged hours.</p>
        </div>

        <Card className="shadow-sm border-border">
          <CardHeader>
            <CardTitle>Utilization Roster</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Consultant</TableHead>
                  <TableHead className="text-right">Capacity (hrs)</TableHead>
                  <TableHead className="text-right">Allocated (hrs)</TableHead>
                  <TableHead className="text-right">Logged (hrs)</TableHead>
                  <TableHead className="w-[200px]">Utilization</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row) => (
                  <TableRow key={row.user_id}>
                    <TableCell className="font-medium">{row.consultant_name}</TableCell>
                    <TableCell className="text-right">{row.weekly_capacity_hours}</TableCell>
                    <TableCell className="text-right">{row.allocated_hours}</TableCell>
                    <TableCell className="text-right">{row.logged_hours}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${getProgressColor(row.status)}`} 
                            style={{ width: `${Math.min(row.utilization_percentage, 100)}%` }} 
                          />
                        </div>
                        <span className="text-xs font-semibold w-10 text-right">
                          {row.utilization_percentage.toFixed(0)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(row.status)}</TableCell>
                  </TableRow>
                ))}
                {data.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No utilization data found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
