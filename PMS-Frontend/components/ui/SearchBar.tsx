import React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface SearchBarProps extends React.InputHTMLAttributes<HTMLInputElement> {
  containerClassName?: string;
}

export function SearchBar({ containerClassName, className, ...props }: SearchBarProps) {
  return (
    <div className={cn("relative flex-1 w-full group", containerClassName)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
      <Input
        type="text"
        className={cn(
          "pl-9 h-10 bg-muted rounded-lg border-border focus-visible:ring-ring focus-visible:border-indigo-600 focus-visible:bg-card shadow-sm transition-all text-sm",
          className
        )}
        {...props}
      />
    </div>
  );
}
