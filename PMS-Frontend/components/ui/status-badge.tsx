import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type StatusVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'purple' | 'cyan';

interface StatusBadgeProps {
  status: string;
  variant?: StatusVariant;
  className?: string;
}

export function StatusBadge({ status, variant, className }: StatusBadgeProps) {
  // Try to auto-detect variant if not provided
  let detectedVariant: StatusVariant = variant || 'neutral';
  
  if (!variant) {
    const s = status.toLowerCase();
    if (['active', 'completed', 'approved', 'success', 'present', 'full-day'].includes(s)) detectedVariant = 'success';
    else if (['pending', 'on-hold', 'working', 'half-day'].includes(s)) detectedVariant = 'warning';
    else if (['inactive', 'rejected', 'failed', 'absent', 'leave'].includes(s)) detectedVariant = 'error';
    else if (['public-holiday'].includes(s)) detectedVariant = 'info';
    else if (['late-arrival'].includes(s)) detectedVariant = 'purple';
    else if (['early-arrival'].includes(s)) detectedVariant = 'cyan';
  }

  const variants = {
    success: 'bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-400 dark:ring-emerald-500/30',
    warning: 'bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/20 dark:bg-amber-500/20 dark:text-amber-400 dark:ring-amber-500/30',
    error: 'bg-red-500/10 text-red-600 ring-1 ring-red-500/20 dark:bg-red-500/20 dark:text-red-400 dark:ring-red-500/30',
    info: 'bg-blue-500/10 text-blue-600 ring-1 ring-blue-500/20 dark:bg-blue-500/20 dark:text-blue-400 dark:ring-blue-500/30',
    purple: 'bg-purple-500/10 text-purple-600 ring-1 ring-purple-500/20 dark:bg-purple-500/20 dark:text-purple-400 dark:ring-purple-500/30',
    cyan: 'bg-cyan-500/10 text-cyan-600 ring-1 ring-cyan-500/20 dark:bg-cyan-500/20 dark:text-cyan-400 dark:ring-cyan-500/30',
    neutral: 'bg-muted text-muted-foreground ring-1 ring-border',
  };

  return (
    <Badge 
      variant="outline" 
      className={cn(
        "font-black text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-md border-none",
        variants[detectedVariant],
        className
      )}
    >
      {status}
    </Badge>
  );
}
