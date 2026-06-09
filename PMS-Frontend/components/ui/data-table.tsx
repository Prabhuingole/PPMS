import React, { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { DataTableToolbar } from './data-table-toolbar';
import { DataTablePagination } from './data-table-pagination';
import { DataTableSkeleton } from './data-table-skeleton';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';

export interface ColumnDef<T> {
  header: string;
  accessorKey?: keyof T | string;
  cell?: (item: T) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  width?: string;
  sortable?: boolean;
  hideOnMobile?: boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  isLoading?: boolean;
  
  // Empty State
  emptyState?: React.ReactNode;

  // Search & Toolbar
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  filters?: React.ReactNode;
  toolbarActions?: React.ReactNode;

  // Pagination
  pagination?: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    pageSize?: number;
    onPageSizeChange?: (pageSize: number) => void;
    totalItems?: number;
  };

  // Row Interactions
  onRowClick?: (item: T) => void;
  getRowClassName?: (item: T) => string;
  
  // Expandable Rows
  renderExpandedRow?: (item: T) => React.ReactNode;
}

export function DataTable<T>({
  data,
  columns,
  isLoading,
  emptyState,
  searchPlaceholder,
  searchValue,
  onSearchChange,
  filters,
  toolbarActions,
  pagination,
  onRowClick,
  getRowClassName,
  renderExpandedRow
}: DataTableProps<T>) {
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  const handleSort = (column: ColumnDef<T>) => {
    if (!column.sortable || !column.accessorKey) return;
    const key = String(column.accessorKey);
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedData = useMemo(() => {
    if (!sortConfig || !data) return data;
    
    return [...data].sort((a: any, b: any) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (aValue === bValue) return 0;
      
      const aString = String(aValue || '').toLowerCase();
      const bString = String(bValue || '').toLowerCase();
      
      if (sortConfig.direction === 'asc') {
        return aString > bString ? 1 : -1;
      }
      return aString < bString ? 1 : -1;
    });
  }, [data, sortConfig]);

  const hasToolbar = onSearchChange || filters || toolbarActions;

  return (
    <Card className="border border-border rounded-xl shadow-sm overflow-hidden bg-card">
      {hasToolbar && (
        <DataTableToolbar
          searchPlaceholder={searchPlaceholder}
          searchValue={searchValue}
          onSearchChange={onSearchChange}
          filters={filters}
          actions={toolbarActions}
        />
      )}
      
      <div className="overflow-x-auto">
        {isLoading ? (
          <DataTableSkeleton columns={columns.length} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((col, i) => (
                  <TableHead 
                    key={i} 
                    style={{ width: col.width }}
                    className={cn(
                      col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left',
                      col.hideOnMobile && "hidden md:table-cell",
                      col.sortable && "cursor-pointer select-none hover:text-muted-foreground transition-colors"
                    )}
                    onClick={() => handleSort(col)}
                  >
                    <div className={cn(
                      "flex items-center gap-1",
                      col.align === 'right' ? 'justify-end' : col.align === 'center' ? 'justify-center' : 'justify-start'
                    )}>
                      {col.header}
                      {col.sortable && (
                        <span className="text-muted-foreground/50">
                          {sortConfig?.key === String(col.accessorKey) ? (
                            sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3 text-primary" /> : <ArrowDown className="h-3 w-3 text-primary" />
                          ) : (
                            <ArrowUpDown className="h-3 w-3" />
                          )}
                        </span>
                      )}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="p-0">
                    {emptyState}
                  </TableCell>
                </TableRow>
              ) : (
                sortedData.map((item, rowIndex) => (
                  <React.Fragment key={rowIndex}>
                    <TableRow 
                      onClick={() => onRowClick?.(item)}
                      className={cn(
                        onRowClick && "cursor-pointer",
                        getRowClassName?.(item)
                      )}
                    >
                      {columns.map((col, colIndex) => (
                        <TableCell 
                          key={colIndex}
                          className={cn(
                            col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left',
                            col.hideOnMobile && "hidden md:table-cell"
                          )}
                        >
                          {col.cell ? col.cell(item) : (col.accessorKey ? String((item as any)[col.accessorKey] ?? '') : '')}
                        </TableCell>
                      ))}
                    </TableRow>
                    {renderExpandedRow && renderExpandedRow(item)}
                  </React.Fragment>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {pagination && !isLoading && (
        <DataTablePagination {...pagination} />
      )}
    </Card>
  );
}
