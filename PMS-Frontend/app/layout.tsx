import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';
import { cn } from '@/lib/utils';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'Sambhav PMS',
  description: 'Enterprise Project Management System',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn("font-sans antialiased", inter.variable)}>
      <body suppressHydrationWarning className="bg-slate-50 text-slate-900">
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
