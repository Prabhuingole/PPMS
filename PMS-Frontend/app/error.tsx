'use client';

import { useEffect } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application Error:', error);
  }, [error]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-muted p-4 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-rose-50 mb-6 border border-rose-100 shadow-sm">
        <AlertCircle className="h-10 w-10 text-rose-500" />
      </div>
      <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground mb-2">
        Something went wrong!
      </h1>
      <p className="text-muted-foreground font-medium mb-8 max-w-md">
        An unexpected error occurred while rendering this page. We've logged the issue and are looking into it.
      </p>
      
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
        <Button 
          onClick={() => reset()}
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 px-6 rounded-xl shadow-xl shadow-blue-200"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
        <Link href="/" className="w-full sm:w-auto">
          <Button 
            variant="outline" 
            className="w-full sm:w-auto h-12 px-6 font-bold text-foreground border-border hover:bg-muted rounded-xl"
          >
            <Home className="mr-2 h-4 w-4" />
            Go Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
