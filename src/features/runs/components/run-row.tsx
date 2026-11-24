import { Link } from "react-router-dom";
import {
  CheckCircle2,
  ChevronDown,
  Clock,
  ExternalLink,
  FileUp,
  Loader2,
  Play,
  RotateCcw,
  ScrollText,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RunStatusBadge } from "@/components/shared/status-badge";
import { runTransitions } from "@/lib/constants";
import { formatDate, fromNow } from "@/lib/format";
import { cn } from "@/lib/utils";
import { artifactHref } from "@/features/artifacts/lib";
import { formatDurationLong, formatDurationSeconds } from "../lib";
import type { ExperimentRun, RunStatus } from "@/types";

const actionMeta: Partial<Record<RunStatus, { label: string; icon: typeof Play }>> = {
  running: { label: "Start run", icon: Play },
  succeeded: { label: "Mark succeeded", icon: CheckCircle2 },
  failed: { label: "Mark failed", icon: XCircle },
};

interface RunRowProps {
  run: ExperimentRun;
  expanded: boolean;
  onToggle: () => void;
  onStatusChange: (status: RunStatus) => void;
  onReproduce: () => void;
  pending?: boolean;
}

export function RunRow({
  run,
  expanded,
  onToggle,
  onStatusChange,
  onReproduce,
  pending = false,
}: RunRowProps) {
  const transitions = runTransitions[run.status];
  const logs = run.logs.trim();

  return (
    <div className={cn("rounded-lg border border-border bg-card", expanded && "ring-1 ring-teal-500/20")}>
      <div className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:gap-3">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          aria-controls={`run-details-${run.id}`}
          className="flex min-w-0 flex-1 items-center gap-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ChevronDown
            className={cn(
              "size-4 shrink-0 text-muted-foreground transition-transform",
              expanded && "rotate-180",
            )}
            aria-hidden="true"
          />
          <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-[12px] font-semibold tabular-nums">
            {run.runNumber}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13.5px] font-medium">{run.label}</span>
            <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11.5px] text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3" aria-hidden="true" />
                {run.startedAt ? formatDate(run.startedAt, "MMM d, HH:mm") : "Not started"}
              </span>
              <span aria-hidden="true">·</span>
              <span>{formatDurationSeconds(run.durationSeconds)}</span>
              {run.artifactRefs.length > 0 && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>
                    {run.artifactRefs.length} artifact{run.artifactRefs.length === 1 ? "" : "s"}
                  </span>
                </>
              )}
            </span>
          </span>
        </button>

        <div className="flex items-center gap-1.5 pl-11 sm:pl-0">
          <RunStatusBadge status={run.status} />
          {transitions.map((next) => {
            const meta = actionMeta[next];
            if (!meta) return null;
            const Icon = meta.icon;
            return (
              <Button
                key={next}
                variant="outline"
                size="sm"
                disabled={pending}
                onClick={() => onStatusChange(next)}
              >
                {pending ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Icon className="size-3.5" />
                )}
                <span className="hidden md:inline">{meta.label}</span>
              </Button>
            );
          })}
          <Button variant="ghost" size="sm" onClick={onReproduce}>
            <RotateCcw className="size-3.5" />
            <span className="hidden lg:inline">Reproduce</span>
          </Button>
        </div>
      </div>

      {expanded && (
        <div id={`run-details-${run.id}`} className="space-y-4 border-t border-border p-3 sm:p-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Started</p>
              <p className="mt-0.5 text-[12.5px]">
                {run.startedAt ? `${formatDate(run.startedAt, "MMM d, yyyy HH:mm")} (${fromNow(run.startedAt)})` : "Not started"}
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Ended</p>
              <p className="mt-0.5 text-[12.5px]">
                {run.endedAt ? formatDate(run.endedAt, "MMM d, yyyy HH:mm") : "Still open"}
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Duration</p>
              <p className="mt-0.5 text-[12.5px]">{formatDurationLong(run.durationSeconds)}</p>
            </div>
          </div>

          <div>
            <h3 className="mb-1.5 flex items-center gap-1.5 text-[12px] font-semibold">
              <ScrollText className="size-3.5 text-muted-foreground" aria-hidden="true" />
              Logs
            </h3>
            <pre
              className="max-h-56 overflow-auto rounded-lg border border-border bg-navy-950 p-3 text-[11.5px] leading-relaxed text-slate-200"
              aria-label={`Logs for run ${run.runNumber}`}
            >
              {logs || "(no log lines recorded)"}
            </pre>
          </div>

          <div>
            <h3 className="mb-1.5 text-[12px] font-semibold">Parameter snapshot</h3>
            <p className="mb-2 text-[11.5px] text-muted-foreground">
              Frozen when this run was created; later experiment edits do not change it.
            </p>
            {run.parameters.length === 0 ? (
              <p className="text-[12px] text-muted-foreground">No parameters were recorded.</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-left text-[12px]">
                  <thead className="bg-muted/40 text-[11px] uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th scope="col" className="px-3 py-1.5 font-medium">Key</th>
                      <th scope="col" className="px-3 py-1.5 font-medium">Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border font-mono">
                    {run.parameters.map((parameter) => (
                      <tr key={parameter.id}>
                        <td className="px-3 py-1.5">{parameter.key}</td>
                        <td className="px-3 py-1.5 text-muted-foreground">{parameter.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div>
            <h3 className="mb-1.5 flex items-center gap-1.5 text-[12px] font-semibold">
              <FileUp className="size-3.5 text-muted-foreground" aria-hidden="true" />
              Artifacts
            </h3>
            {run.artifactRefs.length === 0 ? (
              <p className="text-[12px] text-muted-foreground">No artifacts were attached to this run.</p>
            ) : (
              <ul className="flex flex-wrap gap-1.5">
                {run.artifactRefs.map((artifact) => (
                  <li key={`${artifact.type}:${artifact.id}`}>
                    <Link
                      to={artifactHref(artifact)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2 py-0.5 text-[11.5px] text-muted-foreground hover:border-teal-500/40 hover:text-teal-700 dark:hover:text-teal-300"
                    >
                      <ExternalLink className="size-3" aria-hidden="true" />
                      {artifact.label}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {run.status === "failed" && (
            <Badge variant="danger" className="gap-1">
              <XCircle className="size-3" aria-hidden="true" />
              This run failed. Inspect the log before requeueing.
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
