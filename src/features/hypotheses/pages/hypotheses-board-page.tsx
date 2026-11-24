import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { Lightbulb, Plus, SearchX } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { queryKeys } from "@/lib/query-keys";
import { hypothesisStatusMeta } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { hypothesesApi } from "../api";
import { evidenceApi } from "@/features/evidence/api";
import { experimentsApi } from "@/features/experiments/api";
import { projectsApi } from "@/features/projects/api";
import { HypothesisCard } from "../components/hypothesis-card";
import { HypothesisModal } from "../components/hypothesis-modal";
import { HypothesisSidePanel } from "../components/hypothesis-side-panel";
import type { Hypothesis, HypothesisStatus } from "@/types";

const columns: { status: HypothesisStatus; description: string }[] = [
  { status: "proposed", description: "Questions worth testing" },
  { status: "testing", description: "Experiments in flight" },
  { status: "supported", description: "Evidence aligns" },
  { status: "refuted", description: "Evidence contradicts" },
];

export function HypothesesBoardPage() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState("all");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Hypothesis | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<HypothesisStatus | null>(null);
  const [pendingPromotion, setPendingPromotion] = useState<{
    hypothesis: Hypothesis;
    status: HypothesisStatus;
  } | null>(null);

  const { data: hypotheses = [], isLoading } = useQuery({
    queryKey: queryKeys.hypotheses,
    queryFn: hypothesesApi.list,
  });
  const { data: evidence = [] } = useQuery({
    queryKey: queryKeys.evidenceAll,
    queryFn: evidenceApi.listAll,
  });
  const { data: experiments = [] } = useQuery({
    queryKey: queryKeys.experiments,
    queryFn: experimentsApi.list,
  });
  const { data: projects = [] } = useQuery({
    queryKey: queryKeys.projects,
    queryFn: projectsApi.list,
  });

  const evidenceCounts = useMemo(() => {
    const counts = new Map<string, { supports: number; contradicts: number }>();
    evidence.forEach((item) => {
      const entry = counts.get(item.hypothesisId) ?? { supports: 0, contradicts: 0 };
      if (item.stance === "supports") entry.supports += 1;
      if (item.stance === "contradicts") entry.contradicts += 1;
      counts.set(item.hypothesisId, entry);
    });
    return counts;
  }, [evidence]);

  const experimentCounts = useMemo(() => {
    const counts = new Map<string, number>();
    experiments.forEach((experiment) => {
      if (!experiment.hypothesisId) return;
      counts.set(experiment.hypothesisId, (counts.get(experiment.hypothesisId) ?? 0) + 1);
    });
    return counts;
  }, [experiments]);

  const projectName = (id: string) =>
    projects.find((project) => project.id === id)?.title ?? "No project";

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return hypotheses.filter((hypothesis) => {
      const matchesSearch =
        !query ||
        hypothesis.statement.toLowerCase().includes(query) ||
        hypothesis.researchQuestion.toLowerCase().includes(query);
      const matchesProject =
        projectFilter === "all" || hypothesis.projectId === projectFilter;
      return matchesSearch && matchesProject;
    });
  }, [hypotheses, search, projectFilter]);

  const byStatus = useMemo(() => {
    const map: Record<HypothesisStatus, Hypothesis[]> = {
      proposed: [],
      testing: [],
      supported: [],
      refuted: [],
    };
    filtered.forEach((hypothesis) => map[hypothesis.status].push(hypothesis));
    return map;
  }, [filtered]);

  const focusId = searchParams.get("focus");
  const selected = hypotheses.find((hypothesis) => hypothesis.id === focusId) ?? null;

  const openPanel = (id: string) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.set("focus", id);
      return next;
    });
  };

  const closePanel = (open: boolean) => {
    if (open) return;
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.delete("focus");
      return next;
    });
  };

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.hypotheses });
    queryClient.invalidateQueries({ queryKey: queryKeys.evidenceAll });
    queryClient.invalidateQueries({ queryKey: queryKeys.experiments });
    queryClient.invalidateQueries({ queryKey: queryKeys.graph });
    queryClient.invalidateQueries({ queryKey: queryKeys.activity });
    queryClient.invalidateQueries({ queryKey: queryKeys.feed });
    queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
  };

  const statusMutation = useMutation({
    mutationFn: ({ hypothesis, status }: { hypothesis: Hypothesis; status: HypothesisStatus }) =>
      hypothesesApi.setStatus(hypothesis.id, status),
    onSuccess: (result, variables) => {
      invalidate();
      toast.success(`Moved to ${hypothesisStatusMeta[variables.status].label}`, {
        description: `“${result.statement}” is now ${result.status}.`,
      });
      setPendingPromotion(null);
    },
    onError: (error: Error) => {
      toast.error("Could not change status", { description: error.message });
    },
  });

  const requestStatus = (hypothesis: Hypothesis, status: HypothesisStatus) => {
    if (hypothesis.status === status) return;
    if (status === "supported" || status === "refuted") {
      setPendingPromotion({ hypothesis, status });
      return;
    }
    statusMutation.mutate({ hypothesis, status });
  };

  const handleDrop = (status: HypothesisStatus) => {
    setDragOver(null);
    const hypothesis = hypotheses.find((item) => item.id === draggingId);
    setDraggingId(null);
    if (!hypothesis) return;
    requestStatus(hypothesis, status);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Scientific reasoning"
        title="Hypotheses"
        description="Move hypotheses through proposed, testing, supported, and refuted as evidence accumulates."
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus className="size-4" />
            New hypothesis
          </Button>
        }
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search hypotheses…"
          ariaLabel="Search hypotheses"
          className="sm:w-64"
        />
        <Select value={projectFilter} onValueChange={setProjectFilter}>
          <SelectTrigger className="w-full sm:w-52" aria-label="Filter hypotheses by project">
            <SelectValue placeholder="All projects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All projects</SelectItem>
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-[12px] text-muted-foreground sm:ml-auto">
          Drag a card between columns, or use its menu to move it.
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" aria-busy="true" aria-label="Loading hypotheses">
          {columns.map((column) => (
            <div key={column.status} className="h-64 animate-pulse rounded-xl border border-border bg-muted/40" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={hypotheses.length === 0 ? Lightbulb : SearchX}
          title={hypotheses.length === 0 ? "No hypotheses yet" : "No hypotheses match these filters"}
          description={
            hypotheses.length === 0
              ? "Write the first research question and prediction, then attach evidence as your experiments report results."
              : "Adjust the search or project filter to see more hypotheses."
          }
          action={
            hypotheses.length === 0 ? (
              <Button onClick={() => setCreating(true)}>
                <Plus className="size-4" />
                New hypothesis
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => {
                  setSearch("");
                  setProjectFilter("all");
                }}
              >
                Reset filters
              </Button>
            )
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {columns.map((column) => {
            const items = byStatus[column.status];
            return (
              <section
                key={column.status}
                aria-label={`${hypothesisStatusMeta[column.status].label} hypotheses`}
                onDragOver={(event) => {
                  event.preventDefault();
                  event.dataTransfer.dropEffect = "move";
                  setDragOver(column.status);
                }}
                onDragLeave={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget as Node)) {
                    setDragOver(null);
                  }
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  handleDrop(column.status);
                }}
                className={cn(
                  "flex min-h-[18rem] flex-col rounded-xl border border-border bg-muted/25 p-2.5 transition-colors",
                  dragOver === column.status && "border-teal-500/60 bg-teal-50/50 dark:bg-teal-500/5",
                )}
              >
                <header className="mb-2 flex items-center justify-between gap-2 px-1">
                  <div>
                    <h2 className="text-[13px] font-semibold">
                      {hypothesisStatusMeta[column.status].label}
                    </h2>
                    <p className="text-[11px] text-muted-foreground">{column.description}</p>
                  </div>
                  <Badge variant="outline" className="tabular-nums">
                    {items.length}
                  </Badge>
                </header>

                <div className="space-y-2">
                  {items.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-[11.5px] text-muted-foreground">
                      Drop a hypothesis here
                    </p>
                  ) : (
                    items.map((hypothesis) => {
                      const counts = evidenceCounts.get(hypothesis.id);
                      return (
                        <HypothesisCard
                          key={hypothesis.id}
                          hypothesis={hypothesis}
                          projectName={projectName(hypothesis.projectId)}
                          supports={counts?.supports ?? 0}
                          contradicts={counts?.contradicts ?? 0}
                          experimentCount={experimentCounts.get(hypothesis.id) ?? 0}
                          onOpen={() => openPanel(hypothesis.id)}
                          onEdit={() => setEditing(hypothesis)}
                          onMove={(status) => requestStatus(hypothesis, status)}
                          onDragStart={() => setDraggingId(hypothesis.id)}
                          onDragEnd={() => {
                            setDraggingId(null);
                            setDragOver(null);
                          }}
                          dragging={draggingId === hypothesis.id}
                        />
                      );
                    })
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}

      <HypothesisModal
        open={creating}
        onOpenChange={setCreating}
        defaultProjectId={projectFilter === "all" ? undefined : projectFilter}
      />
      <HypothesisModal
        open={Boolean(editing)}
        onOpenChange={(open) => !open && setEditing(null)}
        hypothesis={editing}
      />

      <HypothesisSidePanel
        hypothesis={selected}
        open={Boolean(selected)}
        onOpenChange={closePanel}
        onStatusChange={(status) => {
          if (selected) requestStatus(selected, status);
        }}
      />

      <ConfirmDialog
        open={Boolean(pendingPromotion)}
        onOpenChange={(open) => !open && setPendingPromotion(null)}
        title={
          pendingPromotion?.status === "supported"
            ? "Promote to Supported?"
            : "Promote to Refuted?"
        }
        description={
          pendingPromotion
            ? `“${pendingPromotion.hypothesis.statement}” will move to the ${pendingPromotion.status} column. This is a final status and will be recorded in the activity feed.`
            : ""
        }
        confirmLabel={
          pendingPromotion?.status === "supported" ? "Mark supported" : "Mark refuted"
        }
        destructive={pendingPromotion?.status === "refuted"}
        onConfirm={async () => {
          if (pendingPromotion) await statusMutation.mutateAsync(pendingPromotion);
        }}
      />

      <p className="sr-only" role="status">
        {draggingId ? "Dragging a hypothesis. Drop it on a column to change its status." : ""}
      </p>
    </div>
  );
}
