import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login - SPMS',
  description: 'Login to your SPMS account',
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <div suppressHydrationWarning className="min-h-screen bg-stone-50 dark:bg-background">{children}</div>;
}
