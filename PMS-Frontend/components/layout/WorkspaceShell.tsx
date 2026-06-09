import React, { memo } from 'react';
import { cn } from '@/lib/utils';

interface WorkspaceShellProps {
  children: React.ReactNode;
  className?: string;
}

export const WorkspaceShell = memo(function WorkspaceShell({ children, className }: WorkspaceShellProps) {
  return (
    <div
      className={cn(
        'flex flex-1 min-h-0 bg-background rounded-xl shadow-sm border border-border overflow-hidden',
        className
      )}
    >
      {children}
    </div>
  );
});
