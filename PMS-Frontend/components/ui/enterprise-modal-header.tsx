import React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EnterpriseModalHeaderProps {
  title: string;
  subtitle?: string;
  intent?: "normal" | "success" | "warning" | "danger";
  icon: LucideIcon;
  className?: string;
}

const intentMap = {
  normal: "bg-primary/10 text-primary",
  success: "bg-emerald-500/10 text-emerald-500",
  warning: "bg-amber-500/10 text-amber-500",
  danger: "bg-destructive/10 text-destructive",
};

export function EnterpriseModalHeader({
  title,
  subtitle,
  intent = "normal",
  icon: Icon,
  className,
}: EnterpriseModalHeaderProps) {
  return (
    <div className={cn("flex items-start gap-4 p-6 bg-background border-b border-border", className)}>
      <div className={cn("flex items-center justify-center shrink-0 w-10 h-10 rounded-full", intentMap[intent])}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex flex-col gap-1 min-w-0 pr-8">
        <h2 className="text-lg font-semibold text-foreground leading-tight break-all">{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground break-all">{subtitle}</p>}
      </div>
    </div>
  );
}
