import type {
  CitationLink,
  GraphEdge,
  GraphNode,
  Paper,
  ResearchDatabase,
  ResearchFile,
} from "@/types";
import { readDb } from "@/services/mock/client";
import { filterValidEdges, validateGraph } from "./lib/validation";
import { citationNeighborhood } from "./lib/citation";
import type {
  CitationGraphPayload,
  GraphView,
  KnowledgeGraphPayload,
  ProjectGraphPayload,
} from "./types";

const typeOrder: Record<GraphNode["type"], number> = {
  project: 0,
  hypothesis: 1,
  experiment: 2,
  run: 3,
  decision: 4,
  notebook: 5,
  paper: 6,
  dataset: 7,
};

function sortNodes(nodes: GraphNode[]): GraphNode[] {
  return [...nodes].sort((a, b) => {
    const byType = typeOrder[a.type] - typeOrder[b.type];
    if (byType !== 0) return byType;
    return a.label.localeCompare(b.label);
  });
}

function paperNode(paper: Paper): GraphNode {
  return {
    id: `paper:${paper.id}`,
    type: "paper",
    label: paper.title,
    status: paper.readStatus,
    metadata: {
      projectId: paper.projectId,
      artifactType: "paper",
      artifactId: paper.id,
      href: `/app/library?paper=${paper.id}`,
      inLibrary: true,
      year: paper.year,
      journal: paper.journal,
      authors: paper.authors,
      tags: paper.tags,
      description: paper.abstract,
    },
  };
}

function fileNode(file: ResearchFile): GraphNode {
  return {
    id: `dataset:${file.id}`,
    type: "dataset",
    label: file.name,
    status: file.kind,
    metadata: {
      projectId: file.projectId,
      artifactType: "file",
      artifactId: file.id,
      href: `/app/files?file=${file.id}`,
      tags: [file.kind],
      description: file.description,
      metrics: [{ label: "Size", value: `${Math.round(file.size / 1024)} KB` }],
    },
  };
}

/** Artifact nodes derived from the rest of the workspace. */
function artifactNodes(db: ResearchDatabase): GraphNode[] {
  const nodes: GraphNode[] = [];
  db.projects.forEach((project) => {
    nodes.push({
      id: `project:${project.id}`,
      type: "project",
      label: project.title,
      status: project.status,
      metadata: {
        projectId: project.id,
        artifactType: "project",
        artifactId: project.id,
        href: `/app/projects/${project.id}`,
        owner: project.owner.name,
        description: project.description,
        date: project.updatedAt,
        tags: project.tags,
        metrics: [
          { label: "Progress", value: `${project.progress}%` },
          { label: "Members", value: String(project.members.length) },
        ],
      },
    });
  });
  db.papers.forEach((paper) => nodes.push(paperNode(paper)));
  db.notebooks.forEach((notebook) => {
    nodes.push({
      id: `notebook:${notebook.id}`,
      type: "notebook",
      label: notebook.title,
      status: notebook.favorite ? "favorite" : "active",
      metadata: {
        projectId: notebook.projectId,
        artifactType: "notebook",
        artifactId: notebook.id,
        href: `/app/notebooks/${notebook.id}`,
        owner: notebook.author.name,
        description: notebook.description,
        date: notebook.updatedAt,
        tags: notebook.tags,
        metrics: [{ label: "Entries", value: String(notebook.entries.length) }],
      },
    });
  });
  db.files.forEach((file) => nodes.push(fileNode(file)));
  return nodes;
}

function materialize(db: ResearchDatabase): GraphView {
  const byId = new Map<string, GraphNode>();
  artifactNodes(db).forEach((node) => byId.set(node.id, node));
  (db.graphNodes ?? []).forEach((node) => {
    if (!byId.has(node.id)) byId.set(node.id, node);
  });
  const nodes = sortNodes(Array.from(byId.values()));
  const edges = filterValidEdges(nodes, db.graphEdges ?? []);
  return { nodes, edges };
}

function normalizePaperId(id: string, paperIds: Set<string>, graphIds: Set<string>): string {
  if (id.startsWith("paper:")) return id;
  if (graphIds.has(id)) return id;
  if (paperIds.has(id)) return `paper:${id}`;
  if (graphIds.has(`paper:${id}`)) return `paper:${id}`;
  return id;
}

function citationUniverse(db: ResearchDatabase): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const nodes = materialize(db).nodes.filter((node) => node.type === "paper");
  const nodeIds = new Set(nodes.map((node) => node.id));
  const paperIds = new Set(db.papers.map((paper) => paper.id));
  const graphIds = new Set((db.graphNodes ?? []).map((node) => node.id));

  const edges: GraphEdge[] = [];
  const seen = new Set<string>();
  const addEdge = (edge: GraphEdge) => {
    const key = `${edge.from}->${edge.to}`;
    if (seen.has(key) || edge.from === edge.to) return;
    if (!nodeIds.has(edge.from) || !nodeIds.has(edge.to)) return;
    seen.add(key);
    edges.push(edge);
  };

  (db.citations ?? []).forEach((citation: CitationLink) => {
    addEdge({
      id: citation.id,
      from: normalizePaperId(citation.from, paperIds, graphIds),
      to: normalizePaperId(citation.to, paperIds, graphIds),
      type: "cites",
    });
  });
  (db.graphEdges ?? [])
    .filter((edge) => edge.type === "cites")
    .forEach((edge) => addEdge(edge));

  return { nodes: sortNodes(nodes), edges };
}

