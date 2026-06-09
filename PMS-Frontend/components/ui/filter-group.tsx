import { cn } from "@/lib/utils"

export interface FilterGroupProps {
  options: { label: string; value: string }[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function FilterGroup({ options, value, onChange, className }: FilterGroupProps) {
  return (
    <div className={cn("flex bg-muted p-1 rounded-lg w-full sm:w-auto overflow-x-auto", className)}>
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "flex-1 sm:flex-none px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-md transition-all whitespace-nowrap",
            value === option.value
              ? "bg-card text-primary shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
