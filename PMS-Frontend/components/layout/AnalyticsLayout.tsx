import React from 'react';
import { PageLayout } from './PageLayout';
import { PageHeader } from './PageHeader';

interface AnalyticsLayoutProps {
  title: string;
  description?: string;
  headerIcon?: React.ElementType;
  headerActions?: React.ReactNode;
  kpiSection?: React.ReactNode;
  chartsSection?: React.ReactNode;
  dataSection?: React.ReactNode;
}

export function AnalyticsLayout({
  title,
  description,
  headerIcon,
  headerActions,
  kpiSection,
  chartsSection,
  dataSection
}: AnalyticsLayoutProps) {
  return (
    <PageLayout>
      <PageHeader 
        title={title} 
        description={description} 
        icon={headerIcon} 
        actions={headerActions} 
      />
      
      <div className="space-y-6">
        {kpiSection && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {kpiSection}
          </div>
        )}
        
        {chartsSection && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {chartsSection}
          </div>
        )}
        
        {dataSection && (
          <div className="w-full">
            {dataSection}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
