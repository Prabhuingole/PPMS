import React from 'react';

interface PageToolbarProps {
  search?: React.ReactNode;
  filters?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function PageToolbar({ search, filters, actions, className = '' }: PageToolbarProps) {
  return (
    <div className={`flex flex-col sm:flex-row sm:flex-wrap lg:flex-nowrap gap-4 items-stretch sm:items-center justify-between mb-6 ${className}`}>
      {/* Left: Search */}
      <div className="w-full sm:flex-1 sm:min-w-[260px] lg:max-w-md shrink-0">
        {search}
      </div>

      {/* Center: Filters */}
      {filters && (
        <div className="flex items-center gap-3 w-full sm:w-auto flex-1 justify-start lg:justify-center overflow-x-auto pb-1 sm:pb-0">
          {filters}
        </div>
      )}

      {/* Right: Actions */}
      {actions && (
        <div className="flex items-center gap-3 w-full sm:w-auto shrink-0 justify-start sm:justify-end">
          {actions}
        </div>
      )}
    </div>
  );
}
