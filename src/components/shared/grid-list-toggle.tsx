import { LayoutGrid, List } from "lucide-react";
import { cn } from "@/lib/utils";

interface GridListToggleProps {
  value: "grid" | "list";
  onChange: (value: "grid" | "list") => void;
  className?: string;
}

export function GridListToggle({ value, onChange, className }: GridListToggleProps) {
  return (
    <div
      role="group"
      aria-label="Layout"
      className={cn(
        "inline-flex items-center gap-0.5 rounded-lg border border-border bg-card p-0.5 shadow-subtle",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => onChange("grid")}
        aria-pressed={value === "grid"}
        aria-label="Grid view"
        className={cn(
          "flex size-7 items-center justify-center rounded-md transition-colors",
          value === "grid"
            ? "bg-muted text-foreground"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <LayoutGrid className="size-3.5" />
      </button>
      <button
        type="button"
        onClick={() => onChange("list")}
        aria-pressed={value === "list"}
        aria-label="List view"
        className={cn(
          "flex size-7 items-center justify-center rounded-md transition-colors",
          value === "list"
            ? "bg-muted text-foreground"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <List className="size-3.5" />
      </button>
    </div>
  );
}
