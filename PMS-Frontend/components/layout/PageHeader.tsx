import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: React.ElementType;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, icon: Icon, actions, className = '' }: PageHeaderProps) {
  return (
    <div className={`flex flex-col gap-4 md:flex-row md:items-end md:justify-between bg-background p-6 rounded-xl shadow-sm border border-border mb-8 ${className}`}>
      <div className="flex items-center gap-4">
        {Icon && (
          <div className="inline-flex items-center justify-center p-3 bg-indigo-50 rounded-xl text-primary">
            <Icon className="h-6 w-6" />
          </div>
        )}
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">{title}</h1>
          {description && (
            <p className="text-sm font-medium text-muted-foreground mt-1 max-w-2xl">{description}</p>
          )}
        </div>
      </div>
      
      {actions && (
        <div className="flex flex-wrap items-center gap-3">
          {actions}
        </div>
      )}
    </div>
  );
}
