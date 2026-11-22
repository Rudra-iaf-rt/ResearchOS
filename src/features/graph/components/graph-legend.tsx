import { graphEdgeTypeMeta, graphEdgeTypes, graphNodeTypeMeta, graphNodeTypes } from "@/lib/constants";

export function GraphLegend() {
  return (
    <div className="rounded-lg border border-border bg-card/95 px-2.5 py-2 shadow-subtle backdrop-blur">
      <div className="flex flex-wrap gap-x-2.5 gap-y-1">
        {graphNodeTypes.map((type) => (
          <span key={type} className="flex items-center gap-1 text-[9.5px] text-muted-foreground">
            <span
              className="size-1.5 rounded-full"
              style={{ backgroundColor: graphNodeTypeMeta[type].color }}
              aria-hidden="true"
            />
            {graphNodeTypeMeta[type].label}
          </span>
        ))}
      </div>
      <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 border-t border-border pt-1.5">
        {graphEdgeTypes
          .filter((type) => type === "cites" || type === "derived_from" || type === "depends")
          .map((type) => {
            const meta = graphEdgeTypeMeta[type];
            return (
              <span key={type} className="flex items-center gap-1 text-[9.5px] text-muted-foreground">
                <svg width="16" height="6" aria-hidden="true">
                  <line
                    x1="0"
                    y1="3"
                    x2="16"
                    y2="3"
                    stroke={meta.color}
                    strokeWidth="1.5"
                    strokeDasharray={meta.dashed ? "3 2" : undefined}
                  />
                </svg>
                {meta.label}
              </span>
            );
          })}
      </div>
    </div>
  );
}
