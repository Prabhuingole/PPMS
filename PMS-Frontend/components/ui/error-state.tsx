import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Failed to load data",
  description = "An error occurred while fetching the data. Please try again later.",
  onRetry,
  className
}: ErrorStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center w-full py-12 px-4 text-center", className)}>
      <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-rose-50 mb-4 border border-rose-100 shadow-sm">
        <AlertCircle className="h-8 w-8 text-rose-500" />
      </div>
      <h3 className="text-lg font-bold text-foreground tracking-tight">{title}</h3>
      <p className="text-sm font-medium text-muted-foreground mt-2 max-w-md">
        {description}
      </p>
      {onRetry && (
        <Button 
          variant="outline" 
          onClick={onRetry} 
          className="mt-6 border-border text-muted-foreground hover:bg-muted"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      )}
    </div>
  );
}
