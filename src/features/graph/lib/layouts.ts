import { graphlib, layout as dagreLayout } from "dagre";
import type { GraphEdge, GraphNode } from "@/types";
import type { GraphLayout } from "../types";

export const NODE_WIDTH = 232;
export const NODE_HEIGHT = 92;
export const NODE_ORIGIN: [number, number] = [0.5, 0.5];

export interface NodePosition {
  x: number;
  y: number;
}

export type LayoutPositions = Record<string, NodePosition>;

/** Build a dagre graph for the two layered layouts. */
function dagrePositions(
  nodes: GraphNode[],
  edges: GraphEdge[],
  direction: "LR" | "TB",
): LayoutPositions {
  const graph = new graphlib.Graph({ multigraph: true });
  graph.setGraph({
    rankdir: direction,
    nodesep: direction === "LR" ? 48 : 64,
    ranksep: direction === "LR" ? 110 : 90,
    marginx: 48,
    marginy: 48,
    acyclicer: "greedy",
    ranker: "network-simplex",
  });
  graph.setDefaultEdgeLabel(() => ({}));
  graph.setDefaultNodeLabel(() => ({}));

  nodes.forEach((node) => {
    graph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });
  edges.forEach((edge, index) => {
    if (graph.hasNode(edge.from) && graph.hasNode(edge.to)) {
      graph.setEdge(edge.from, edge.to, {}, `e${index}`);
    }
  });

  dagreLayout(graph);

  const positions: LayoutPositions = {};
  nodes.forEach((node) => {
    const point = graph.node(node.id) as { x?: number; y?: number } | undefined;
    positions[node.id] = {
      x: (point?.x ?? 0) - NODE_WIDTH / 2,
      y: (point?.y ?? 0) - NODE_HEIGHT / 2,
    };
  });
  return positions;
}

/** Deterministic concentric layout derived from undirected BFS depth. */
function radialPositions(nodes: GraphNode[], edges: GraphEdge[]): LayoutPositions {
  if (nodes.length === 0) return {};

  const adjacency = new Map<string, Set<string>>();
  nodes.forEach((node) => adjacency.set(node.id, new Set()));
  edges.forEach((edge) => {
    if (!adjacency.has(edge.from) || !adjacency.has(edge.to)) return;
    adjacency.get(edge.from)?.add(edge.to);
    adjacency.get(edge.to)?.add(edge.from);
  });

  const roots = nodes.filter(
    (node) => node.type === "project" || !edges.some((edge) => edge.to === node.id),
  );
  const centers = roots.length > 0 ? roots : [nodes[0]];

  const depth = new Map<string, number>();
  const queue: string[] = [];
  centers.forEach((node) => {
    if (!depth.has(node.id)) {
      depth.set(node.id, 0);
      queue.push(node.id);
    }
  });

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) break;
    const currentDepth = depth.get(current) ?? 0;
    adjacency.get(current)?.forEach((neighbour) => {
      if (depth.has(neighbour)) return;
      depth.set(neighbour, currentDepth + 1);
      queue.push(neighbour);
    });
  }

  // Disconnected components start a new ring after the connected graph.
  let maxDepth = 0;
  depth.forEach((value) => {
    maxDepth = Math.max(maxDepth, value);
  });
  nodes.forEach((node) => {
    if (!depth.has(node.id)) {
      maxDepth += 1;
      depth.set(node.id, maxDepth);
    }
  });

  const rings = new Map<number, GraphNode[]>();
  nodes.forEach((node) => {
    const level = depth.get(node.id) ?? 0;
    const ring = rings.get(level) ?? [];
    ring.push(node);
    rings.set(level, ring);
  });

  const positions: LayoutPositions = {};
  rings.forEach((ring, level) => {
    const sorted = [...ring].sort((a, b) => a.label.localeCompare(b.label));
    if (level === 0) {
      sorted.forEach((node, index) => {
        positions[node.id] = {
          x: index * (NODE_WIDTH + 36) - ((sorted.length - 1) * (NODE_WIDTH + 36)) / 2,
          y: 0,
        };
      });
      return;
    }
    const radius = Math.max(
      level * 320,
      (sorted.length * (NODE_WIDTH + 28)) / (2 * Math.PI) + 120,
    );
    sorted.forEach((node, index) => {
      const angle = (index / sorted.length) * Math.PI * 2 - Math.PI / 2;
      positions[node.id] = {
        x: Math.cos(angle) * radius - NODE_WIDTH / 2,
        y: Math.sin(angle) * radius - NODE_HEIGHT / 2,
      };
    });
  });

  return positions;
}

/** Manual layout with stored coordinates, falling back to a stable grid. */
function manualPositions(nodes: GraphNode[]): LayoutPositions {
  const positions: LayoutPositions = {};
  const columns = Math.max(1, Math.ceil(Math.sqrt(nodes.length)));
  nodes.forEach((node, index) => {
    const stored = node.metadata?.position;
    if (stored && Number.isFinite(stored.x) && Number.isFinite(stored.y)) {
      positions[node.id] = { x: stored.x, y: stored.y };
      return;
    }
    positions[node.id] = {
      x: (index % columns) * (NODE_WIDTH + 64),
      y: Math.floor(index / columns) * (NODE_HEIGHT + 56),
    };
  });
  return positions;
}

/**
 * Compute node positions for a layout. Pure and deterministic so callers can
 * memoize it and only recompute when nodes, edges, or the layout change.
 */
export function computeLayout(
  nodes: GraphNode[],
  edges: GraphEdge[],
  layout: GraphLayout,
): LayoutPositions {
  switch (layout) {
    case "dagre-lr":
      return dagrePositions(nodes, edges, "LR");
    case "dagre-tb":
      return dagrePositions(nodes, edges, "TB");
    case "radial":
      return radialPositions(nodes, edges);
    case "manual":
    default:
      return manualPositions(nodes);
  }
}
