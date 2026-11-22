import type { GraphEdge, GraphNode } from "@/types";
import type { GraphView } from "../types";

/**
 * Deterministic synthetic graph used to exercise the canvas at scale.
 * At 200 nodes the dagre layout stays interactive; this is a structural
 * fixture, not a benchmark claim.
 */
export function buildStressGraph(count = 200): GraphView {
  const size = Math.max(4, Math.floor(count));
  const hypothesisCount = Math.max(1, Math.round(size * 0.2));
  const experimentCount = Math.max(1, Math.round(size * 0.3));

  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  nodes.push({
    id: "stress-project",
    type: "project",
    label: "Stress-test project",
    status: "active",
    metadata: { projectId: "stress", description: "Synthetic 200-node layout fixture." },
  });

  const hypothesisIds: string[] = [];
  const experimentIds: string[] = [];
  const runIds: string[] = [];

  for (let index = 0; index < size - 1; index += 1) {
    const id = `stress-node-${index}`;
    if (index < hypothesisCount) {
      hypothesisIds.push(id);
      nodes.push({
        id,
        type: "hypothesis",
        label: `Hypothesis ${index + 1}`,
        status: index % 3 === 0 ? "supported" : "testing",
        metadata: { projectId: "stress" },
      });
      edges.push({ id: `stress-edge-p-${index}`, from: "stress-project", to: id, type: "depends" });
    } else if (index < hypothesisCount + experimentCount) {
      experimentIds.push(id);
      nodes.push({
        id,
        type: "experiment",
        label: `Experiment ${index + 1}`,
        status: index % 2 === 0 ? "running" : "planned",
        metadata: { projectId: "stress" },
      });
      const parent = hypothesisIds[index % hypothesisIds.length];
      edges.push({ id: `stress-edge-h-${index}`, from: parent, to: id, type: "branches" });
    } else {
      runIds.push(id);
      nodes.push({
        id,
        type: "run",
        label: `run/${index + 1}`,
        status: index % 4 === 0 ? "running" : "completed",
        metadata: { projectId: "stress" },
      });
      const parent = experimentIds[index % experimentIds.length];
      edges.push({ id: `stress-edge-e-${index}`, from: parent, to: id, type: "tests" });
      if (index % 5 === 0 && hypothesisIds.length > 0) {
        edges.push({
          id: `stress-edge-d-${index}`,
          from: id,
          to: hypothesisIds[index % hypothesisIds.length],
          type: "derived_from",
        });
      }
    }
  }

  // A few cross-links keep the layered layout from becoming a single column.
  hypothesisIds.forEach((id, index) => {
    if (index > 0 && index % 4 === 0) {
      edges.push({
        id: `stress-edge-x-${index}`,
        from: hypothesisIds[index - 1],
        to: id,
        type: "depends",
      });
    }
  });

  return { nodes, edges };
}