export const graphApi = {
  /** Hypothesis → experiment → run DAG for one project. */
  async project(projectId: string): Promise<ProjectGraphPayload> {
    return readDb((db) => {
      const project = db.projects.find((item) => item.id === projectId);
      if (!project) throw new Error("Project not found");

      const all = materialize(db);
      const included = new Set<string>([`project:${projectId}`]);
      all.nodes.forEach((node) => {
        if (node.metadata?.projectId === projectId) included.add(node.id);
      });

      // Pull in one hop of linked artifacts so papers and datasets referenced
      // by this project's nodes are visible too.
      all.edges.forEach((edge) => {
        if (included.has(edge.from) || included.has(edge.to)) {
          if (included.has(edge.from) && edge.to.startsWith("paper:")) included.add(edge.to);
          if (included.has(edge.to) && edge.from.startsWith("paper:")) included.add(edge.from);
        }
      });

      const nodes = all.nodes.filter((node) => included.has(node.id));
      return {
        projectId,
        projectTitle: project.title,
        nodes,
        edges: filterValidEdges(nodes, all.edges),
      };
    });
  },

  /** Cross-artifact knowledge graph built from `links` relationships. */
  async knowledge(): Promise<KnowledgeGraphPayload> {
    return readDb((db) => {
      const all = materialize(db);
      const linkedIds = new Set<string>();
      all.edges
        .filter((edge) => edge.type === "links")
        .forEach((edge) => {
          linkedIds.add(edge.from);
          linkedIds.add(edge.to);
        });

      if (linkedIds.size === 0) {
        return { nodes: [], edges: [], empty: true };
      }

      const allowedTypes = new Set<GraphNode["type"]>([
        "project",
        "notebook",
        "paper",
        "dataset",
        "hypothesis",
        "decision",
      ]);
      const included = new Set<string>();
      all.nodes.forEach((node) => {
        if (linkedIds.has(node.id) && allowedTypes.has(node.type)) included.add(node.id);
      });

      // Include the owning project node for linked artifacts, so project
      // filters can group the graph even before a project-level edge exists.
      const projectIds = new Set<string>();
      all.nodes.forEach((node) => {
        if (!included.has(node.id)) return;
        if (node.metadata?.projectId) projectIds.add(node.metadata.projectId);
      });
      projectIds.forEach((id) => {
        if (all.nodes.some((node) => node.id === `project:${id}`)) included.add(`project:${id}`);
      });

      const nodes = all.nodes.filter((node) => included.has(node.id));
      const edges = filterValidEdges(nodes, all.edges);
      return { nodes, edges, empty: nodes.length === 0 };
    });
  },

  /** Full citation universe for a seed paper, including mock external refs. */
  async citations(seedId: string, radius: 1 | 2 = 1): Promise<CitationGraphPayload> {
    return readDb((db) => {
      const universe = citationUniverse(db);
      const normalizedSeed = normalizePaperId(
        seedId,
        new Set(db.papers.map((paper) => paper.id)),
        new Set((db.graphNodes ?? []).map((node) => node.id)),
      );
      const seedPaper = universe.nodes.find((node) => node.id === normalizedSeed) ?? null;
      if (!seedPaper) throw new Error("Seed paper not found");

      const nearby = citationNeighborhood(
        normalizedSeed,
        universe.edges,
        radius,
      );
      const nodes = universe.nodes.filter((node) => nearby.has(node.id));
      return {
        seedId: normalizedSeed,
        seedPaper,
        nodes,
        edges: filterValidEdges(nodes, universe.edges),
      };
    });
  },

  /** Raw universe plus edge list, used by the library tab for local filters. */
  async citationUniverse(): Promise<CitationGraphPayload> {
    return readDb((db) => {
      const universe = citationUniverse(db);
      const seedPaper =
        universe.nodes.find((node) => node.metadata?.inLibrary !== false) ?? universe.nodes[0] ?? null;
      return {
        seedId: seedPaper?.id ?? "",
        seedPaper,
        nodes: universe.nodes,
        edges: universe.edges,
      };
    });
  },

  /** Structural validation used by tests and guards. */
  async validate(): Promise<ReturnType<typeof validateGraph>> {
    return readDb((db) => {
      const view = materialize(db);
      return validateGraph(view.nodes, view.edges);
    });
  },
};

export type { GraphView };
