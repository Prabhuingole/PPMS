import React from 'react';
import { PageLayout } from './PageLayout';
import { PageHeader } from './PageHeader';

interface ManagementLayoutProps {
  title: string;
  description?: string;
  headerIcon?: React.ElementType;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
}

export function ManagementLayout({
  title,
  description,
  headerIcon,
  headerActions,
  children
}: ManagementLayoutProps) {
  return (
    <PageLayout>
      <PageHeader 
        title={title} 
        description={description} 
        icon={headerIcon} 
        actions={headerActions} 
      />
      
      <div className="mt-6 flex-1 flex flex-col">
        {children}
      </div>
    </PageLayout>
  );
}
