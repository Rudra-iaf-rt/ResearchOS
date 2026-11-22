import { useMemo, useRef } from "react";
import { Filter, RotateCcw, Search } from "lucide-react";
import type { GraphNodeType } from "@/types";
import { graphNodeTypeMeta, graphNodeTypes } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

interface GraphFiltersProps {
  selectedTypes: GraphNodeType[];
  onToggleType: (type: GraphNodeType) => void;
  statuses: string[];
  selectedStatuses: string[];
  onToggleStatus: (status: string) => void;
  showRuns: boolean;
  onShowRunsChange: (value: boolean) => void;
  search?: string;
  onSearchChange?: (value: string) => void;
  onClear?: () => void;
  className?: string;
}

export function GraphFilters({
  selectedTypes,
  onToggleType,
  statuses,
  selectedStatuses,
  onToggleStatus,
  showRuns,
  onShowRunsChange,
  search,
  onSearchChange,
  onClear,
  className,
}: GraphFiltersProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const activeCount = useMemo(() => {
    let count = 0;
    if (selectedTypes.length !== graphNodeTypes.length) count += 1;
    if (selectedStatuses.length > 0) count += 1;
    if (!showRuns) count += 1;
    if (search?.trim()) count += 1;
    return count;
  }, [selectedTypes, selectedStatuses, showRuns, search]);

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      {onSearchChange && (
        <div className="relative">
          <Search className="pointer-events-none absolute left-2 top-1/2 size-3 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search ?? ""}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Find a node…"
            aria-label="Search graph nodes"
            className="h-8 w-40 bg-card/95 pl-7 text-[11.5px] backdrop-blur"
          />
        </div>
      )}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            ref={triggerRef}
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 bg-card/95 text-[11.5px] backdrop-blur"
            aria-label={`Graph filters${activeCount > 0 ? `, ${activeCount} active` : ""}`}
          >
            <Filter className="size-3.5" />
            Filters
            {activeCount > 0 && (
              <span className="rounded-full bg-teal-600 px-1.5 text-[9px] font-semibold text-white">
                {activeCount}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          className="w-72 p-3"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            // Overlay focus scopes can lose the trigger while another dialog is
            // open; return focus explicitly when the menu closes.
            window.setTimeout(() => triggerRef.current?.focus(), 0);
          }}
        >
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              Node types
            </p>
            {onClear && (
              <button
                type="button"
                onClick={onClear}
                className="flex items-center gap-1 text-[10.5px] font-medium text-teal-700 hover:underline dark:text-teal-300"
              >
                <RotateCcw className="size-3" /> Reset
              </button>
            )}
          </div>
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            {graphNodeTypes.map((type) => {
              const active = selectedTypes.includes(type);
              return (
                <label
                  key={type}
                  className="flex cursor-pointer items-center gap-1.5 rounded-md px-1 py-1 text-[11.5px] hover:bg-muted"
                >
                  <Checkbox
                    checked={active}
                    onCheckedChange={() => onToggleType(type)}
                    aria-label={`Show ${graphNodeTypeMeta[type].plural}`}
                  />
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: graphNodeTypeMeta[type].color }}
                    aria-hidden="true"
                  />
                  {graphNodeTypeMeta[type].plural}
                </label>
              );
            })}
          </div>

          {statuses.length > 0 && (
            <>
              <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                Status
              </p>
              <div className="mt-1 flex flex-wrap gap-1">
                {statuses.map((status) => {
                  const active = selectedStatuses.includes(status);
                  return (
                    <button
                      key={status}
                      type="button"
                      aria-pressed={active}
                      onClick={() => onToggleStatus(status)}
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-[10.5px] font-medium capitalize transition-colors",
                        active
                          ? "border-teal-300 bg-teal-50 text-teal-800 dark:border-teal-500/40 dark:bg-teal-500/10 dark:text-teal-200"
                          : "border-border text-muted-foreground hover:bg-muted",
                      )}
                    >
                      {status.replace(/-/g, " ")}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          <label className="mt-3 flex cursor-pointer items-center gap-2 border-t border-border pt-2.5 text-[11.5px]">
            <Checkbox
              checked={showRuns}
              onCheckedChange={(checked) => onShowRunsChange(Boolean(checked))}
              aria-label="Show run nodes"
            />
            Show runs
          </label>
        </PopoverContent>
      </Popover>
    </div>
  );
}
