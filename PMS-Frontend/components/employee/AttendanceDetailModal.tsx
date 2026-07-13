import { useState, useEffect } from 'react';
import { Fingerprint, Loader2, Clock, User, Mail, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { EnterpriseModalHeader } from '@/components/ui/enterprise-modal-header';
import { FormSection } from '@/components/ui/form-section';
import { FormGrid } from '@/components/ui/form-grid';
import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

export interface AttendanceRecord {
  id: number;
  user_id?: number;
  date: string;
  clock_in_time: string;
  clock_in_photo?: string | null;
  clock_out_time?: string | null;
  clock_out_photo?: string | null;
  working_hours?: number | null;
  status?: string;
  user_name?: string | null;
  user_email?: string | null;
  user_role?: string | null;
  timesheet_status?: string | null;
  is_auto_clock_out?: boolean;
}

interface AttendanceDetailModalProps {
  record: AttendanceRecord | null;
  onClose: () => void;
}

export function AttendanceDetailModal({ record, onClose }: AttendanceDetailModalProps) {
  const { token } = useAuthStore();
  const [photoUrls, setPhotoUrls] = useState<{ in?: string; out?: string }>({});
  const [photoLoading, setPhotoLoading] = useState(false);
  const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  useEffect(() => {
    if (record && token) {
      setPhotoLoading(true);
      setPhotoUrls({});
      const fetchPhotos = async () => {
        try {
          const headers = { Authorization: `Bearer ${token}` };
          const [inRes, outRes] = await Promise.all([
            axios.get(`${api}/attendance/photo/${record.id}/in`, { headers }).catch(() => null),
            record.clock_out_photo ? axios.get(`${api}/attendance/photo/${record.id}/out`, { headers }).catch(() => null) : null
          ]);
          setPhotoUrls({
            in: inRes?.data?.url,
            out: outRes?.data?.url
          });
        } catch {
          // Ignore
        } finally {
          setPhotoLoading(false);
        }
      };
      fetchPhotos();
    }
  }, [record, token, api]);

  if (!record) return null;

  const formatTime = (iso: string) => {
    if (!iso) return '—';
    const dateStr = iso.endsWith('Z') || iso.includes('+') ? iso : `${iso}Z`;
    return new Date(dateStr).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  };
  const formatDate = (d: string) => {
    return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <Dialog open={!!record} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden border-border gap-0 bg-background">
        <EnterpriseModalHeader
          title="Attendance Details"
          subtitle={formatDate(record.date)}
          icon={Fingerprint}
          intent="normal"
        />

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
          {/* Employee Info - only show if name exists (admin views) */}
          {record.user_name && (
            <FormSection title="Employee Information">
              <FormGrid>
                <div className="flex items-center gap-2 border border-border p-3 rounded-md bg-muted/30">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">{record.user_name}</span>
                </div>
                <div className="flex items-center gap-2 border border-border p-3 rounded-md bg-muted/30">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">{record.user_email}</span>
                </div>
                <div className="flex items-center gap-2 border border-border p-3 rounded-md bg-muted/30">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground capitalize">{record.user_role}</span>
                </div>
              </FormGrid>
            </FormSection>
          )}

          <FormSection title="Timestamps">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Clock In */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm font-medium text-muted-foreground">Clock In:</span>
                  <span className="text-sm font-bold text-foreground">{formatTime(record.clock_in_time)}</span>
                </div>
                {photoLoading ? (
                  <div className="bg-muted rounded-md border border-border h-40 flex items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
                ) : photoUrls.in ? (
                  <img src={photoUrls.in} alt="Clock In" className="w-full rounded-md object-cover max-h-48 border border-border" />
                ) : (
                  <div className="bg-muted rounded-md border border-border h-32 flex items-center justify-center text-sm text-muted-foreground">Photo unavailable</div>
                )}
              </div>

              {/* Clock Out */}
              <div className="space-y-3">
                {record.clock_out_time ? (
                  <>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-amber-500" />
                      <span className="text-sm font-medium text-muted-foreground">Clock Out:</span>
                      <span className="text-sm font-bold text-foreground">{formatTime(record.clock_out_time)}</span>
                      {record.is_auto_clock_out && (
                        <Badge variant="outline" className="ml-1 text-[7px] px-1 py-0 h-4 bg-orange-100 text-orange-600 border-orange-200 uppercase tracking-widest font-black">Auto</Badge>
                      )}
                    </div>
                    {photoLoading ? (
                      <div className="bg-muted rounded-md border border-border h-40 flex items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
                    ) : photoUrls.out ? (
                      <img src={photoUrls.out} alt="Clock Out" className="w-full rounded-md object-cover max-h-48 border border-border" />
                    ) : (
                      <div className="bg-muted rounded-md border border-border h-32 flex items-center justify-center text-sm text-muted-foreground">Photo unavailable</div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground font-medium">Not clocked out yet</span>
                  </div>
                )}
              </div>
            </div>
          </FormSection>

          {/* Summary */}
          <FormSection title="Summary">
            <FormGrid>
              <div className="border border-border rounded-md p-4 bg-muted/30">
                <div className="text-sm font-semibold text-muted-foreground mb-1">Total Hours</div>
                <div className="text-lg font-bold text-foreground">
                  {record.working_hours ? `${record.working_hours}h` : '—'}
                </div>
              </div>
              <div className="border border-border rounded-md p-4 bg-muted/30">
                <div className="text-sm font-semibold text-muted-foreground mb-1">Timesheet</div>
                <div>
                  {record.timesheet_status === 'submitted' 
                    ? <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200">Submitted</Badge>
                    : <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">Pending</Badge>
                  }
                </div>
              </div>
            </FormGrid>
          </FormSection>
        </div>
      </DialogContent>
    </Dialog>
  );
}
