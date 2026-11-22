import type { GraphEdge, GraphNode } from "@/types";
import type { GraphLayout } from "@/lib/constants";

export type { GraphLayout };

export interface GraphView {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface GraphFilters {
  nodeTypes?: GraphNode["type"][];
  statuses?: string[];
  showRuns?: boolean;
  search?: string;
}

export interface CitationFilters {
  radius: 1 | 2;
  yearFrom?: number;
  yearTo?: number;
  onlyLibrary: boolean;
  tags?: string[];
}

export interface ProjectGraphPayload extends GraphView {
  projectId: string;
  projectTitle: string;
}

export interface KnowledgeGraphPayload extends GraphView {
  /** True when the workspace has no linkable artifacts at all. */
  empty: boolean;
}

export interface CitationGraphPayload extends GraphView {
  /** Normalized node id of the seed paper. */
  seedId: string;
  seedPaper: GraphNode | null;
}

export interface GraphValidationIssue {
  edgeId?: string;
  nodeId?: string;
  message: string;
}

export interface GraphValidationResult {
  valid: boolean;
  issues: GraphValidationIssue[];
}
