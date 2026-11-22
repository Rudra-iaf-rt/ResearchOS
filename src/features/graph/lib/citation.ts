import type { GraphNode } from "@/types";

export interface CitationEdgeLike {
  from: string;
  to: string;
}

/**
 * Undirected BFS around a seed paper. Radius 1 returns direct neighbours,
 * radius 2 their neighbours, and so on. The seed is always included.
 */
export function citationNeighborhood(
  seedId: string,
  edges: CitationEdgeLike[],
  radius: 1 | 2,
): Set<string> {
  const adjacency = new Map<string, Set<string>>();
  edges.forEach((edge) => {
    if (!adjacency.has(edge.from)) adjacency.set(edge.from, new Set());
    if (!adjacency.has(edge.to)) adjacency.set(edge.to, new Set());
    adjacency.get(edge.from)?.add(edge.to);
    adjacency.get(edge.to)?.add(edge.from);
  });

  const visited = new Set<string>([seedId]);
  let frontier = [seedId];
  for (let depth = 0; depth < radius; depth += 1) {
    const next: string[] = [];
    frontier.forEach((nodeId) => {
      adjacency.get(nodeId)?.forEach((neighbour) => {
        if (visited.has(neighbour)) return;
        visited.add(neighbour);
        next.push(neighbour);
      });
    });
    frontier = next;
    if (frontier.length === 0) break;
  }
  return visited;
}

export function citationYearRange(nodes: GraphNode[]): { min: number; max: number } | null {
  const years = nodes
    .map((node) => node.metadata?.year)
    .filter((year): year is number => typeof year === "number" && Number.isFinite(year));
  if (years.length === 0) return null;
  return { min: Math.min(...years), max: Math.max(...years) };
}

export function citationTagSet(nodes: GraphNode[]): string[] {
  return Array.from(
    new Set(nodes.flatMap((node) => node.metadata?.tags ?? [])),
  ).sort();
}

export function isExternalCitation(node: GraphNode): boolean {
  return node.metadata?.inLibrary === false;
}
