import { useEffect } from "react";
import {
  AlertTriangle,
  Check,
  CloudOff,
  CloudUpload,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { fromNow } from "@/lib/format";
import { useSyncStore, type SyncStatus } from "@/store/sync-store";

const statusMeta: Record<
  SyncStatus,
  { label: string; description: string; dot: string; icon: typeof Check }
> = {
  synced: {
    label: "Synced",
    description: "All local changes are saved in this browser.",
    dot: "bg-teal-500",
    icon: Check,
  },
  syncing: {
    label: "Syncing",
    description: "Pushing recent changes to the demo store…",
    dot: "bg-indigo-500",
    icon: Loader2,
  },
  offline: {
    label: "Offline",
    description: "You are offline. Changes stay on this device until you reconnect.",
    dot: "bg-amber-500",
    icon: CloudOff,
  },
  conflict: {
    label: "Conflict",
    description: "Two versions of a record disagree. Review before syncing again.",
    dot: "bg-rose-500",
    icon: AlertTriangle,
  },
};

const simulatedStates: SyncStatus[] = ["synced", "syncing", "offline", "conflict"];

export function SyncIndicator() {
  const status = useSyncStore((state) => state.status);
  const lastSyncedAt = useSyncStore((state) => state.lastSyncedAt);
  const setStatus = useSyncStore((state) => state.setStatus);
  const markSynced = useSyncStore((state) => state.markSynced);

  useEffect(() => {
    if (status !== "syncing") return;
    const timer = window.setTimeout(() => markSynced(), 1600);
    return () => window.clearTimeout(timer);
  }, [status, markSynced]);

  const meta = statusMeta[status];
  const Icon = meta.icon;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 px-2 text-[11.5px] text-muted-foreground"
          aria-label={`Sync status: ${meta.label}`}
        >
          <span className="relative flex size-3.5 items-center justify-center">
            {status === "syncing" ? (
              <Loader2 className="size-3.5 animate-spin text-indigo-500" />
            ) : (
              <span className={cn("size-2 rounded-full", meta.dot)} />
            )}
          </span>
          <span className="hidden sm:inline">{meta.label}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-0">
        <div className="border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "flex size-8 items-center justify-center rounded-lg",
                status === "synced" &&
                  "bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300",
                status === "syncing" &&
                  "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300",
                status === "offline" &&
                  "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
                status === "conflict" &&
                  "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300",
              )}
            >
              <Icon className={cn("size-4", status === "syncing" && "animate-spin")} />
            </span>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold">{meta.label}</p>
              <p className="text-[10.5px] text-muted-foreground">
                Last saved {fromNow(lastSyncedAt)}
              </p>
            </div>
          </div>
          <p className="mt-2 text-[11.5px] leading-relaxed text-muted-foreground">
            {meta.description}
          </p>
        </div>

        <div className="px-4 py-3">
          <p className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            <RefreshCw className="size-3" />
            Demo state simulator
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {simulatedStates.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setStatus(value)}
                aria-pressed={status === value}
                className={cn(
                  "flex items-center gap-1.5 rounded-md border px-2 py-1.5 text-[11px] font-medium transition-colors",
                  status === value
                    ? "border-navy-900 bg-navy-900 text-white dark:border-teal-500/40 dark:bg-teal-500/15 dark:text-teal-200"
                    : "border-border bg-card text-muted-foreground hover:text-foreground",
                )}
              >
                <span className={cn("size-1.5 rounded-full", statusMeta[value].dot)} />
                {statusMeta[value].label}
              </button>
            ))}
          </div>
          <p className="mt-2.5 rounded-md border border-border bg-muted/40 px-2 py-1.5 text-[10px] leading-relaxed text-muted-foreground">
            Sync is simulated in Phase 1. No network requests are made; data lives in this
            browser only.
          </p>
        </div>

        <div className="border-t border-border px-4 py-2">
          <button
            type="button"
            onClick={() => setStatus("syncing")}
            className="inline-flex items-center gap-1.5 text-[11px] font-medium text-teal-700 hover:underline dark:text-teal-300"
          >
            <CloudUpload className="size-3.5" />
            Simulate a sync
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
