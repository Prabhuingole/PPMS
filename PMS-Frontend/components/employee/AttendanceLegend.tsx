import { cn } from '@/lib/utils';

export function AttendanceLegend() {
  return (
    <div className="grid grid-cols-2 gap-2">
      {[
        { color: 'bg-emerald-500', label: 'Complete' },
        { color: 'bg-purple-500', label: 'WFH' },
        { color: 'bg-amber-400', label: 'Timesheet Pending' },
        { color: 'bg-orange-500', label: 'Working' },
        { color: 'bg-red-200', label: 'Absent' },
      ].map(item => (
        <div key={item.label} className="flex items-center gap-2">
          <div className={cn("w-3 h-3 rounded-full shrink-0", item.color)} />
          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
