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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface AuditLogFeedProps {
  logs: AuditLog[];
  isLoading?: boolean;
}

const getActionDetails = (log: AuditLog) => {
  const actionLower = log.action.toLowerCase();
  
  if (actionLower === 'note_page_created') {
    return { color: 'text-emerald-600 bg-emerald-50 ring-emerald-200', icon: StickyNote, label: 'Note Created' };
  }
  if (actionLower === 'note_page_updated') {
    return { color: 'text-blue-600 bg-blue-50 ring-blue-200', icon: StickyNote, label: 'Note Updated' };
  }
  if (actionLower === 'note_page_deleted') {
    return { color: 'text-red-600 bg-red-50 ring-red-200', icon: Trash2, label: 'Note Deleted' };
  }
  if (actionLower === 'note_task_completed') {
    return { color: 'text-indigo-600 bg-indigo-50 ring-indigo-200', icon: CheckSquare, label: 'Task Done' };
  }

  if (actionLower === 'employee_status_changed') {
    const isActive = log.new_values?.is_active;
    if (isActive === true) {
      return { color: 'text-emerald-600 bg-emerald-50 ring-emerald-200', icon: UserCheck, label: 'Activated' };
    } else if (isActive === false) {
      return { color: 'text-rose-600 bg-rose-50 ring-rose-200', icon: UserCircle, label: 'Deactivated' };
    }
  }

  if (actionLower === 'mfa_enabled') {
    return { color: 'text-emerald-600 bg-emerald-50 ring-emerald-200', icon: Shield, label: 'MFA Enabled' };
  }
  if (actionLower === 'mfa_disabled') {
    return { color: 'text-rose-600 bg-rose-50 ring-rose-200', icon: ShieldOff, label: 'MFA Disabled' };
  }

  if (actionLower.includes('create')) {
    return { color: 'text-emerald-600 bg-emerald-50 ring-emerald-200', icon: FolderPlus, label: 'Created' };
  }
  if (actionLower.includes('update') || actionLower.includes('change')) {
    return { color: 'text-blue-600 bg-blue-50 ring-blue-200', icon: FileEdit, label: 'Updated' };
  }
  if (actionLower.includes('delete')) {
    return { color: 'text-red-600 bg-red-50 ring-red-200', icon: Trash2, label: 'Deleted' };
  }
  if (actionLower.includes('approve')) {
    return { color: 'text-green-600 bg-green-50 ring-green-200', icon: UserCheck, label: 'Approved' };
  }
  if (actionLower.includes('upload')) {
    return { color: 'text-purple-600 bg-purple-50 ring-purple-200', icon: UploadCloud, label: 'Uploaded' };
  }
  if (actionLower.includes('download')) {
    return { color: 'text-cyan-600 bg-cyan-50 ring-cyan-200', icon: Download, label: 'Downloaded' };
  }
  if (actionLower.includes('view')) {
    return { color: 'text-sky-600 bg-sky-50 ring-sky-200', icon: Activity, label: 'Viewed' };
  }
  if (actionLower.includes('submit')) {
    return { color: 'text-indigo-600 bg-indigo-50 ring-indigo-200', icon: Send, label: 'Submitted' };
  }
  if (actionLower.includes('password')) {
    return { color: 'text-orange-600 bg-orange-50 ring-orange-200', icon: KeyRound, label: 'Secured' };
  }
  if (actionLower.includes('profile')) {
    return { color: 'text-fuchsia-600 bg-fuchsia-50 ring-fuchsia-200', icon: UserCircle, label: 'Updated' };
  }
  
  return { color: 'text-slate-600 bg-slate-50 ring-slate-200', icon: Activity, label: 'Action' };
};

