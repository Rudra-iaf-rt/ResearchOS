import { runStatusMeta } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { ExperimentRun, RunStatus } from "@/types";

const segmentTone: Record<RunStatus, string> = {
  queued: "bg-indigo-300 dark:bg-indigo-500/60",
  running: "bg-amber-400 dark:bg-amber-500",
  succeeded: "bg-emerald-500 dark:bg-emerald-400",
  failed: "bg-rose-500 dark:bg-rose-400",
};

/** Last ten runs as a compact outcome strip. Hover or focus for details. */
export function RunStatusStrip({ runs }: { runs: ExperimentRun[] }) {
  const recent = [...runs].sort((a, b) => a.runNumber - b.runNumber).slice(-10);

  if (recent.length === 0) {
    return (
      <p className="text-[12.5px] text-muted-foreground">
        No runs yet. The strip fills in as runs are queued and finished.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <div
        className="flex flex-wrap gap-1"
        role="list"
        aria-label={`Last ${recent.length} runs`}
      >
        {recent.map((run) => (
          <span
            key={run.id}
            role="listitem"
            tabIndex={0}
            title={`Run ${run.runNumber} · ${run.label} · ${runStatusMeta[run.status].label}`}
            className={cn(
              "h-2.5 w-7 rounded-full outline-none transition-transform focus-visible:ring-2 focus-visible:ring-ring",
              segmentTone[run.status],
            )}
          >
            <span className="sr-only">
              Run {run.runNumber}: {runStatusMeta[run.status].label}
            </span>
          </span>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
        {(Object.keys(segmentTone) as RunStatus[]).map((status) => (
          <span key={status} className="inline-flex items-center gap-1.5">
            <span className={cn("size-1.5 rounded-full", segmentTone[status])} aria-hidden="true" />
            {runStatusMeta[status].label}
          </span>
        ))}
      </div>
    </div>
  );
}
