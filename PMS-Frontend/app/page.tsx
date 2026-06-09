'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Loader2 } from 'lucide-react';

export default function RootPage() {
  const { isAuthenticated, user, _hasHydrated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (_hasHydrated) {
      if (isAuthenticated) {
        if (user?.role === 'superadmin') {
          router.push('/superadmin/dashboard');
        } else if (['employee', 'intern'].includes(user?.role || '')) {
          router.push('/employee/dashboard');
        } else {
          router.push('/login');
        }
      } else {
        router.push('/login');
      }
    }
  }, [_hasHydrated, isAuthenticated, user, router]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-muted/30">
      <Loader2 className="h-8 w-8 animate-spin text-foreground" />
    </div>
  );
}
