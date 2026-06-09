import { Search, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';

interface DataTableToolbarProps {
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  filters?: React.ReactNode;
  actions?: React.ReactNode;
}

export function DataTableToolbar({
  searchPlaceholder = 'Search...',
  searchValue,
  onSearchChange,
  filters,
  actions
}: DataTableToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border-b border-border bg-card">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {onSearchChange && (
          <div className="relative w-full sm:w-72 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 h-10 bg-card rounded-lg border-border shadow-sm font-medium text-sm w-full focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
        )}
        
        {filters && (
          <>
            {/* Desktop Filters */}
            <div className="hidden sm:flex flex-wrap items-center gap-3 pb-0">
              {filters}
            </div>

            {/* Mobile Filters */}
            <div className="sm:hidden shrink-0">
              <Sheet>
                <SheetTrigger render={<Button variant="outline" size="icon" className="h-10 w-10 border-border shadow-sm shrink-0" />}>
                  <Filter className="h-4 w-4 text-muted-foreground" />
                </SheetTrigger>
                <SheetContent side="bottom" className="rounded-t-2xl px-6 py-6 border-t border-border">
                  <SheetHeader className="mb-6 flex flex-row items-center justify-between">
                    <SheetTitle className="text-left text-base font-black text-foreground uppercase tracking-widest">Filters</SheetTitle>
                  </SheetHeader>
                  <div className="flex flex-col gap-4">
                    {filters}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
          {actions}
        </div>
      )}
    </div>
  );
}
