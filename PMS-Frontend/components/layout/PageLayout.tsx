import React from 'react';

interface PageLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function PageLayout({ children, className = '' }: PageLayoutProps) {
  return (
    <div className={`max-w-[1440px] mx-auto w-full px-4 md:px-6 lg:px-8 pb-6 pt-4 md:pt-6 ${className}`}>
      {children}
    </div>
  );
}
