'use client';

import React, { useState } from 'react';
import { formatDistanceToNow, parseISO, format } from 'date-fns';
import { 
  Activity, 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  FileEdit, 
  FolderPlus, 
  Trash2, 
  UserCheck, 
  UserPlus, 
  Users,
  UploadCloud,
  Download,
  Send,
  KeyRound,
  UserCircle,
  StickyNote,
  CheckSquare,
  Shield,
  ShieldOff
} from 'lucide-react';
import { AuditLog } from '@/services/auditLogService';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { TableRow, TableCell } from '@/components/ui/table';

interface AuditLogFeedProps {
  logs: AuditLog[];
  isLoading?: boolean;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  filters?: React.ReactNode;
  toolbarActions?: React.ReactNode;
  pagination?: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    pageSize?: number;
    totalItems?: number;
  };
}

const getActionDetails = (log: AuditLog) => {
  const actionLower = log.action.toLowerCase();
  
  if (actionLower === 'note_page_created') {
    return { color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 ring-emerald-500/20', icon: StickyNote, label: 'Note Created' };
  }
  if (actionLower === 'note_page_updated') {
    return { color: 'text-blue-600 dark:text-blue-400 bg-blue-500/10 ring-blue-500/20', icon: StickyNote, label: 'Note Updated' };
  }
  if (actionLower === 'note_page_deleted') {
    return { color: 'text-red-600 dark:text-red-400 bg-red-500/10 ring-red-500/20', icon: Trash2, label: 'Note Deleted' };
  }
  if (actionLower === 'note_task_completed') {
    return { color: 'text-primary bg-primary/10 ring-primary/20', icon: CheckSquare, label: 'Task Done' };
  }

  if (actionLower === 'employee_status_changed') {
    const isActive = log.new_values?.is_active;
    if (isActive === true) {
      return { color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 ring-emerald-500/20', icon: UserCheck, label: 'Activated' };
    } else if (isActive === false) {
      return { color: 'text-rose-600 dark:text-rose-400 bg-rose-500/10 ring-rose-500/20', icon: UserCircle, label: 'Deactivated' };
    }
  }

  if (actionLower === 'mfa_enabled') {
    return { color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 ring-emerald-500/20', icon: Shield, label: 'MFA Enabled' };
  }
  if (actionLower === 'mfa_disabled') {
    return { color: 'text-rose-600 dark:text-rose-400 bg-rose-500/10 ring-rose-500/20', icon: ShieldOff, label: 'MFA Disabled' };
  }

  if (actionLower.includes('create')) {
    return { color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 ring-emerald-500/20', icon: FolderPlus, label: 'Created' };
  }
  if (actionLower.includes('update') || actionLower.includes('change')) {
    return { color: 'text-blue-600 dark:text-blue-400 bg-blue-500/10 ring-blue-500/20', icon: FileEdit, label: 'Updated' };
  }
  if (actionLower.includes('delete')) {
    return { color: 'text-red-600 dark:text-red-400 bg-red-500/10 ring-red-500/20', icon: Trash2, label: 'Deleted' };
  }
  if (actionLower.includes('approve')) {
    return { color: 'text-green-600 dark:text-green-400 bg-green-500/10 ring-green-500/20', icon: UserCheck, label: 'Approved' };
  }
  if (actionLower.includes('upload')) {
    return { color: 'text-purple-600 dark:text-purple-400 bg-purple-500/10 ring-purple-500/20', icon: UploadCloud, label: 'Uploaded' };
  }
  if (actionLower.includes('download')) {
    return { color: 'text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 ring-cyan-500/20', icon: Download, label: 'Downloaded' };
  }
  if (actionLower.includes('view')) {
    return { color: 'text-sky-600 dark:text-sky-400 bg-sky-500/10 ring-sky-500/20', icon: Activity, label: 'Viewed' };
  }
  if (actionLower.includes('submit')) {
    return { color: 'text-primary bg-primary/10 ring-primary/20', icon: Send, label: 'Submitted' };
  }
  if (actionLower.includes('password')) {
    return { color: 'text-orange-600 dark:text-orange-400 bg-orange-500/10 ring-orange-500/20', icon: KeyRound, label: 'Secured' };
  }
  if (actionLower.includes('profile')) {
    return { color: 'text-fuchsia-600 dark:text-fuchsia-400 bg-fuchsia-500/10 ring-fuchsia-500/20', icon: UserCircle, label: 'Updated' };
  }
  
  return { color: 'text-muted-foreground bg-muted ring-border', icon: Activity, label: 'Action' };
};

const DiffViewer = ({ oldValues, newValues }: { oldValues: any, newValues: any }) => {
  // Combine all keys
  const allKeys = Array.from(new Set([...Object.keys(oldValues || {}), ...Object.keys(newValues || {})]));
  
  if (allKeys.length === 0) return <div className="text-sm text-muted-foreground italic p-4">No specific fields modified.</div>;

  return (
    <div className="bg-muted rounded-xl border border-border overflow-hidden divide-y divide-border/50">
      {allKeys.map(key => {
        const oldVal = oldValues?.[key];
        const newVal = newValues?.[key];
        
        // Skip if they are exactly the same
        if (JSON.stringify(oldVal) === JSON.stringify(newVal)) return null;

        const renderValue = (val: any) => {
          if (val === null || val === undefined) return <span className="text-muted-foreground italic">null</span>;
          if (typeof val === 'object') return <pre className="text-xs whitespace-pre-wrap font-mono">{JSON.stringify(val, null, 2)}</pre>;
          if (typeof val === 'boolean') return <span className="font-mono text-xs font-semibold">{val ? 'true' : 'false'}</span>;
          return <span>{String(val)}</span>;
        };

        return (
          <div key={key} className="p-3 sm:px-4 text-sm flex flex-col sm:flex-row sm:items-start gap-2">
            <div className="w-1/4 min-w-[120px] font-semibold text-foreground capitalize">
              {key.replace(/_/g, ' ')}
            </div>
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="bg-red-500/5 text-red-600 dark:text-red-400 p-3 rounded-lg border border-red-500/20 break-words whitespace-pre-wrap text-xs relative max-h-48 overflow-y-auto flex flex-col gap-1.5">
                <span className="bg-red-500/10 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider w-fit">Old</span>
                <div>{renderValue(oldVal)}</div>
              </div>
              <div className="bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 p-3 rounded-lg border border-emerald-500/20 break-words whitespace-pre-wrap text-xs relative max-h-48 overflow-y-auto flex flex-col gap-1.5">
                <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider w-fit">New</span>
                <div>{renderValue(newVal)}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export function AuditLogFeed({ 
  logs, 
  isLoading,
  searchPlaceholder,
  searchValue,
  onSearchChange,
  filters,
  toolbarActions,
  pagination
}: AuditLogFeedProps) {
  const [expandedLogId, setExpandedLogId] = useState<number | null>(null);
  const [now, setNow] = useState(new Date());

  // Real-time ticking for relative dates
  React.useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30000); // refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <DataTable
      data={logs}
      isLoading={isLoading}
      searchPlaceholder={searchPlaceholder}
      searchValue={searchValue}
      onSearchChange={onSearchChange}
      filters={filters}
      toolbarActions={toolbarActions}
      pagination={pagination}
      emptyState={
        <div className="text-center py-16 px-4">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Activity className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">No activity yet</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            Audit logs will automatically appear here when actions are taken in the system.
          </p>
        </div>
      }
      columns={[
        {
          header: 'Timestamp',
          accessorKey: 'timestamp',
          width: '180px',
          cell: (log) => {
            const timeString = log.timestamp.endsWith('Z') ? log.timestamp : `${log.timestamp}Z`;
            return (
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-1.5 text-foreground font-bold">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  {format(parseISO(timeString), 'MMM d, yyyy h:mm a')}
                </div>
                <div className="text-[10px] font-semibold text-muted-foreground pl-5">
                  {formatDistanceToNow(parseISO(timeString), { addSuffix: true })}
                </div>
              </div>
            );
          }
        },
        {
          header: 'User',
          accessorKey: 'user_name',
          cell: (log) => (
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-[9px] font-bold text-primary-foreground shrink-0">
                {(log.user_name || 'System').substring(0, 2).toUpperCase()}
              </div>
              <span className="font-semibold text-foreground text-sm">{log.user_name || 'System'}</span>
            </div>
          )
        },
        {
          header: 'Role',
          cell: (log) => (
            <span className="text-xs font-semibold text-muted-foreground capitalize bg-muted px-2 py-1 rounded-md">
              {log.metadata_info?.user_type ? log.metadata_info.user_type.replace(/_/g, ' ') : (log.user_name ? 'Legacy' : 'System')}
            </span>
          )
        },
        {
          header: 'Action',
          accessorKey: 'action',
          cell: (log) => {
            const { color, icon: Icon, label } = getActionDetails(log);
            return (
              <div className="flex items-center gap-2">
                <div className={cn("flex items-center justify-center w-6 h-6 rounded-full shrink-0 shadow-sm ring-2 ring-white", color)}>
                  <Icon className="h-3 w-3" />
                </div>
                <span className="text-sm font-semibold text-foreground capitalize">{label}</span>
              </div>
            );
          }
        },
        {
          header: 'Target Entity',
          accessorKey: 'entity_type',
          cell: (log) => (
            <div className="text-sm">
              <span className="capitalize text-muted-foreground font-medium">{log.entity_type}</span>
              <span className="mx-2 text-muted-foreground/50">•</span>
              <span className="font-semibold text-foreground">
                {log.metadata_info?.entity_name ? `"${log.metadata_info.entity_name}"` : `#${log.entity_id}`}
              </span>
            </div>
          )
        },
        {
          header: 'Details',
          align: 'right',
          cell: (log) => {
            const isExpanded = expandedLogId === log.id;
            const hasDetails = Boolean(
              (log.old_values && Object.keys(log.old_values).length > 0) || 
              (log.new_values && Object.keys(log.new_values).length > 0) || 
              (log.metadata_info && Object.keys(log.metadata_info).length > 0) || 
              log.ip_address
            );

            return hasDetails ? (
              <Button 
                variant="ghost" 
                size="sm" 
                className={cn(
                  "h-8 px-3 text-xs font-semibold rounded-lg text-muted-foreground transition-colors",
                  isExpanded ? "bg-accent hover:bg-accent" : "hover:bg-muted"
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  setExpandedLogId(isExpanded ? null : log.id);
                }}
              >
                {isExpanded ? 'Hide Details' : 'View Details'}
                {isExpanded ? <ChevronUp className="h-3.5 w-3.5 ml-1.5" /> : <ChevronDown className="h-3.5 w-3.5 ml-1.5" />}
              </Button>
            ) : (
              <span className="text-xs font-medium text-muted-foreground italic pr-3">No details</span>
            );
          }
        }
      ]}
      onRowClick={(log) => {
        const hasDetails = Boolean(
          (log.old_values && Object.keys(log.old_values).length > 0) || 
          (log.new_values && Object.keys(log.new_values).length > 0) || 
          (log.metadata_info && Object.keys(log.metadata_info).length > 0) || 
          log.ip_address
        );
        if (hasDetails) {
          setExpandedLogId(expandedLogId === log.id ? null : log.id);
        }
      }}
      getRowClassName={(log) => {
        const isExpanded = expandedLogId === log.id;
        const hasDetails = Boolean(
          (log.old_values && Object.keys(log.old_values).length > 0) || 
          (log.new_values && Object.keys(log.new_values).length > 0) || 
          (log.metadata_info && Object.keys(log.metadata_info).length > 0) || 
          log.ip_address
        );
        return cn(
          isExpanded && "bg-muted/50",
          hasDetails ? "cursor-pointer" : "cursor-default hover:bg-transparent"
        );
      }}
      renderExpandedRow={(log) => {
        const isExpanded = expandedLogId === log.id;
        const hasDetails = Boolean(
          (log.old_values && Object.keys(log.old_values).length > 0) || 
          (log.new_values && Object.keys(log.new_values).length > 0) || 
          (log.metadata_info && Object.keys(log.metadata_info).length > 0) || 
          log.ip_address
        );

        if (!isExpanded || !hasDetails) return null;

        return (
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            <TableCell colSpan={6} className="p-0 border-b">
              <div className="p-6 animate-in fade-in slide-in-from-top-2 duration-300 bg-muted/50 shadow-inner grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className={cn("flex flex-col", (log.metadata_info || log.ip_address) ? "lg:col-span-2" : "lg:col-span-3")}>
                  <div className="mb-4 text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <FileEdit className="w-4 h-4 text-muted-foreground" />
                    Field Modifications
                  </div>
                  <div className="bg-card rounded-xl shadow-sm border border-border/60 overflow-hidden flex-1">
                    <DiffViewer oldValues={log.old_values} newValues={log.new_values} />
                  </div>
                </div>
                
                {(log.metadata_info || log.ip_address) && (
                  <div className="lg:col-span-1 flex flex-col">
                    <div className="mb-4 text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                      <Activity className="w-4 h-4 text-muted-foreground" />
                      Context & Metadata
                    </div>
                    <div className="bg-card rounded-xl border border-border/60 p-5 space-y-4 shadow-sm flex-1 overflow-y-auto overflow-x-hidden max-h-[400px]">
                      {log.ip_address && (
                        <div>
                          <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">IP Address</span>
                          <span className="text-sm font-medium text-foreground font-mono">{log.ip_address}</span>
                        </div>
                      )}
                      {log.metadata_info && Object.entries(log.metadata_info).map(([key, val]) => {
                        if (key === 'entity_name' || key === 'user_type') return null;
                        return (
                          <div key={key}>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">{key.replace(/_/g, ' ')}</span>
                            <div className="text-sm font-medium text-foreground break-all whitespace-pre-wrap">
                              {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </TableCell>
          </TableRow>
        );
      }}
    />
  );
}
