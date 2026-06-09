import React from "react";
import { cn } from "@/lib/utils";

interface EnterpriseModalFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function EnterpriseModalFooter({ children, className }: EnterpriseModalFooterProps) {
  return (
    <div className={cn("flex items-center justify-end gap-3 p-4 sm:p-6 bg-muted/50 border-t border-border", className)}>
      {children}
    </div>
  );
}
