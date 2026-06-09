import React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export type StatusType = 'success' | 'warning' | 'danger' | 'info' | 'default';

interface StatusBadgeProps {
  status: string;
  type?: StatusType;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}

const statusTypeMap: Record<string, StatusType> = {
  // Map common strings to types
  active: 'success',
  approved: 'success',
  completed: 'success',
  
  pending: 'warning',
  ongoing: 'warning',
  suspended: 'warning',
  
  rejected: 'danger',
  absent: 'danger',
  inactive: 'danger',
  
  info: 'info',
  draft: 'default',
};

const statusStyles: Record<StatusType, string> = {
  success: 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-400 dark:hover:bg-emerald-500/30',
  warning: 'bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-400 dark:hover:bg-amber-500/30',
  danger: 'bg-rose-50 text-rose-600 hover:bg-rose-100 border-rose-200/50',
  info: 'bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border-blue-500/20 dark:bg-blue-500/20 dark:text-blue-400 dark:hover:bg-blue-500/30',
  default: 'bg-muted text-muted-foreground hover:bg-muted/80 border-border',
};

export function StatusBadge({ status, type, className, onClick }: StatusBadgeProps) {
  const normalizedStatus = status.toLowerCase();
  const badgeType = type || statusTypeMap[normalizedStatus] || 'default';
  const styles = statusStyles[badgeType];

  return (
    <Badge 
      onClick={onClick}
      className={cn(
        "px-2.5 py-0.5 rounded-md font-semibold text-xs border transition-colors shadow-none",
        styles,
        onClick && "cursor-pointer hover:scale-[1.02]",
        className
      )}
    >
      {status}
    </Badge>
  );
}
