import React, { memo } from 'react';
import { cn } from '@/lib/utils';

interface WorkspaceContentProps {
  children: React.ReactNode;
  className?: string;
}

export const WorkspaceContent = memo(function WorkspaceContent({ children, className }: WorkspaceContentProps) {
  return (
    <div className={cn('flex-1 overflow-y-auto', className)}>
      {children}
    </div>
  );
});
