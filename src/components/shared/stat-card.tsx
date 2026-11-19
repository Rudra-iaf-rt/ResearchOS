import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  hint?: string;
  trend?: { value: string; direction: "up" | "down"; positive?: boolean };
  accent?: "teal" | "indigo" | "amber" | "navy";
  className?: string;
}

const accentStyles = {
  teal: "bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300",
  indigo: "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300",
  amber: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
  navy: "bg-navy-50 text-navy-700 dark:bg-navy-800 dark:text-slate-300",
};

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  trend,
  accent = "teal",
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-subtle transition-all duration-200 hover:border-navy-200 hover:shadow-raised dark:hover:border-navy-600",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[12px] font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 text-[28px] font-semibold leading-none tracking-[-0.03em] tabular-nums">
            {value}
          </p>
        </div>
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-105",
            accentStyles[accent],
          )}
        >
          <Icon className="size-[18px]" aria-hidden="true" />
        </span>
      </div>
      <div className="mt-3 flex items-center gap-2">
        {trend && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-[11.5px] font-medium",
              trend.positive ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400",
            )}
          >
            {trend.direction === "up" ? (
              <ArrowUpRight className="size-3.5" />
            ) : (
              <ArrowDownRight className="size-3.5" />
            )}
            {trend.value}
          </span>
        )}
        {hint && <span className="truncate text-[11.5px] text-muted-foreground">{hint}</span>}
      </div>
    </div>
  );
}
