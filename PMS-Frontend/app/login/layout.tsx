import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login - Chronos',
  description: 'Login to your Chronos account',
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-stone-50">{children}</div>;
}
