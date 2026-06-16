'use client';

import { useProjectHealth } from '@/services/resourceReportingService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, ActivitySquare } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function ProjectHealthDashboard() {
  const { data, isLoading } = useProjectHealth();

  if (isLoading) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!data) return null;

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'HEALTHY':
        return <Badge className="bg-emerald-100 text-emerald-800 border-0">Healthy</Badge>;
      case 'WATCH':
        return <Badge className="bg-yellow-100 text-yellow-800 border-0">Watch</Badge>;
      case 'CRITICAL':
        return <Badge className="bg-red-100 text-red-800 border-0">Critical</Badge>;
      default:
        return <Badge variant="outline">{risk}</Badge>;
    }
  };

  const getProgressBar = (percentage: number, colorClass: string) => (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full ${colorClass}`} 
          style={{ width: `${Math.min(Math.max(percentage, 0), 100)}%` }} 
        />
      </div>
      <span className="text-xs font-semibold w-10 text-right">
        {percentage.toFixed(0)}%
      </span>
    </div>
  );

  return (
    <div className="flex-1 p-4 sm:p-8 bg-muted/10 min-h-[calc(100vh-4rem)]">
      <div className="max-w-6xl mx-auto space-y-6">
        
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-2">
            <ActivitySquare className="w-8 h-8 text-blue-600" />
            Project Health
          </h1>
          <p className="text-muted-foreground mt-1 text-lg">Compare financial burn rate against actual execution progress.</p>
        </div>

        <Card className="shadow-sm border-border">
          <CardHeader>
            <CardTitle>Health Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead className="w-[200px]">Burn Rate</TableHead>
                  <TableHead className="w-[200px]">Execution Progress</TableHead>
                  <TableHead className="text-right">Variance</TableHead>
                  <TableHead>Risk</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row) => (
                  <TableRow key={row.project_id}>
                    <TableCell className="font-medium">{row.project_name}</TableCell>
                    <TableCell>
                      {getProgressBar(row.financial_burn_rate, 'bg-orange-500')}
                    </TableCell>
                    <TableCell>
                      {getProgressBar(row.execution_progress, 'bg-blue-500')}
                    </TableCell>
                    <TableCell className={`text-right font-semibold ${row.variance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                      {row.variance > 0 ? '+' : ''}{row.variance.toFixed(1)}%
                    </TableCell>
                    <TableCell>{getRiskBadge(row.risk)}</TableCell>
                  </TableRow>
                ))}
                {data.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No project health data found.
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
