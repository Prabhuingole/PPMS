'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Sidebar } from '@/components/employee/Sidebar';
import { Navbar } from '@/components/layout/Navbar'; // Reusing Navbar
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, _hasHydrated } = useAuthStore();
  const { sidebarCollapsed } = useUIStore();
  const router = useRouter();
  const pathname = usePathname();
  const isViewDoc = pathname.includes('/view-doc');

  useEffect(() => {
    if (_hasHydrated && !isViewDoc) {
      if (!isAuthenticated || !['employee', 'intern', 'reporting_manager'].includes(user?.role || '')) {
        if (user?.role === 'superadmin') {
           router.replace('/superadmin/dashboard');
        } else {
           router.replace('/login');
        }
      }
    }
  }, [_hasHydrated, isAuthenticated, user, router, isViewDoc]);

  if (!_hasHydrated || (!isViewDoc && (!isAuthenticated || !['employee', 'intern', 'reporting_manager'].includes(user?.role || '')))) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-muted/30" suppressHydrationWarning>
        <Loader2 className="h-8 w-8 animate-spin text-foreground" />
      </div>
    );
  }

  if (isViewDoc) {
    return (
      <div className="flex min-h-screen bg-slate-950 text-slate-200" suppressHydrationWarning>
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-muted/30 text-foreground" suppressHydrationWarning>
      <Sidebar />
      <div className={cn(
        "flex flex-1 flex-col transition-all duration-300 min-w-0",
        sidebarCollapsed ? "md:ml-20" : "md:ml-64"
      )}>
        <Navbar />
        <main className="flex-1 p-4 md:p-8 overflow-x-hidden overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
