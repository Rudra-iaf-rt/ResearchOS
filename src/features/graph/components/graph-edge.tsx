import { memo, useState } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type Edge,
  type EdgeProps,
} from "@xyflow/react";
import { cn } from "@/lib/utils";

export interface GraphEdgeData extends Record<string, unknown> {
  label: string;
  dashed: boolean;
  muted: boolean;
}

export type GraphFlowEdge = Edge<GraphEdgeData, "graphEdge">;

function GraphEdgeLineComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  style,
  data,
}: EdgeProps<GraphFlowEdge>) {
  const [hovered, setHovered] = useState(false);
  const [path, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  return (
    <g onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <BaseEdge id={id} path={path} markerEnd={markerEnd} style={style} />
      {hovered && data?.label && (
        <EdgeLabelRenderer>
          <div
            className={cn(
              "pointer-events-none absolute z-10 rounded-md border border-border bg-popover px-1.5 py-0.5 text-[9.5px] font-medium text-popover-foreground shadow-subtle",
              data.muted && "opacity-60",
            )}
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            }}
          >
            {data.label}
          </div>
        </EdgeLabelRenderer>
      )}
    </g>
  );
}

export const GraphEdgeLine = memo(GraphEdgeLineComponent);
