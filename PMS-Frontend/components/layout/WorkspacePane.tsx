import React, { memo } from 'react';
import { cn } from '@/lib/utils';

const widthMap = {
  sm: 'md:w-[200px]',
  md: 'md:w-[240px]',
  lg: 'md:w-[280px]',
} as const;

const backgroundMap = {
  muted: 'bg-white dark:bg-card',           // Section 1: Pure white — "My Projects"
  subtle: 'bg-slate-50 dark:bg-background',       // Section 2: Off-white — "To Do Lists"
  light: 'bg-slate-100/70 dark:bg-muted/30',    // Section 3: Light gray-white — content panel
} as const;

interface WorkspacePaneProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  width?: keyof typeof widthMap;
  background?: keyof typeof backgroundMap;
  className?: string;
}

export const WorkspacePane = memo(function WorkspacePane({
  children,
  header,
  width = 'md',
  background = 'muted',
  className,
}: WorkspacePaneProps) {
  return (
    <div
      className={cn(
        'flex flex-col shrink-0 border-r border-border overflow-hidden w-full h-full',
        widthMap[width],
        backgroundMap[background],
        className
      )}
    >
      {header && (
        <div className="shrink-0 border-b border-border p-4">
          {header}
        </div>
      )}
      <div className="flex-1 overflow-y-auto p-3">
        {children}
      </div>
    </div>
  );
});
