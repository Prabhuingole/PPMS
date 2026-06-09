import { Card } from '@/components/ui/card';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

interface AttendanceSummaryCardProps {
  stats: {
    present: number;
    absent: number;
    pending: number;
    working: number;
    percentage: number;
  };
}

export function AttendanceSummaryCard({ stats }: AttendanceSummaryCardProps) {
  return (
    <Card className="rounded-xl border-border shadow-sm p-6 bg-card">
      <h3 className="text-sm font-black uppercase tracking-wider text-foreground mb-4">Monthly Summary</h3>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
          <div className="text-[9px] font-black uppercase tracking-widest text-emerald-600 mb-1">Present</div>
          <div className="text-2xl font-black text-emerald-700">{stats.present}</div>
        </div>
        <div className="bg-red-50 rounded-xl p-3 border border-red-100">
          <div className="text-[9px] font-black uppercase tracking-widest text-red-600 mb-1">Absent</div>
          <div className="text-2xl font-black text-red-700">{stats.absent}</div>
        </div>
        <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
          <div className="text-[9px] font-black uppercase tracking-widest text-amber-600 mb-1">Pending TS</div>
          <div className="text-xl font-black text-amber-700">{stats.pending}</div>
        </div>
        <div className="bg-orange-50 rounded-xl p-3 border border-orange-100">
          <div className="text-[9px] font-black uppercase tracking-widest text-orange-600 mb-1">Working</div>
          <div className="text-xl font-black text-orange-700">{stats.working}</div>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex justify-between items-end">
          <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Attendance Rate</div>
          <div className="text-3xl font-black text-primary">{stats.percentage}%</div>
        </div>
        <div className="h-2 w-full bg-muted rounded-full mt-2 overflow-hidden">
          <motion.div 
            initial={{ width: 0 }} animate={{ width: `${stats.percentage}%` }} transition={{ duration: 1 }}
            className={cn(
              "h-full rounded-full",
              stats.percentage >= 90 ? "bg-emerald-500" : stats.percentage >= 75 ? "bg-amber-500" : "bg-red-500"
            )}
          />
        </div>
      </div>
    </Card>
  );
}
