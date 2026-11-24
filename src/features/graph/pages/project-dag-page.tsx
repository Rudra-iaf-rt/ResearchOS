import { useCallback, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toSvg } from "html-to-image";
import {
  ArrowLeft,
  Camera,
  Download,
  Loader2,
  Network,
  RotateCcw,
  SearchX,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { queryKeys } from "@/lib/query-keys";
import { graphNodeTypes, graphNodeTypeMeta, type GraphLayout } from "@/lib/constants";
import type { GraphNode, GraphNodeType } from "@/types";
import { graphApi } from "../api";
import { GraphCanvas } from "../components/graph-canvas";
import { GraphFilters } from "../components/graph-filters";
import { GraphLegend } from "../components/graph-legend";
import { NodeDetailPanel } from "../components/node-detail-panel";
import { useGraphFocus } from "../hooks/use-graph-focus";
import { collectStatuses, filterGraph } from "../lib/filters";

export function ProjectDAGPage() {
  const { projectId = "" } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.projectGraph(projectId),
    queryFn: () => graphApi.project(projectId),
    enabled: Boolean(projectId),
  });

  const [layout, setLayout] = useState<GraphLayout>("dagre-lr");
  const [selectedTypes, setSelectedTypes] = useState<GraphNodeType[]>(graphNodeTypes);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [showRuns, setShowRuns] = useState(true);
  const [search, setSearch] = useState("");
  const [snapshotOpen, setSnapshotOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const graphRef = useRef<HTMLDivElement>(null);
  const snapshotButtonRef = useRef<HTMLButtonElement>(null);

  const statuses = useMemo(() => collectStatuses(data?.nodes ?? []), [data?.nodes]);

  const filtered = useMemo(() => {
    if (!data) return { nodes: [], edges: [] };
    return filterGraph(data, {
      nodeTypes: selectedTypes,
      statuses: selectedStatuses,
      showRuns,
      search,
    });
  }, [data, selectedTypes, selectedStatuses, showRuns, search]);

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
    clearFocus();
  };

  const handleNodeAction = useCallback(
    (node: GraphNode) => {
      const href = node.metadata?.href;
      if (!href) {
        toast.info("This node has no linked record yet", {
          description: `“${node.label}” is shown for context but does not open a workspace record.`,
        });
        return;
      }
      navigate(href);
    },
    [navigate],
  );

  const exportPng = useCallback(async () => {
    const element = graphRef.current;
    if (!element) return;
    setExporting(true);
    try {
      const backgroundColor = getComputedStyle(element).backgroundColor || "#ffffff";
      const svgUrl = await toSvg(element, {
        cacheBust: true,
        skipFonts: true,
        backgroundColor,
        filter: (node) =>
          !(
            node instanceof HTMLElement &&
            (node.classList.contains("react-flow__minimap") ||
              node.classList.contains("react-flow__attribution"))
          ),
      });
      // Load the SVG ourselves rather than using toPng(): html-to-image's image
      // loader waits on requestAnimationFrame, which never fires in some
      // occluded or backgrounded windows. onload is enough to draw it.
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const next = new Image();
        next.crossOrigin = "anonymous";
        next.onload = () => resolve(next);
        next.onerror = () =>
          reject(new Error("The graph preview could not be rendered as an image."));
        next.src = svgUrl;
      });
      const ratio = 2;
      const width = image.naturalWidth || element.offsetWidth;
      const height = image.naturalHeight || element.offsetHeight;
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(width * ratio));
      canvas.height = Math.max(1, Math.round(height * ratio));
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas rendering is unavailable in this browser.");
      context.fillStyle = backgroundColor;
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `${(data?.projectTitle ?? "project").toLowerCase().replace(/[^a-z0-9]+/g, "-")}-graph.png`;
      link.click();
      toast.success("Graph exported", { description: "A PNG snapshot was downloaded." });
    } catch (error) {
      toast.error("Could not export the graph", {
        description:
          error instanceof Error ? error.message : "Try again once the canvas has finished rendering.",
      });
    } finally {
      setExporting(false);
    }
  }, [data?.projectTitle]);

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
        title="Project graph not found"
        description="This project may have been deleted, or the link is out of date."
        action={
          <Button asChild>
            <Link to="/app/projects">Back to projects</Link>
          </Button>
        }
      />
    );
  }

  const counts = data.nodes.reduce<Record<string, number>>((acc, node) => {
    acc[node.type] = (acc[node.type] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="ghost" size="sm" asChild className="-ml-2 gap-1.5">
          <Link to={`/app/projects/${data.projectId}`}>
            <ArrowLeft className="size-3.5" /> Back to project
          </Link>
        </Button>
        <span className="text-muted-foreground/40" aria-hidden="true">
          /
        </span>
        <span className="text-[11.5px] font-medium text-muted-foreground">Research graph</span>
      </div>

      <PageHeader
        eyebrow="Project DAG"
        title={data.projectTitle}
        description="Hypotheses feed experiments, experiments produce runs, and runs resolve conclusions. Select a node to inspect linked artifacts."
        actions={
          <>
            <Button
              ref={snapshotButtonRef}
              variant="outline"
              onClick={() => setSnapshotOpen(true)}
            >
              <Camera className="size-4" /> Save snapshot
            </Button>
            <Button variant="outline" onClick={() => void exportPng()} disabled={exporting}>
              {exporting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Download className="size-4" />
              )}
              Export PNG
            </Button>
            <Button variant="outline" onClick={resetFilters}>
              <RotateCcw className="size-4" /> Reset
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-1.5">
        {graphNodeTypes
          .filter((type) => counts[type])
          .map((type) => (
            <span
              key={type}
              className="rounded-full border border-border bg-card px-2 py-0.5 text-[10.5px] text-muted-foreground"
            >
              {counts[type]}{" "}
              {(counts[type] === 1
                ? graphNodeTypeMeta[type].label
                : graphNodeTypeMeta[type].plural
              ).toLowerCase()}
            </span>
          ))}
        <span className="text-[10.5px] text-muted-foreground">
          Selected: {selectedNode ? selectedNode.label : "none"}
        </span>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div ref={graphRef}>
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
                title="No nodes match those filters"
                description="Adjust the node types, statuses, or search to bring the graph back."
                action={<Button variant="outline" onClick={resetFilters}>Reset filters</Button>}
              />
            }
          />
        </div>
        <NodeDetailPanel
          node={selectedNode}
          nodes={filtered.nodes}
          edges={filtered.edges}
          onClose={clearFocus}
          onSelect={setFocus}
          onAction={handleNodeAction}
          className="xl:sticky xl:top-24 xl:self-start"
        />
      </div>

      <p className="text-[10.5px] text-muted-foreground">
        Selecting a node updates <code className="rounded bg-muted px-1">?focus=</code> so the view
        can be shared or reloaded. {filtered.nodes.length} of {data.nodes.length} nodes shown.
      </p>

      <Dialog
        open={snapshotOpen}
        onOpenChange={(open) => {
          setSnapshotOpen(open);
          if (!open) {
            // Radix restores focus to whichever overlay was focused last; put it
            // back on the trigger that opened this dialog instead.
            window.setTimeout(() => snapshotButtonRef.current?.focus(), 0);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Save graph snapshot</DialogTitle>
            <DialogDescription>
              Research snapshots capture project manifests, not graph images. Export a real PNG of
              the current graph to share it, or create a research snapshot from the Snapshots page.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSnapshotOpen(false)}>
              Close
            </Button>
            <Button
              onClick={() => {
                setSnapshotOpen(false);
                void exportPng();
              }}
            >
              <Download className="size-4" /> Export PNG instead
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
