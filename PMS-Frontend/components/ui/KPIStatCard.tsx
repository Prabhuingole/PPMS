import React from 'react';
import { Card } from '@/components/ui/card';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KPIStatCardProps {
  title: string;
  value: string | number;
  trend?: {
    value: number;
    label: string;
    direction: 'up' | 'down' | 'neutral';
  };
  icon: React.ElementType;
  className?: string;
}

export function KPIStatCard({ title, value, trend, icon: Icon, className = '' }: KPIStatCardProps) {
  return (
    <Card className={cn("border border-border rounded-xl bg-card shadow-sm p-6", className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">{title}</p>
          <h3 className="text-2xl font-bold text-foreground mt-2 tracking-tight">{value}</h3>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-primary">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      
      {trend && (
        <div className="mt-4 flex items-center gap-2">
          <div className={cn(
            "flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md",
            trend.direction === 'up' ? "bg-emerald-50 text-emerald-600" :
            trend.direction === 'down' ? "bg-rose-50 text-rose-600" :
            "bg-muted text-slate-600"
          )}>
            {trend.direction === 'up' && <ArrowUpRight className="h-3 w-3" />}
            {trend.direction === 'down' && <ArrowDownRight className="h-3 w-3" />}
            {trend.direction === 'neutral' && <Minus className="h-3 w-3" />}
            {trend.value}%
          </div>
          <span className="text-[10px] font-medium text-muted-foreground">{trend.label}</span>
        </div>
      )}
    </Card>
  );
}
