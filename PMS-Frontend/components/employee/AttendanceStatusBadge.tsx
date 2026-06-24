import { Badge } from '@/components/ui/badge';

interface AttendanceStatusBadgeProps {
  status?: string;
  timesheetStatus?: string | null;
}

export function AttendanceStatusBadge({ status, timesheetStatus }: AttendanceStatusBadgeProps) {
  if (status === 'Completed' && timesheetStatus === 'submitted') {
    return <Badge className="bg-emerald-50 text-emerald-600 border-none text-[8px] font-black uppercase rounded-lg">Complete</Badge>;
  }
  if (status === 'Completed' && timesheetStatus === 'pending') {
    return <Badge className="bg-amber-50 text-amber-600 border-none text-[8px] font-black uppercase rounded-lg">Timesheet Pending</Badge>;
  }
  if (status === 'Working') {
    return <Badge className="bg-orange-50 text-orange-600 border-none text-[8px] font-black uppercase rounded-lg">Working</Badge>;
  }
  if (status === 'WFH') {
    return <Badge className="bg-purple-50 text-purple-600 border-none text-[8px] font-black uppercase rounded-lg">WFH</Badge>;
  }
  return <Badge className="bg-muted text-muted-foreground border-none text-[8px] font-black uppercase rounded-lg">{status}</Badge>;
}
