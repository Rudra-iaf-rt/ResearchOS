import type { GraphEdge, GraphNode } from "@/types";
import type { GraphValidationIssue, GraphValidationResult } from "../types";

/** Validate identifier uniqueness and that every edge references a node. */
export function validateGraph(nodes: GraphNode[], edges: GraphEdge[]): GraphValidationResult {
  const issues: GraphValidationIssue[] = [];
  const ids = new Set<string>();

  nodes.forEach((node) => {
    if (!node.id) {
      issues.push({ nodeId: node.id, message: "Node is missing an id." });
      return;
    }
    if (ids.has(node.id)) {
      issues.push({ nodeId: node.id, message: `Duplicate node id: ${node.id}` });
    }
    ids.add(node.id);
  });

  edges.forEach((edge) => {
    if (!ids.has(edge.from)) {
      issues.push({
        edgeId: edge.id,
        message: `Edge ${edge.id} starts at missing node ${edge.from}.`,
      });
    }
    if (!ids.has(edge.to)) {
      issues.push({
        edgeId: edge.id,
        message: `Edge ${edge.id} ends at missing node ${edge.to}.`,
      });
    }
    if (edge.from === edge.to) {
      issues.push({
        edgeId: edge.id,
        message: `Edge ${edge.id} links node ${edge.from} to itself.`,
      });
    }
  });

  return { valid: issues.length === 0, issues };
}

/** Drop edges that do not reference two distinct existing nodes. */
export function filterValidEdges(nodes: GraphNode[], edges: GraphEdge[]): GraphEdge[] {
  const ids = new Set(nodes.map((node) => node.id));
  return edges.filter(
    (edge) => ids.has(edge.from) && ids.has(edge.to) && edge.from !== edge.to,
  );
}

/** Keep only edges that are both valid and connect two visible nodes. */
export function visibleEdges(nodes: GraphNode[], edges: GraphEdge[]): GraphEdge[] {
  return filterValidEdges(nodes, edges);
}

/** Focus node plus its direct neighbours, for the dimming treatment. */
export function relatedNodeIds(focusId: string | null, edges: GraphEdge[]): Set<string> {
  if (!focusId) return new Set();
  const related = new Set<string>([focusId]);
  edges.forEach((edge) => {
    if (edge.from === focusId) related.add(edge.to);
    if (edge.to === focusId) related.add(edge.from);
  });
  return related;
}

export function hasNode(nodes: GraphNode[], id: string | null): boolean {
  return Boolean(id && nodes.some((node) => node.id === id));
}
