import { useEffect, useMemo } from "react";
import { ArrowLeft, ArrowRight, ExternalLink, Sparkles, X } from "lucide-react";
import type { GraphEdge, GraphNode } from "@/types";
import { graphEdgeTypeMeta, graphNodeTypeMeta } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface NodeDetailPanelProps {
  node: GraphNode | null;
  nodes: GraphNode[];
  edges: GraphEdge[];
  onClose: () => void;
  onSelect: (id: string) => void;
  onAction?: (node: GraphNode) => void;
  className?: string;
}

export function NodeDetailPanel({
  node,
  nodes,
  edges,
  onClose,
  onSelect,
  onAction,
  className,
}: NodeDetailPanelProps) {
  useEffect(() => {
    if (!node) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [node, onClose]);

  const linked = useMemo(() => {
    if (!node) return { outgoing: [], incoming: [] };
    const byId = new Map(nodes.map((item) => [item.id, item]));
    const outgoing: Array<{ edge: GraphEdge; other: GraphNode }> = [];
    const incoming: Array<{ edge: GraphEdge; other: GraphNode }> = [];
    edges.forEach((edge) => {
      if (edge.from === node.id) {
        const other = byId.get(edge.to);
        if (other) outgoing.push({ edge, other });
      }
      if (edge.to === node.id) {
        const other = byId.get(edge.from);
        if (other) incoming.push({ edge, other });
      }
    });
    return { outgoing, incoming };
  }, [node, nodes, edges]);

  if (!node) return null;

  const meta = graphNodeTypeMeta[node.type];
  const href = node.metadata?.href;
  const action = node.metadata?.action;

  return (
    <aside
      aria-label={`Details for ${node.label}`}
      className={cn(
        "flex max-h-[640px] w-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-subtle",
        className,
      )}
    >
      <div className="flex items-start gap-2 border-b border-border p-3.5">
        <span
          className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold uppercase"
          style={{ backgroundColor: `${meta.color}18`, color: meta.color }}
          aria-hidden="true"
        >
          {meta.label.slice(0, 1)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[9.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {meta.label}
            {node.metadata?.kind === "conclusion" && " · Conclusion"}
          </p>
          <h2 className="mt-0.5 text-[13px] font-semibold leading-snug">{node.label}</h2>
          {node.status && (
            <span className="mt-1 inline-flex rounded-full border border-border bg-muted px-1.5 py-px text-[9.5px] font-medium capitalize text-muted-foreground">
              {node.status.replace(/-/g, " ")}
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-7 shrink-0"
          aria-label="Close node details"
          onClick={onClose}
        >
          <X className="size-3.5" />
        </Button>
      </div>

      <div className="min-h-0 flex-1 space-y-3.5 overflow-y-auto p-3.5 scrollbar-thin">
        {node.metadata?.description && (
          <p className="text-[11.5px] leading-relaxed text-muted-foreground">
            {node.metadata.description}
          </p>
        )}

        <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1.5 text-[10.5px]">
          {node.metadata?.owner && (
            <>
              <dt className="text-muted-foreground">Owner</dt>
              <dd className="truncate font-medium">{node.metadata.owner}</dd>
            </>
          )}
          {node.metadata?.date && (
            <>
              <dt className="text-muted-foreground">Updated</dt>
              <dd className="truncate">{new Date(node.metadata.date).toLocaleDateString()}</dd>
            </>
          )}
          {node.metadata?.journal && (
            <>
              <dt className="text-muted-foreground">Journal</dt>
              <dd className="truncate">{node.metadata.journal}</dd>
            </>
          )}
          {typeof node.metadata?.year === "number" && (
            <>
              <dt className="text-muted-foreground">Year</dt>
              <dd className="tabular-nums">{node.metadata.year}</dd>
            </>
          )}
          {node.metadata?.inLibrary === false && (
            <>
              <dt className="text-muted-foreground">Source</dt>
              <dd className="text-amber-700 dark:text-amber-300">Reference only · not verified</dd>
            </>
          )}
        </dl>

        {node.metadata?.metrics && node.metadata.metrics.length > 0 && (
          <div className="grid grid-cols-2 gap-1.5">
            {node.metadata.metrics.map((metric) => (
              <div
                key={`${metric.label}-${metric.value}`}
                className="rounded-md border border-border bg-muted/30 px-2 py-1.5"
              >
                <p className="text-[9px] uppercase tracking-[0.08em] text-muted-foreground">
                  {metric.label}
                </p>
                <p className="text-[12px] font-semibold tabular-nums">{metric.value}</p>
              </div>
            ))}
          </div>
        )}

        {node.metadata?.tags && node.metadata.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {node.metadata.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-muted px-1.5 py-0.5 text-[9.5px] text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {(href || action) && (
          <div className="flex flex-wrap gap-1.5 border-t border-border pt-3">
            {href && (
              <Button asChild size="sm" variant="outline" className="h-7 gap-1.5 text-[10.5px]">
                <a href={href}>
                  <ExternalLink className="size-3" /> Open artifact
                </a>
              </Button>
            )}
            {action && onAction && (
              <Button
                size="sm"
                variant="secondary"
                className="h-7 gap-1.5 text-[10.5px]"
                onClick={() => onAction(node)}
              >
                <Sparkles className="size-3" />
                {action === "open-run-logs" ? "View run logs" : "Open experiment"}
              </Button>
            )}
          </div>
        )}

        <div className="border-t border-border pt-3">
          <p className="text-[9.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Linked artifacts
          </p>
          {linked.outgoing.length === 0 && linked.incoming.length === 0 ? (
            <p className="mt-1.5 text-[10.5px] text-muted-foreground">
              No connections in this view yet.
            </p>
          ) : (
            <ul className="mt-1.5 space-y-1">
              {linked.outgoing.map(({ edge, other }) => (
                <li key={edge.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(other.id)}
                    className="flex w-full items-center gap-1.5 rounded-md px-1 py-1 text-left text-[10.5px] hover:bg-muted"
                  >
                    <ArrowRight className="size-3 shrink-0 text-muted-foreground" />
                    <span className="truncate">{other.label}</span>
                    <span className="ml-auto shrink-0 text-[9px] text-muted-foreground">
                      {graphEdgeTypeMeta[edge.type].label}
                    </span>
                  </button>
                </li>
              ))}
              {linked.incoming.map(({ edge, other }) => (
                <li key={edge.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(other.id)}
                    className="flex w-full items-center gap-1.5 rounded-md px-1 py-1 text-left text-[10.5px] hover:bg-muted"
                  >
                    <ArrowLeft className="size-3 shrink-0 text-muted-foreground" />
                    <span className="truncate">{other.label}</span>
                    <span className="ml-auto shrink-0 text-[9px] text-muted-foreground">
                      {graphEdgeTypeMeta[edge.type].label}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </aside>
  );
}
