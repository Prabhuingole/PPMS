import React, { memo, useState } from 'react';
import { cn } from '@/lib/utils';
import { WorkspaceShell } from './WorkspaceShell';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WorkspaceLayoutProps {
  primarySidebar?: React.ReactNode;
  secondarySidebar?: React.ReactNode;
  mobileSidebar?: React.ReactNode;
  mobileMenuOpen?: boolean;
  onMobileMenuOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
}

export const WorkspaceLayout = memo(function WorkspaceLayout({
  primarySidebar,
  secondarySidebar,
  mobileSidebar,
  mobileMenuOpen,
  onMobileMenuOpenChange,
  children,
  className,
}: WorkspaceLayoutProps) {
  // If not controlled, use internal state
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = mobileMenuOpen !== undefined ? mobileMenuOpen : internalOpen;
  const setIsOpen = onMobileMenuOpenChange || setInternalOpen;

  return (
    <div className={cn('flex flex-col flex-1 min-h-0 bg-muted/30 px-0 md:px-6 lg:px-8 pb-0 md:pb-6 pt-0 md:pt-6', className)}>
      <WorkspaceShell>
        {/* Desktop / Tablet Sidebars */}
        <div className="hidden md:flex flex-row shrink-0 h-full">
          {primarySidebar && <div className="hidden lg:flex h-full">{primarySidebar}</div>}
          {secondarySidebar && <div className="flex h-full">{secondarySidebar}</div>}
        </div>

        {/* Mobile Sidebar via Sheet & Main Content */}
        <div className="flex-1 flex flex-col min-w-0 bg-background relative h-full overflow-hidden">
          {mobileSidebar && (
            <div className="md:hidden absolute top-3 left-3 z-50">
              <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger render={<Button variant="outline" size="icon" className="h-9 w-9 bg-background shadow-sm border-border" />}>
                  <Menu className="h-5 w-5 text-muted-foreground" />
                </SheetTrigger>
                <SheetContent side="left" className="w-[85vw] max-w-[320px] p-0 flex flex-col">
                  {mobileSidebar}
                </SheetContent>
              </Sheet>
            </div>
          )}
          {children}
        </div>
      </WorkspaceShell>
    </div>
  );
});
