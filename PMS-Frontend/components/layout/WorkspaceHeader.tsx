import React, { memo } from 'react';
import { cn } from '@/lib/utils';

interface WorkspaceHeaderProps {
  left?: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
}

export const WorkspaceHeader = memo(function WorkspaceHeader({ left, right, className }: WorkspaceHeaderProps) {
  return (
    <div
      className={cn(
        'h-14 border-b border-border flex items-center justify-between px-6 shrink-0 bg-white/80 backdrop-blur-sm sticky top-0 z-10',
        className
      )}
    >
      {left && <div className="flex items-center gap-3">{left}</div>}
      {right && <div className="flex items-center gap-2">{right}</div>}
    </div>
  );
});
