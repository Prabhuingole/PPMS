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
import { AnalyticsLayout } from '@/components/layout/AnalyticsLayout';
import { PageToolbar } from '@/components/layout/PageToolbar';
import { FilterGroup } from '@/components/ui/filter-group';

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
    <AnalyticsLayout
      title="System Activity Logs"
      description="Immutable audit trail of all critical actions and data modifications."
      headerIcon={Shield}
      dataSection={
        <>
          <div className="flex flex-col flex-1 min-h-[500px] mt-6">
            <AuditLogFeed 
              logs={logs} 
              isLoading={loading} 
              searchPlaceholder="Search actions or users..."
              searchValue={searchQuery}
              onSearchChange={setSearchQuery}
              filters={
                <FilterGroup
                  options={[
                    { value: 'all', label: 'All Activity' },
                    { value: 'project', label: 'Projects' },
                    { value: 'employee', label: 'Employees' },
                    { value: 'reporting_manager', label: 'Managers' },
                    { value: 'timesheet', label: 'Timesheets' },
                    { value: 'template', label: 'Templates' },
                    { value: 'note', label: 'To Do Lists' },
                  ]}
                  value={entityType}
                  onChange={setEntityType}
                />
              }
              toolbarActions={
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => fetchLogs()} 
                  className="h-9 w-9 shrink-0 text-muted-foreground border-border hover:bg-muted rounded-md transition-colors"
                  title="Refresh logs"
                >
                  <RefreshCcw className="h-4 w-4" />
                </Button>
              }
              pagination={{
                currentPage: page,
                totalPages: Math.ceil(total / pageSize),
                onPageChange: setPage,
                totalItems: total,
                pageSize: pageSize
              }}
            />
          </div>
        </>
      }
    />
  );
}
