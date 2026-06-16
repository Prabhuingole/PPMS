import { Badge } from '@/components/ui/badge';

interface CompanyStatusBadgeProps {
  status: string;
}

export function CompanyStatusBadge({ status }: CompanyStatusBadgeProps) {
  const normalizedStatus = status?.toLowerCase() || 'unknown';

  if (normalizedStatus === 'active') {
    return <Badge className="bg-emerald-100 text-emerald-800 border-0 hover:bg-emerald-200">Active</Badge>;
  }
  
  if (normalizedStatus === 'inactive') {
    return <Badge className="bg-slate-100 text-slate-800 border-0 hover:bg-slate-200">Inactive</Badge>;
  }

  return <Badge variant="outline">{status}</Badge>;
}
