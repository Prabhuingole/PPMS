'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Sidebar } from '@/components/employee/Sidebar';
import { Navbar } from '@/components/layout/Navbar'; // Reusing Navbar
import { useAuthStore } from '@/store/authStore';
import { Loader2 } from 'lucide-react';

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, _hasHydrated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (_hasHydrated) {
      if (!isAuthenticated || !['employee', 'intern'].includes(user?.role || '')) {
        if (user?.role === 'superadmin') {
           router.replace('/superadmin/dashboard');
        } else {
           router.replace('/login');
        }
      }
    }
  }, [_hasHydrated, isAuthenticated, user, router]);

  if (!_hasHydrated || !isAuthenticated || !['employee', 'intern'].includes(user?.role || '')) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-slate-900" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <Sidebar />
      <div className="flex flex-1 flex-col transition-all duration-300 ml-64">
        <Navbar />
        <main className="flex-1 p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
