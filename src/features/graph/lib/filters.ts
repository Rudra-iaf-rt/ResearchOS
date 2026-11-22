import type { GraphEdge, GraphNode } from "@/types";
import type { CitationFilters, GraphFilters, GraphView } from "../types";
import { filterValidEdges } from "./validation";

export function filterGraph(graph: GraphView, filters: GraphFilters): GraphView {
  const allowedTypes = filters.nodeTypes ? new Set(filters.nodeTypes) : null;
  const allowedStatuses = filters.statuses ? new Set(filters.statuses) : null;
  const search = filters.search?.trim().toLowerCase() ?? "";

  const nodes = graph.nodes.filter((node) => {
    if (allowedTypes && !allowedTypes.has(node.type)) return false;
    if (filters.showRuns === false && node.type === "run") return false;
    if (allowedStatuses && allowedStatuses.size > 0) {
      if (!node.status || !allowedStatuses.has(node.status)) return false;
    }
    if (search) {
      const haystack = [
        node.label,
        node.status ?? "",
        node.metadata?.description ?? "",
        node.metadata?.owner ?? "",
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });

  return { nodes, edges: filterValidEdges(nodes, graph.edges) };
}

export function collectStatuses(nodes: GraphNode[]): string[] {
  return Array.from(
    new Set(nodes.map((node) => node.status).filter((status): status is string => Boolean(status))),
  ).sort();
}

export function collectTags(nodes: GraphNode[]): string[] {
  return Array.from(
    new Set(nodes.flatMap((node) => node.metadata?.tags ?? [])),
  ).sort();
}

/** Filter citation nodes while keeping the seed paper visible. */
export function filterCitationGraph(
  graph: GraphView,
  seedId: string,
  filters: CitationFilters,
): GraphView {
  const tagSet = filters.tags && filters.tags.length > 0 ? new Set(filters.tags) : null;

  const nodes = graph.nodes.filter((node) => {
    if (node.id === seedId) return true;
    if (filters.onlyLibrary && node.metadata?.inLibrary === false) return false;
    const year = node.metadata?.year;
    if (filters.yearFrom !== undefined && typeof year === "number" && year < filters.yearFrom) {
      return false;
    }
    if (filters.yearTo !== undefined && typeof year === "number" && year > filters.yearTo) {
      return false;
    }
    if (tagSet) {
      const tags = node.metadata?.tags ?? [];
      if (!tags.some((tag) => tagSet.has(tag))) return false;
    }
    return true;
  });

  return { nodes, edges: filterValidEdges(nodes, graph.edges) };
}

export function graphStats(graph: GraphView): { labels: string; summary: string } {
  const nodeCount = graph.nodes.length;
  const edgeCount = graph.edges.length;
  return {
    labels: `${nodeCount} nodes · ${edgeCount} relationships`,
    summary: `${nodeCount} nodes and ${edgeCount} relationships`,
  };
}

export function edgeKey(edge: GraphEdge): string {
  return `${edge.from}->${edge.to}:${edge.type}`;
}
