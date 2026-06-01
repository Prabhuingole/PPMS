'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Shield, Filter, Search, RefreshCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import { auditLogService, AuditLog } from '@/services/auditLogService';
import { AuditLogFeed } from '@/components/audit/AuditLogFeed';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [entityType, setEntityType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = { 
        page, 
        size: pageSize,
        entity_type: entityType === 'all' ? undefined : entityType 
      };
      
      if (debouncedSearch.trim()) {
        params.search = debouncedSearch.trim();
      }
      
      const data = await auditLogService.getPaginated(params);
      setLogs(data.items || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setLoading(false);
    }
  }, [entityType, debouncedSearch, page, pageSize]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Reset page when entity type changes
  useEffect(() => {
    setPage(1);
  }, [entityType]);

  return (
    <div className="flex-1 space-y-8 p-8 max-w-6xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-lg shadow-indigo-200">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">System Activity Logs</h1>
          </div>
          <p className="text-slate-500 font-medium">
            Immutable audit trail of all critical actions and data modifications.
          </p>
        </div>
        
        <div className="flex items-center gap-3 bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search actions or users..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 w-64 sm:w-72 bg-slate-50 border-transparent focus-visible:bg-slate-100 focus-visible:ring-0 rounded-xl transition-all"
            />
          </div>
          
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => fetchLogs()} 
            className="h-10 w-10 shrink-0 text-slate-500 bg-slate-50 border-transparent hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-colors"
            title="Refresh logs"
          >
            <RefreshCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filter Pills */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { id: 'all', label: 'All Activity' },
          { id: 'project', label: 'Projects' },
          { id: 'employee', label: 'Employees' },
          { id: 'reporting_manager', label: 'Managers' },
          { id: 'timesheet', label: 'Timesheets' },
          { id: 'template', label: 'Templates' },
          { id: 'note', label: 'To Do Lists' },
        ].map((filter) => (
          <button
            key={filter.id}
            onClick={() => setEntityType(filter.id)}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200",
              entityType === filter.id 
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200 ring-2 ring-indigo-600 ring-offset-2" 
                : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-700 shadow-sm"
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Timeline Section */}
      <div className="bg-slate-50/50 rounded-3xl p-6 sm:p-10 border border-slate-100 shadow-sm min-h-[500px] flex flex-col">
        <div className="flex-1">
          <AuditLogFeed logs={logs} isLoading={loading} />
        </div>
        
        {/* Pagination Footer */}
        {total > pageSize && (
          <div className="mt-8 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-slate-500 font-medium bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
              Showing <strong className="text-slate-800">{Math.min((page - 1) * pageSize + 1, total)}</strong> to <strong className="text-slate-800">{Math.min(page * pageSize, total)}</strong> of <strong className="text-slate-800">{total}</strong> records
            </span>
            <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
                className="h-8 px-3 text-xs font-semibold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
              >
                <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                Previous
              </Button>
              <div className="px-3 text-xs font-bold text-slate-800">
                Page {page} of {Math.ceil(total / pageSize)}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPage(p => p + 1)}
                disabled={page >= Math.ceil(total / pageSize) || loading}
                className="h-8 px-3 text-xs font-semibold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
              >
                Next
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
