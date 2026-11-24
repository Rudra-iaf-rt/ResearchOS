import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  CheckCircle2,
  ExternalLink,
  FlaskConical,
  Lightbulb,
  MessageSquarePlus,
  MessageSquareX,
  Plus,
  Trash2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { HypothesisStatusBadge } from "@/components/shared/status-badge";
import { formatDate } from "@/lib/format";
import { queryKeys } from "@/lib/query-keys";
import { artifactHref } from "@/features/artifacts/lib";
import { evidenceApi } from "@/features/evidence/api";
import { experimentsApi } from "@/features/experiments/api";
import { projectsApi } from "@/features/projects/api";
import { EvidenceForm } from "./evidence-form";
import type { Hypothesis, HypothesisEvidence, HypothesisStatus } from "@/types";

interface HypothesisSidePanelProps {
  hypothesis: Hypothesis | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange: (status: HypothesisStatus) => void;
}

function EvidenceList({
  title,
  items,
  onRemove,
}: {
  title: string;
  items: HypothesisEvidence[];
  onRemove: (evidence: HypothesisEvidence) => void;
}) {
  return (
    <section className="space-y-1.5">
      <h3 className="text-[12px] font-semibold">
        {title} <span className="text-muted-foreground">({items.length})</span>
      </h3>
      {items.length === 0 ? (
        <p className="rounded-md border border-dashed border-border px-3 py-3 text-[12px] text-muted-foreground">
          No {title.toLowerCase()} recorded.
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((evidence) => (
            <li key={evidence.id} className="rounded-lg border border-border bg-card p-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[12.5px] leading-relaxed">{evidence.description}</p>
                  {evidence.artifact && (
                    <Link
                      to={artifactHref(evidence.artifact)}
                      className="mt-1 inline-flex items-center gap-1 text-[11.5px] text-teal-700 hover:underline dark:text-teal-300"
                    >
                      <ExternalLink className="size-3" aria-hidden="true" />
                      {evidence.artifact.label}
                    </Link>
                  )}
                  <p className="mt-1 text-[10.5px] text-muted-foreground">
                    {formatDate(evidence.createdAt, "MMM d, yyyy HH:mm")}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground hover:text-destructive"
                  aria-label="Remove evidence"
                  onClick={() => onRemove(evidence)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function HypothesisSidePanel({
  hypothesis,
  open,
  onOpenChange,
  onStatusChange,
}: HypothesisSidePanelProps) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [removing, setRemoving] = useState<HypothesisEvidence | null>(null);

  useEffect(() => {
    if (!open) {
      setShowForm(false);
      setRemoving(null);
    }
  }, [open]);

  const { data: evidence = [] } = useQuery({
    queryKey: queryKeys.evidence(hypothesis?.id ?? ""),
    queryFn: () => evidenceApi.list(hypothesis!.id),
    enabled: open && Boolean(hypothesis),
  });
  const { data: experiments = [] } = useQuery({
    queryKey: queryKeys.experiments,
    queryFn: experimentsApi.list,
    enabled: open,
  });
  const { data: projects = [] } = useQuery({
    queryKey: queryKeys.projects,
    queryFn: projectsApi.list,
    enabled: open,
  });

  const removeMutation = useMutation({
    mutationFn: (evidenceId: string) => evidenceApi.remove(evidenceId),
    onSuccess: () => {
      toast.success("Evidence removed");
      setRemoving(null);
      if (hypothesis) {
        queryClient.invalidateQueries({ queryKey: queryKeys.evidence(hypothesis.id) });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.evidenceAll });
      queryClient.invalidateQueries({ queryKey: queryKeys.hypotheses });
      queryClient.invalidateQueries({ queryKey: queryKeys.graph });
      queryClient.invalidateQueries({ queryKey: queryKeys.activity });
      queryClient.invalidateQueries({ queryKey: queryKeys.feed });
    },
    onError: (error: Error) => {
      toast.error("Could not remove evidence", { description: error.message });
    },
  });

  const linkedExperiments = experiments.filter(
    (experiment) => experiment.hypothesisId === hypothesis?.id,
  );
  const project = projects.find((item) => item.id === hypothesis?.projectId);
  const supporting = evidence.filter((item) => item.stance === "supports");
  const contradicting = evidence.filter((item) => item.stance === "contradicts");
  const neutral = evidence.filter((item) => item.stance === "neutral");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        {hypothesis && (
          <>
            <SheetHeader>
              <SheetTitle className="flex items-start gap-2 pr-6 text-[16px]">
                <Lightbulb className="mt-0.5 size-4 shrink-0 text-amber-500" aria-hidden="true" />
                <span>{hypothesis.statement}</span>
              </SheetTitle>
              <SheetDescription>{hypothesis.researchQuestion}</SheetDescription>
            </SheetHeader>

            <div className="space-y-5 p-6 pt-4">
              <div className="flex flex-wrap items-center gap-1.5">
                <HypothesisStatusBadge status={hypothesis.status} />
                {project && (
                  <Link
                    to={`/app/projects/${project.id}`}
                    className="rounded-full border border-border px-2 py-0.5 text-[11.5px] text-muted-foreground hover:text-teal-700 dark:hover:text-teal-300"
                  >
                    {project.title}
                  </Link>
                )}
                <Badge variant="success" className="gap-1">
                  <MessageSquarePlus className="size-3" aria-hidden="true" />
                  {supporting.length} for
                </Badge>
                <Badge variant="danger" className="gap-1">
                  <MessageSquareX className="size-3" aria-hidden="true" />
                  {contradicting.length} against
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <FlaskConical className="size-3" aria-hidden="true" />
                  {linkedExperiments.length} experiments
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-muted/20 p-3 text-[11.5px]">
                <div>
                  <p className="text-muted-foreground">Created</p>
                  <p className="mt-0.5 font-medium">{formatDate(hypothesis.createdAt, "MMM d, yyyy")}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Updated</p>
                  <p className="mt-0.5 font-medium">{formatDate(hypothesis.updatedAt, "MMM d, yyyy")}</p>
                </div>
              </div>

              <section className="space-y-1.5">
                <h3 className="text-[12px] font-semibold">Linked experiments</h3>
                {linkedExperiments.length === 0 ? (
                  <p className="rounded-md border border-dashed border-border px-3 py-3 text-[12px] text-muted-foreground">
                    No experiment links this hypothesis yet.
                  </p>
                ) : (
                  <ul className="space-y-1.5">
                    {linkedExperiments.map((experiment) => (
                      <li key={experiment.id}>
                        <Link
                          to={`/app/experiments/${experiment.id}`}
                          className="flex items-center justify-between gap-2 rounded-md border border-border px-2.5 py-2 text-[12.5px] hover:border-teal-500/40 hover:bg-muted/40"
                        >
                          <span className="truncate">{experiment.title}</span>
                          <Badge variant="outline">{experiment.status}</Badge>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-[12px] font-semibold">Evidence</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowForm((current) => !current)}
                  >
                    <Plus className="size-3.5" />
                    {showForm ? "Hide form" : "Add evidence"}
                  </Button>
                </div>
                {showForm && <EvidenceForm hypothesisId={hypothesis.id} />}
                <EvidenceList title="Supporting evidence" items={supporting} onRemove={setRemoving} />
                <EvidenceList title="Contradicting evidence" items={contradicting} onRemove={setRemoving} />
                <EvidenceList title="Neutral evidence" items={neutral} onRemove={setRemoving} />
              </div>

              <section className="space-y-2 border-t border-border pt-4">
                <h3 className="text-[12px] font-semibold">Promote hypothesis</h3>
                <p className="text-[11.5px] text-muted-foreground">
                  Final statuses require confirmation and are recorded in the activity feed.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-500/40 dark:text-emerald-300 dark:hover:bg-emerald-500/10"
                    disabled={hypothesis.status === "supported"}
                    onClick={() => onStatusChange("supported")}
                  >
                    <CheckCircle2 className="size-3.5" />
                    Promote to Supported
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-rose-300 text-rose-700 hover:bg-rose-50 dark:border-rose-500/40 dark:text-rose-300 dark:hover:bg-rose-500/10"
                    disabled={hypothesis.status === "refuted"}
                    onClick={() => onStatusChange("refuted")}
                  >
                    <XCircle className="size-3.5" />
                    Promote to Refuted
                  </Button>
                </div>
              </section>
            </div>
          </>
        )}
      </SheetContent>

      <ConfirmDialog
        open={Boolean(removing)}
        onOpenChange={(openState) => !openState && setRemoving(null)}
        title="Remove this evidence?"
        description={
          removing
            ? `“${removing.description}” will be detached from this hypothesis. The linked artifact itself is not deleted.`
            : ""
        }
        confirmLabel="Remove evidence"
        onConfirm={async () => {
          if (removing) await removeMutation.mutateAsync(removing.id);
        }}
      />
    </Sheet>
  );
}
