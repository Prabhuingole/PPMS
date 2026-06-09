import React from 'react';
import { PageLayout } from './PageLayout';
import { PageHeader } from './PageHeader';
import { PageToolbar } from './PageToolbar';

interface ContentGridLayoutProps {
  title: string;
  description?: string;
  headerIcon?: React.ElementType;
  headerActions?: React.ReactNode;
  search?: React.ReactNode;
  filters?: React.ReactNode;
  toolbarActions?: React.ReactNode;
  children: React.ReactNode;
}

export function ContentGridLayout({
  title,
  description,
  headerIcon,
  headerActions,
  search,
  filters,
  toolbarActions,
  children
}: ContentGridLayoutProps) {
  return (
    <PageLayout>
      <PageHeader 
        title={title} 
        description={description} 
        icon={headerIcon} 
        actions={headerActions} 
      />
      
      {(search || filters || toolbarActions) && (
        <PageToolbar 
          search={search} 
          filters={filters} 
          actions={toolbarActions} 
        />
      )}
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {children}
      </div>
    </PageLayout>
  );
}
