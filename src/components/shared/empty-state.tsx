import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/60 px-6 py-14 text-center",
        className,
      )}
    >
      <div className="relative mb-4">
        <div className="absolute inset-0 scale-150 rounded-full bg-teal-500/5 blur-xl" />
        <div className="relative flex size-12 items-center justify-center rounded-xl border border-border bg-card shadow-subtle">
          <Icon className="size-5 text-muted-foreground" aria-hidden="true" />
        </div>
      </div>
      <h3 className="text-[14.5px] font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-[12.5px] leading-relaxed text-muted-foreground">
        {description}
      </p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