const DiffViewer = ({ oldValues, newValues }: { oldValues: any, newValues: any }) => {
  // Combine all keys
  const allKeys = Array.from(new Set([...Object.keys(oldValues || {}), ...Object.keys(newValues || {})]));
  
  if (allKeys.length === 0) return <div className="text-sm text-slate-500 italic p-4">No specific fields modified.</div>;

  return (
    <div className="bg-slate-50 rounded-xl border border-slate-100 overflow-hidden divide-y divide-slate-100">
      {allKeys.map(key => {
        const oldVal = oldValues?.[key];
        const newVal = newValues?.[key];
        
        // Skip if they are exactly the same
        if (JSON.stringify(oldVal) === JSON.stringify(newVal)) return null;

        const renderValue = (val: any) => {
          if (val === null || val === undefined) return <span className="text-slate-400 italic">null</span>;
          if (typeof val === 'object') return <pre className="text-xs whitespace-pre-wrap font-mono">{JSON.stringify(val, null, 2)}</pre>;
          if (typeof val === 'boolean') return <span className="font-mono text-xs font-semibold">{val ? 'true' : 'false'}</span>;
          return <span>{String(val)}</span>;
        };

        return (
          <div key={key} className="p-3 sm:px-4 text-sm flex flex-col sm:flex-row sm:items-start gap-2">
            <div className="w-1/4 min-w-[120px] font-semibold text-slate-700 capitalize">
              {key.replace(/_/g, ' ')}
            </div>
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="bg-red-50/50 text-red-700 p-3 rounded-lg border border-red-100/50 break-words whitespace-pre-wrap text-xs relative max-h-48 overflow-y-auto flex flex-col gap-1.5">
                <span className="bg-red-100 text-red-600 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider w-fit">Old</span>
                <div>{renderValue(oldVal)}</div>
              </div>
              <div className="bg-emerald-50/50 text-emerald-700 p-3 rounded-lg border border-emerald-100/50 break-words whitespace-pre-wrap text-xs relative max-h-48 overflow-y-auto flex flex-col gap-1.5">
                <span className="bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider w-fit">New</span>
                <div>{renderValue(newVal)}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export function AuditLogFeed({ logs, isLoading }: AuditLogFeedProps) {
  const [expandedLogId, setExpandedLogId] = useState<number | null>(null);
  const [now, setNow] = useState(new Date());

  // Real-time ticking for relative dates
  React.useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30000); // refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-slate-200 shrink-0" />
            <div className="flex-1 space-y-3 py-1">
              <div className="h-4 bg-slate-200 rounded w-1/3" />
              <div className="h-3 bg-slate-100 rounded w-1/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-16 px-4">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Activity className="h-8 w-8 text-slate-300" />
        </div>
        <h3 className="text-lg font-semibold text-slate-800">No activity yet</h3>
        <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
          Audit logs will automatically appear here when actions are taken in the system.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <Table>
        <TableHeader className="bg-slate-50/80">
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[180px] font-semibold text-slate-700">Timestamp</TableHead>
            <TableHead className="font-semibold text-slate-700">User</TableHead>
            <TableHead className="font-semibold text-slate-700">Role</TableHead>
            <TableHead className="font-semibold text-slate-700">Action</TableHead>
            <TableHead className="font-semibold text-slate-700">Target Entity</TableHead>
            <TableHead className="text-right font-semibold text-slate-700">Details</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => {
            const { color, icon: Icon, label } = getActionDetails(log);
            const isExpanded = expandedLogId === log.id;
            const hasDetails = Boolean(
              (log.old_values && Object.keys(log.old_values).length > 0) || 
              (log.new_values && Object.keys(log.new_values).length > 0) || 
              (log.metadata_info && Object.keys(log.metadata_info).length > 0) || 
              log.ip_address
            );
            
            // Append Z if missing to force UTC parsing
            const timeString = log.timestamp.endsWith('Z') ? log.timestamp : `${log.timestamp}Z`;

            return (
              <React.Fragment key={log.id}>
                <TableRow 
                  className={cn(
                    "group hover:bg-slate-50/50 transition-colors", 
                    isExpanded && "bg-slate-50/50",
                    hasDetails ? "cursor-pointer" : "cursor-default"
                  )}
                  onClick={() => hasDetails && setExpandedLogId(isExpanded ? null : log.id)}
                >
                  <TableCell className="text-slate-500 text-xs font-medium whitespace-nowrap">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1.5 text-slate-700 font-bold">
                        <Clock className="w-3.5 h-3.5 text-indigo-400" />
                        {format(parseISO(timeString), 'MMM d, yyyy h:mm a')}
                      </div>
                      <div className="text-[10px] font-semibold text-slate-400 pl-5">
                        {formatDistanceToNow(parseISO(timeString), { addSuffix: true })}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[9px] font-bold text-white shrink-0">
                        {(log.user_name || 'System').substring(0, 2).toUpperCase()}
                      </div>
                      <span className="font-semibold text-slate-900 text-sm">{log.user_name || 'System'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs font-semibold text-slate-600 capitalize bg-slate-100 px-2 py-1 rounded-md">
                      {log.metadata_info?.user_type ? log.metadata_info.user_type.replace(/_/g, ' ') : (log.user_name ? 'Legacy' : 'System')}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className={cn("flex items-center justify-center w-6 h-6 rounded-full shrink-0 shadow-sm ring-2 ring-white", color)}>
                        <Icon className="h-3 w-3" />
                      </div>
                      <span className="text-sm font-semibold text-slate-700 capitalize">{label}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <span className="capitalize text-slate-500 font-medium">{log.entity_type}</span>
                      <span className="mx-2 text-slate-300">•</span>
                      <span className="font-semibold text-slate-800">
                        {log.metadata_info?.entity_name ? `"${log.metadata_info.entity_name}"` : `#${log.entity_id}`}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {hasDetails ? (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className={cn(
                          "h-8 px-3 text-xs font-semibold rounded-lg text-slate-600 transition-colors",
                          isExpanded ? "bg-slate-200 hover:bg-slate-200" : "hover:bg-slate-100"
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
                      <span className="text-xs font-medium text-slate-400 italic pr-3">No details</span>
                    )}
                  </TableCell>
                </TableRow>
                {isExpanded && hasDetails && (
                  <TableRow className="bg-slate-50/30 hover:bg-slate-50/30">
                    <TableCell colSpan={6} className="p-0 border-b">
                      <div className="p-6 animate-in fade-in slide-in-from-top-2 duration-300 bg-slate-50/50 shadow-inner grid grid-cols-1 lg:grid-cols-3 gap-8">
                        
                        <div className={cn("flex flex-col", (log.metadata_info || log.ip_address) ? "lg:col-span-2" : "lg:col-span-3")}>
                          <div className="mb-4 text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <FileEdit className="w-4 h-4 text-slate-400" />
                            Field Modifications
                          </div>
                          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden flex-1">
                            <DiffViewer oldValues={log.old_values} newValues={log.new_values} />
                          </div>
                        </div>
                        
                        {(log.metadata_info || log.ip_address) && (
                          <div className="lg:col-span-1 flex flex-col">
                            <div className="mb-4 text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                              <Activity className="w-4 h-4 text-slate-400" />
                              Context & Metadata
                            </div>
                            <div className="bg-white rounded-2xl border border-slate-200/60 p-5 space-y-4 shadow-sm flex-1 overflow-y-auto overflow-x-hidden max-h-[400px]">
                              {log.ip_address && (
                                <div>
                                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">IP Address</span>
                                  <span className="text-sm font-medium text-slate-800 font-mono">{log.ip_address}</span>
                                </div>
                              )}
                              {log.metadata_info && Object.entries(log.metadata_info).map(([key, val]) => {
                                // Skip redundant entity name and user type since we show them in the main table row
                                if (key === 'entity_name' || key === 'user_type') return null;
                                return (
                                  <div key={key}>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">{key.replace(/_/g, ' ')}</span>
                                    <div className="text-sm font-medium text-slate-800 break-all whitespace-pre-wrap">
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
                )}
              </React.Fragment>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
