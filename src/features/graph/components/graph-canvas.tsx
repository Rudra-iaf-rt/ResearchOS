import { memo, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Background,
  MiniMap,
  Panel,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type NodeTypes,
  type EdgeTypes,
} from "@xyflow/react";
import {
  Expand,
  LayoutGrid,
  Map as MapIcon,
  Minus,
  Plus,
  X,
} from "lucide-react";
import "@xyflow/react/dist/style.css";
import type { GraphEdge, GraphNode } from "@/types";
import {
  graphEdgeTypeMeta,
  graphLayoutMeta,
  type GraphLayout,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import { computeLayout } from "../lib/layouts";
import { relatedNodeIds } from "../lib/validation";
import { GraphNodeCard, type GraphFlowNode } from "./graph-node-card";
import { GraphEdgeLine, type GraphFlowEdge } from "./graph-edge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const nodeTypes: NodeTypes = { graphNode: GraphNodeCard };
const edgeTypes: EdgeTypes = { graphEdge: GraphEdgeLine };

export interface GraphCanvasProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  layout: GraphLayout;
  focusId: string | null;
  onLayoutChange?: (layout: GraphLayout) => void;
  onFocusChange?: (id: string | null) => void;
  onNodeClick?: (node: GraphNode) => void;
  legend?: ReactNode;
  filters?: ReactNode;
  toolbar?: ReactNode;
  emptyState?: ReactNode;
  className?: string;
}

function CanvasInner({
  nodes,
  edges,
  layout,
  focusId,
  onLayoutChange,
  onFocusChange,
  onNodeClick,
  legend,
  filters,
  toolbar,
  emptyState,
  className,
}: GraphCanvasProps) {
  const { fitView, zoomIn, zoomOut } = useReactFlow();
  const [showMinimap, setShowMinimap] = useState(true);

  const positions = useMemo(
    () => computeLayout(nodes, edges, layout),
    [nodes, edges, layout],
  );

  const related = useMemo(() => relatedNodeIds(focusId, edges), [focusId, edges]);

  const handleSelect = useCallback(
    (id: string) => {
      onFocusChange?.(focusId === id ? null : id);
      const node = nodes.find((item) => item.id === id);
      if (node) onNodeClick?.(node);
    },
    [focusId, nodes, onFocusChange, onNodeClick],
  );

  const flowNodes = useMemo<GraphFlowNode[]>(
    () =>
      nodes.map((node) => ({
        id: node.id,
        type: "graphNode",
        position: positions[node.id] ?? { x: 0, y: 0 },
        data: {
          node,
          focused: node.id === focusId,
          dimmed: Boolean(focusId) && !related.has(node.id),
          hasFocus: Boolean(focusId),
          onSelect: handleSelect,
        },
        draggable: false,
        selectable: true,
      })),
    [nodes, positions, focusId, related, handleSelect],
  );

  const flowEdges = useMemo<GraphFlowEdge[]>(
    () =>
      edges.map((edge) => {
        const meta = graphEdgeTypeMeta[edge.type];
        const isFocused = Boolean(
          focusId && (edge.from === focusId || edge.to === focusId),
        );
        return {
          id: edge.id,
          source: edge.from,
          target: edge.to,
          type: "graphEdge",
          data: {
            label: meta.label,
            dashed: meta.dashed,
            muted: Boolean(focusId) && !isFocused,
          },
          style: {
            stroke: meta.color,
            strokeWidth: isFocused ? 2.2 : 1.4,
            strokeDasharray: meta.dashed ? "5 4" : undefined,
            opacity: focusId && !isFocused ? 0.25 : 0.95,
          },
          markerEnd: {
            type: "arrowclosed",
            color: meta.color,
            width: 16,
            height: 16,
          },
        };
      }),
    [edges, focusId],
  );

  // Re-fit only when the structural layout changes, never on focus changes.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fitView({ padding: 0.18, duration: 320 });
    }, 60);
    return () => window.clearTimeout(timer);
  }, [fitView, layout, nodes.length]);

  const empty = nodes.length === 0;

  return (
    <div
      className={cn(
        "relative h-[640px] w-full overflow-hidden rounded-xl border border-border bg-card shadow-subtle",
        className,
      )}
      aria-label="Interactive research graph"
    >
      {empty ? (
        <div className="flex h-full items-center justify-center p-6">{emptyState}</div>
      ) : (
        <ReactFlow
          nodes={flowNodes}
          edges={flowEdges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          fitViewOptions={{ padding: 0.18 }}
          minZoom={0.12}
          maxZoom={1.8}
          nodesDraggable={false}
          nodesConnectable={false}
          edgesFocusable={false}
          onPaneClick={() => onFocusChange?.(null)}
          proOptions={{ hideAttribution: true }}
          className="[&_.react-flow__node]:cursor-pointer [&_.react-flow__edge]:cursor-pointer"
        >
          <Background gap={18} size={1} color="hsl(var(--border))" />

          <Panel position="top-left" className="!m-2 flex flex-wrap items-center gap-1.5">
            {toolbar}
            {onLayoutChange && (
              <Select
                value={layout}
                onValueChange={(value) => onLayoutChange(value as GraphLayout)}
              >
                <SelectTrigger
                  className="h-8 w-auto min-w-[142px] gap-1.5 bg-card/95 text-[11.5px] shadow-subtle backdrop-blur"
                  aria-label="Graph layout"
                >
                  <LayoutGrid className="size-3.5 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(graphLayoutMeta) as GraphLayout[]).map((value) => (
                    <SelectItem key={value} value={value}>
                      {graphLayoutMeta[value].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <div className="inline-flex items-center rounded-lg border border-border bg-card/95 p-0.5 shadow-subtle backdrop-blur">
              <Button
                variant="ghost"
                size="icon"
                className="size-7 rounded-md"
                aria-label="Zoom in"
                onClick={() => void zoomIn({ duration: 180 })}
              >
                <Plus className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 rounded-md"
                aria-label="Zoom out"
                onClick={() => void zoomOut({ duration: 180 })}
              >
                <Minus className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 rounded-md"
                aria-label="Fit graph to view"
                onClick={() => void fitView({ padding: 0.18, duration: 240 })}
              >
                <Expand className="size-3.5" />
              </Button>
            </div>
          </Panel>

          <Panel position="top-right" className="!m-2 flex flex-col items-end gap-2">
            <div className="flex items-center gap-1.5">
              {filters}
              <Button
                variant="outline"
                size="icon"
                className="size-8 bg-card/95 backdrop-blur"
                aria-label={showMinimap ? "Hide minimap" : "Show minimap"}
                aria-pressed={showMinimap}
                onClick={() => setShowMinimap((value) => !value)}
              >
                {showMinimap ? <X className="size-3.5" /> : <MapIcon className="size-3.5" />}
              </Button>
            </div>
          </Panel>

          {showMinimap && (
            <MiniMap
              pannable
              zoomable
              className="!m-2 !h-24 !w-40 !rounded-lg !border !border-border !bg-card/95"
              maskColor="hsl(var(--background) / 0.65)"
              nodeColor="#94A3B8"
            />
          )}

          {legend && (
            <Panel position="bottom-left" className="!m-2">
              {legend}
            </Panel>
          )}
        </ReactFlow>
      )}
    </div>
  );
}

/**
 * Shared graph surface. Layout positions are memoized on nodes/edges/layout,
 * so focus, filtering, and selection changes do not re-run dagre.
 */
export const GraphCanvas = memo(function GraphCanvas(props: GraphCanvasProps) {
  return (
    <ReactFlowProvider>
      <CanvasInner {...props} />
    </ReactFlowProvider>
  );
});
