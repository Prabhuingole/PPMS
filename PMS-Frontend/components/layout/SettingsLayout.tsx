import React from 'react';
import { PageLayout } from './PageLayout';
import { PageHeader } from './PageHeader';

interface SettingsLayoutProps {
  title: string;
  description?: string;
  headerIcon?: React.ElementType;
  headerActions?: React.ReactNode;
  navigation: React.ReactNode;
  children: React.ReactNode;
}

export function SettingsLayout({
  title,
  description,
  headerIcon,
  headerActions,
  navigation,
  children
}: SettingsLayoutProps) {
  return (
    <PageLayout>
      <PageHeader 
        title={title} 
        description={description} 
        icon={headerIcon} 
        actions={headerActions} 
      />
      
      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="w-full lg:w-64 lg:min-w-[250px] shrink-0">
          {navigation}
        </aside>
        
        <main className="flex-1 w-full max-w-4xl">
          {children}
        </main>
      </div>
    </PageLayout>
  );
}
