import { memo } from "react";
import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import {
  BookOpen,
  Database,
  FlaskConical,
  FolderKanban,
  Gavel,
  Lightbulb,
  NotebookPen,
  PlayCircle,
} from "lucide-react";
import type { GraphNode, GraphNodeType } from "@/types";
import { graphNodeTypeMeta } from "@/lib/constants";
import { cn } from "@/lib/utils";

export interface GraphNodeData extends Record<string, unknown> {
  node: GraphNode;
  focused: boolean;
  dimmed: boolean;
  hasFocus: boolean;
  onSelect: (id: string) => void;
}

export type GraphFlowNode = Node<GraphNodeData, "graphNode">;

const typeIcons: Record<GraphNodeType, typeof FolderKanban> = {
  project: FolderKanban,
  experiment: FlaskConical,
  run: PlayCircle,
  hypothesis: Lightbulb,
  paper: BookOpen,
  notebook: NotebookPen,
  dataset: Database,
  decision: Gavel,
};

const statusTone: Record<string, string> = {
  completed: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300",
  supported: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300",
  accepted: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300",
  running: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-300",
  testing: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-300",
  analysis: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-300",
  planned: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300",
  proposed: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300",
  queued: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300",
  failed: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300",
};

function statusLabel(status: string): string {
  return status.replace(/-/g, " ");
}

function GraphNodeCardComponent({ data }: NodeProps<GraphFlowNode>) {
  const { node, focused, dimmed, hasFocus } = data;
  const meta = graphNodeTypeMeta[node.type];
  const Icon = typeIcons[node.type];
  const metric = node.metadata?.metrics?.[0];
  const ariaLabel = [
    node.label,
    meta.label,
    node.status ? `status ${statusLabel(node.status)}` : null,
    node.metadata?.owner ?? null,
  ]
    .filter(Boolean)
    .join(", ");

  const select = () => data.onSelect(node.id);

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={ariaLabel}
      aria-pressed={focused}
      onClick={select}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          select();
        }
      }}
      className={cn(
        "group w-[232px] rounded-xl border border-border bg-card px-3 py-2.5 text-left shadow-subtle outline-none transition-[box-shadow,opacity,transform] duration-150",
        "hover:-translate-y-0.5 hover:shadow-raised focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        focused && "ring-2 ring-teal-500 ring-offset-2 ring-offset-background",
        dimmed && hasFocus && "opacity-40",
      )}
      style={{ borderLeft: `3px solid ${meta.color}` }}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!size-1.5 !border-0 !bg-slate-400"
        isConnectable={false}
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!size-1.5 !border-0 !bg-slate-400"
        isConnectable={false}
      />
      <div className="flex items-center gap-1.5">
        <span
          className="flex size-5 shrink-0 items-center justify-center rounded-md"
          style={{ backgroundColor: `${meta.color}18`, color: meta.color }}
        >
          <Icon className="size-3" aria-hidden="true" />
        </span>
        <span className="truncate text-[9.5px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
          {meta.label}
        </span>
        {node.status && (
          <span
            className={cn(
              "ml-auto shrink-0 rounded-full border px-1.5 py-px text-[9px] font-medium capitalize",
              statusTone[node.status] ??
                "border-border bg-muted text-muted-foreground",
            )}
          >
            {statusLabel(node.status)}
          </span>
        )}
      </div>
      <p className="mt-1.5 line-clamp-2 text-[12px] font-medium leading-snug text-foreground">
        {node.label}
      </p>
      <div className="mt-1 flex items-center justify-between gap-2 text-[9.5px] text-muted-foreground">
        <span className="truncate">{node.metadata?.owner ?? meta.description}</span>
        {metric && (
          <span className="shrink-0 rounded bg-muted px-1 py-px tabular-nums">
            {metric.label} {metric.value}
          </span>
        )}
      </div>
    </div>
  );
}

export const GraphNodeCard = memo(GraphNodeCardComponent);
