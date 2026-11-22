import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { Network, SearchX, Share2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { queryKeys } from "@/lib/query-keys";
import { graphNodeTypes, type GraphLayout } from "@/lib/constants";
import type { GraphNode, GraphNodeType } from "@/types";
import { graphApi } from "../api";
import { GraphCanvas } from "../components/graph-canvas";
import { GraphFilters } from "../components/graph-filters";
import { GraphLegend } from "../components/graph-legend";
import { NodeDetailPanel } from "../components/node-detail-panel";
import { useGraphFocus } from "../hooks/use-graph-focus";
import { collectStatuses, filterGraph } from "../lib/filters";
import { filterValidEdges } from "../lib/validation";

const EMPTY_MESSAGE =
  "Link artifacts from any notebook or paper to start building your knowledge graph.";

export function KnowledgeGraphPage() {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.knowledgeGraph,
    queryFn: graphApi.knowledge,
  });

  const [layout, setLayout] = useState<GraphLayout>("dagre-lr");
  const [selectedTypes, setSelectedTypes] = useState<GraphNodeType[]>(graphNodeTypes);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [showRuns, setShowRuns] = useState(true);
  const [search, setSearch] = useState("");
  const [projectId, setProjectId] = useState("all");

  const projects = useMemo(
    () =>
      (data?.nodes ?? [])
        .filter((node) => node.type === "project")
        .map((node) => ({ id: node.metadata?.projectId ?? node.id, label: node.label })),
    [data?.nodes],
  );

  const scoped = useMemo(() => {
    if (!data) return { nodes: [], edges: [] };
    if (projectId === "all") return data;
    const ids = new Set(
      data.nodes
        .filter(
          (node) =>
            node.id === `project:${projectId}` || node.metadata?.projectId === projectId,
        )
        .map((node) => node.id),
    );
    const nodes = data.nodes.filter((node) => ids.has(node.id));
    return { nodes, edges: filterValidEdges(nodes, data.edges) };
  }, [data, projectId]);

  const statuses = useMemo(() => collectStatuses(scoped.nodes), [scoped.nodes]);

  const filtered = useMemo(
    () =>
      filterGraph(scoped, {
        nodeTypes: selectedTypes,
        statuses: selectedStatuses,
        showRuns,
        search,
      }),
    [scoped, selectedTypes, selectedStatuses, showRuns, search],
  );

  const filteredIds = useMemo(() => filtered.nodes.map((node) => node.id), [filtered.nodes]);
  const { focusId, setFocus, clearFocus } = useGraphFocus(filteredIds);
  const selectedNode = useMemo(
    () => filtered.nodes.find((node) => node.id === focusId) ?? null,
    [filtered.nodes, focusId],
  );

  const toggleType = (type: GraphNodeType) => {
    setSelectedTypes((current) =>
      current.includes(type) ? current.filter((item) => item !== type) : [...current, type],
    );
  };
  const toggleStatus = (status: string) => {
    setSelectedStatuses((current) =>
      current.includes(status) ? current.filter((item) => item !== status) : [...current, status],
    );
  };
  const resetFilters = () => {
    setSelectedTypes(graphNodeTypes);
    setSelectedStatuses([]);
    setShowRuns(true);
    setSearch("");
    setProjectId("all");
    clearFocus();
  };

  const openArtifact = (node: GraphNode) => {
    if (!node.metadata?.href) return;
    navigate(node.metadata.href);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-24 animate-pulse rounded-xl border border-border bg-card" />
        <div className="h-[620px] animate-pulse rounded-xl border border-border bg-card" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <EmptyState
        icon={Network}
        title="Knowledge graph unavailable"
        description="The local workspace graph could not be loaded. Refresh the page to try again."
        action={
          <Button asChild>
            <Link to="/app">Back to overview</Link>
          </Button>
        }
      />
    );
  }

  if (data.empty) {
    return (
      <div className="space-y-4">
        <PageHeader
          eyebrow="Insights"
          title="Knowledge graph"
          description="Follow links between notebooks, papers, datasets, hypotheses, and decisions across the workspace."
        />
        <EmptyState
          icon={Share2}
          title="No links yet"
          description={EMPTY_MESSAGE}
          action={
            <Button asChild>
              <Link to="/app/notebooks">Open notebooks</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const hasFilters =
    projectId !== "all" ||
    search.trim().length > 0 ||
    selectedStatuses.length > 0 ||
    selectedTypes.length !== graphNodeTypes.length;

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Insights"
        title="Knowledge graph"
        description="Follow links between notebooks, papers, datasets, hypotheses, and decisions across the workspace."
        actions={
          <Select value={projectId} onValueChange={setProjectId}>
            <SelectTrigger className="h-9 w-auto min-w-[190px] text-[12px]" aria-label="Filter knowledge graph by project">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All projects</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <GraphCanvas
          nodes={filtered.nodes}
          edges={filtered.edges}
          layout={layout}
          focusId={focusId}
          onLayoutChange={setLayout}
          onFocusChange={setFocus}
          filters={
            <GraphFilters
              selectedTypes={selectedTypes}
              onToggleType={toggleType}
              statuses={statuses}
              selectedStatuses={selectedStatuses}
              onToggleStatus={toggleStatus}
              showRuns={showRuns}
              onShowRunsChange={setShowRuns}
              search={search}
              onSearchChange={setSearch}
              onClear={resetFilters}
            />
          }
          legend={<GraphLegend />}
          emptyState={
            <EmptyState
              icon={SearchX}
              title="No linked artifacts match those filters"
              description={
                hasFilters
                  ? "Try another project, node type, or search term to bring the graph back."
                  : EMPTY_MESSAGE
              }
              action={
                hasFilters ? (
                  <Button variant="outline" onClick={resetFilters}>
                    Reset filters
                  </Button>
                ) : undefined
              }
            />
          }
        />
        <NodeDetailPanel
          node={selectedNode}
          nodes={filtered.nodes}
          edges={filtered.edges}
          onClose={clearFocus}
          onSelect={setFocus}
          onAction={(node) => {
            toast.info("Artifact module hand-off", {
              description: `${node.label} will open in its workspace in a later phase.`,
            });
          }}
          className="xl:sticky xl:top-24 xl:self-start"
        />
      </div>

      <p className="text-[10.5px] text-muted-foreground">
        {filtered.nodes.length} of {data.nodes.length} linked artifacts shown. Relationships come
        from explicit artifact links in this local demo workspace.
        {selectedNode && (
          <button
            type="button"
            onClick={() => openArtifact(selectedNode)}
            className="ml-1 font-medium text-teal-700 hover:underline dark:text-teal-300"
          >
            Open {selectedNode.label}
          </button>
        )}
      </p>
    </div>
  );
}
