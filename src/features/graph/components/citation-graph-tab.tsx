import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Network, SearchX, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/shared/empty-state";
import { queryKeys } from "@/lib/query-keys";
import type { GraphLayout } from "@/lib/constants";
import type { GraphNode } from "@/types";
import { graphApi } from "../api";
import { GraphCanvas } from "./graph-canvas";
import { GraphLegend } from "./graph-legend";
import { NodeDetailPanel } from "./node-detail-panel";
import { useGraphFocus } from "../hooks/use-graph-focus";
import { citationNeighborhood, citationTagSet, citationYearRange } from "../lib/citation";
import { filterCitationGraph } from "../lib/filters";

interface CitationGraphTabProps {
  onOpenPaper: (paperId: string) => void;
}

/**
 * Seed-paper citation neighbourhood. Citation links in this demo are mock
 * relationships, so the view says so explicitly rather than implying that
 * references were verified against an external index.
 */
export function CitationGraphTab({ onOpenPaper }: CitationGraphTabProps) {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.citationGraph("universe"),
    queryFn: graphApi.citationUniverse,
  });

  const [seedOverride, setSeedOverride] = useState<string | null>(null);
  const [radius, setRadius] = useState<1 | 2>(1);
  const [yearFrom, setYearFrom] = useState("any");
  const [yearTo, setYearTo] = useState("any");
  const [onlyLibrary, setOnlyLibrary] = useState(false);
  const [tag, setTag] = useState("all");
  const [layout, setLayout] = useState<GraphLayout>("dagre-lr");

  const libraryPapers = useMemo(
    () =>
      (data?.nodes ?? [])
        .filter((node) => node.metadata?.inLibrary !== false)
        .sort((a, b) => a.label.localeCompare(b.label)),
    [data?.nodes],
  );

  const seedId = useMemo(() => {
    if (seedOverride && libraryPapers.some((node) => node.id === seedOverride)) {
      return seedOverride;
    }
    return data?.seedId ?? "";
  }, [seedOverride, libraryPapers, data?.seedId]);

  const seedPaper = useMemo(
    () => (data?.nodes ?? []).find((node) => node.id === seedId) ?? null,
    [data?.nodes, seedId],
  );

  const years = useMemo(() => citationYearRange(data?.nodes ?? []), [data?.nodes]);
  const tags = useMemo(() => citationTagSet(data?.nodes ?? []), [data?.nodes]);

  const neighborhood = useMemo(() => {
    if (!data || !seedId) return { nodes: [], edges: [] };
    const nearby = citationNeighborhood(seedId, data.edges, radius);
    const nodes = data.nodes.filter((node) => nearby.has(node.id));
    return { nodes, edges: data.edges };
  }, [data, seedId, radius]);

  const filtered = useMemo(
    () =>
      filterCitationGraph(neighborhood, seedId, {
        radius,
        yearFrom: yearFrom === "any" ? undefined : Number(yearFrom),
        yearTo: yearTo === "any" ? undefined : Number(yearTo),
        onlyLibrary,
        tags: tag === "all" ? undefined : [tag],
      }),
    [neighborhood, seedId, radius, yearFrom, yearTo, onlyLibrary, tag],
  );

  const filteredIds = useMemo(() => filtered.nodes.map((node) => node.id), [filtered.nodes]);
  const { focusId, setFocus, clearFocus } = useGraphFocus(filteredIds);
  const selectedNode = useMemo(
    () => filtered.nodes.find((node) => node.id === focusId) ?? null,
    [filtered.nodes, focusId],
  );

  const openNode = (node: GraphNode) => {
    if (node.metadata?.inLibrary === false) {
      toast.info("Reference-only paper", {
        description: "This citation is mock reference data and is not part of your library.",
      });
      return;
    }
    const paperId = node.metadata?.artifactId;
    if (!paperId) return;
    onOpenPaper(paperId);
  };

  const resetFilters = () => {
    setRadius(1);
    setYearFrom("any");
    setYearTo("any");
    setOnlyLibrary(false);
    setTag("all");
    clearFocus();
  };

  if (isLoading) {
    return <div className="h-[620px] animate-pulse rounded-xl border border-border bg-card" />;
  }

  if (isError || !data) {
    return (
      <EmptyState
        icon={Network}
        title="Citation graph unavailable"
        description="The local citation index could not be loaded."
        action={
          <Button variant="outline" onClick={() => void refetch()}>
            Try again
          </Button>
        }
      />
    );
  }

  if (libraryPapers.length === 0) {
    return (
      <EmptyState
        icon={SearchX}
        title="Add a paper to see its citation graph"
        description="The citation neighbourhood starts from a paper saved in your library. Add or import a paper first."
      />
    );
  }

  const isFiltered =
    radius !== 1 ||
    yearFrom !== "any" ||
    yearTo !== "any" ||
    onlyLibrary ||
    tag !== "all";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-2 rounded-xl border border-border bg-card p-3 shadow-subtle">
        <div className="min-w-[220px] flex-1 space-y-1">
          <label
            htmlFor="citation-seed"
            className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground"
          >
            Seed paper
          </label>
          <Select value={seedId} onValueChange={setSeedOverride}>
            <SelectTrigger id="citation-seed" className="h-8 w-full text-[12px]" aria-label="Select seed paper">
              <SelectValue placeholder="Choose a paper" />
            </SelectTrigger>
            <SelectContent className="max-w-md">
              {libraryPapers.map((paper) => (
                <SelectItem key={paper.id} value={paper.id}>
                  <span className="line-clamp-1">{paper.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            Radius
          </p>
          <div className="inline-flex rounded-lg border border-border p-0.5">
            {([1, 2] as const).map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={radius === value}
                onClick={() => setRadius(value)}
                className={
                  radius === value
                    ? "rounded-md bg-navy-900 px-2.5 py-1 text-[11px] font-medium text-white dark:bg-teal-500/15 dark:text-teal-200"
                    : "rounded-md px-2.5 py-1 text-[11px] text-muted-foreground hover:bg-muted"
                }
              >
                {value} hop{value === 1 ? "" : "s"}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            Year range
          </p>
          <div className="flex items-center gap-1">
            <Select value={yearFrom} onValueChange={setYearFrom}>
              <SelectTrigger className="h-8 w-[92px] text-[11.5px]" aria-label="From year">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any</SelectItem>
                {years &&
                  Array.from(
                    { length: years.max - years.min + 1 },
                    (_, index) => years.min + index,
                  ).map((year) => (
                    <SelectItem key={year} value={String(year)}>
                      {year}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <span className="text-[10px] text-muted-foreground">to</span>
            <Select value={yearTo} onValueChange={setYearTo}>
              <SelectTrigger className="h-8 w-[92px] text-[11.5px]" aria-label="To year">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any</SelectItem>
                {years &&
                  Array.from(
                    { length: years.max - years.min + 1 },
                    (_, index) => years.min + index,
                  ).map((year) => (
                    <SelectItem key={year} value={String(year)}>
                      {year}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            Topic
          </p>
          <Select value={tag} onValueChange={setTag}>
            <SelectTrigger className="h-8 w-[160px] text-[11.5px]" aria-label="Filter by tag">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-w-xs">
              <SelectItem value="all">All topics</SelectItem>
              {tags.map((value) => (
                <SelectItem key={value} value={value}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <label className="flex h-8 cursor-pointer items-center gap-1.5 self-end rounded-lg border border-border px-2.5 text-[11.5px]">
          <Checkbox
            checked={onlyLibrary}
            onCheckedChange={(checked) => setOnlyLibrary(Boolean(checked))}
            aria-label="Only show papers in my library"
          />
          Only in my library
        </label>

        {isFiltered && (
          <Button variant="ghost" size="sm" className="h-8 text-[11.5px]" onClick={resetFilters}>
            Reset
          </Button>
        )}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <GraphCanvas
          nodes={filtered.nodes}
          edges={filtered.edges}
          layout={layout}
          focusId={focusId}
          onLayoutChange={setLayout}
          onFocusChange={setFocus}
          onNodeClick={openNode}
          legend={<GraphLegend />}
          emptyState={
            <EmptyState
              icon={SearchX}
              title="No citations match those filters"
              description="This seed paper has neighbours, but the year range, topic, or library-only filter hides them all."
              action={
                <Button variant="outline" onClick={resetFilters}>
                  Reset filters
                </Button>
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
          onAction={openNode}
          className="xl:sticky xl:top-24 xl:self-start"
        />
      </div>

      <p className="flex items-start gap-1.5 text-[10.5px] leading-relaxed text-muted-foreground">
        <ShieldAlert className="mt-px size-3 shrink-0" aria-hidden="true" />
        <span>
          Citation links in this demo are mock relationships stored locally. They are not verified
          against an external citation index. {filtered.nodes.length} of{" "}
          {neighborhood.nodes.length} papers shown
          {seedPaper ? ` around “${seedPaper.label}”.` : "."}
        </span>
      </p>
    </div>
  );
}
