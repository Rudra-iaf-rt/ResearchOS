import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { FolderKanban, Plus, Scale } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { queryKeys } from "@/lib/query-keys";
import { decisionStatusMeta } from "@/lib/constants";
import { decisionsApi } from "../api";
import { projectsApi } from "@/features/projects/api";
import { DecisionCard } from "../components/decision-card";
import { DecisionModal } from "../components/decision-modal";
import { DecisionDetailPanel } from "../components/decision-detail-panel";
import type { DecisionStatus, ResearchDecision } from "@/types";

export function DecisionsPage() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<ResearchDecision | null>(null);

  const { data: decisions = [], isLoading } = useQuery({
    queryKey: queryKeys.decisions,
    queryFn: decisionsApi.list,
  });
  const { data: projects = [] } = useQuery({
    queryKey: queryKeys.projects,
    queryFn: projectsApi.list,
  });

  const projectById = useMemo(
    () => new Map(projects.map((project) => [project.id, project])),
    [projects],
  );

  const groups = useMemo(() => {
    const byProject = new Map<string, ResearchDecision[]>();
    decisions.forEach((decision) => {
      const list = byProject.get(decision.projectId) ?? [];
      list.push(decision);
      byProject.set(decision.projectId, list);
    });
    return Array.from(byProject.entries())
      .map(([projectId, items]) => ({
        projectId,
        project: projectById.get(projectId),
        items: items.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      }))
      .sort((a, b) => (a.project?.title ?? "").localeCompare(b.project?.title ?? ""));
  }, [decisions, projectById]);

  const focusId = searchParams.get("focus");
  const selected = decisions.find((decision) => decision.id === focusId) ?? null;

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
    queryClient.invalidateQueries({ queryKey: queryKeys.decisions });
    queryClient.invalidateQueries({ queryKey: queryKeys.graph });
    queryClient.invalidateQueries({ queryKey: queryKeys.activity });
    queryClient.invalidateQueries({ queryKey: queryKeys.feed });
    queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
  };

  const statusMutation = useMutation({
    mutationFn: ({ decision, status }: { decision: ResearchDecision; status: DecisionStatus }) =>
      decisionsApi.setStatus(decision.id, status),
    onSuccess: (result) => {
      invalidate();
      toast.success("Decision status updated", {
        description: `“${result.title}” is now ${decisionStatusMeta[result.status].label.toLowerCase()}.`,
      });
    },
    onError: (error: Error) => {
      toast.error("Could not update decision", { description: error.message });
    },
  });

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Scientific reasoning"
        title="Research decisions"
        description="Architecture-decision-style records: the context, the choice, the rejected alternatives, and the artifacts that justify it."
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus className="size-4" />
            New decision
          </Button>
        }
      />

      {isLoading ? (
        <div className="space-y-4" aria-busy="true" aria-label="Loading decisions">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="h-48 animate-pulse rounded-xl border border-border bg-muted/40" />
          ))}
        </div>
      ) : decisions.length === 0 ? (
        <EmptyState
          icon={Scale}
          title="No decisions recorded yet"
          description="Capture the reasoning behind a methodological or analytical choice so it stays reviewable later."
          action={
            <Button onClick={() => setCreating(true)}>
              <Plus className="size-4" />
              New decision
            </Button>
          }
        />
      ) : (
        <div className="space-y-7">
          {groups.map((group) => (
            <section key={group.projectId} className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <FolderKanban className="size-4 text-muted-foreground" aria-hidden="true" />
                {group.project ? (
                  <Link
                    to={`/app/projects/${group.project.id}`}
                    className="text-[14px] font-semibold hover:text-teal-700 dark:hover:text-teal-300"
                  >
                    {group.project.title}
                  </Link>
                ) : (
                  <span className="text-[14px] font-semibold">Unknown project</span>
                )}
                <Badge variant="outline">
                  {group.items.length} decision{group.items.length === 1 ? "" : "s"}
                </Badge>
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {group.items.map((decision) => (
                  <DecisionCard
                    key={decision.id}
                    decision={decision}
                    projectName={group.project?.title ?? "Unknown project"}
                    onOpen={() => openPanel(decision.id)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <DecisionModal open={creating} onOpenChange={setCreating} />
      <DecisionModal
        open={Boolean(editing)}
        onOpenChange={(open) => !open && setEditing(null)}
        decision={editing}
      />

      <DecisionDetailPanel
        decision={selected}
        projectName={
          selected ? projectById.get(selected.projectId)?.title ?? "Unknown project" : ""
        }
        open={Boolean(selected)}
        onOpenChange={closePanel}
        onEdit={() => {
          if (selected) {
            setEditing(selected);
            closePanel(false);
          }
        }}
        onStatusChange={(status) => {
          if (selected) statusMutation.mutate({ decision: selected, status });
        }}
      />
    </div>
  );
}
