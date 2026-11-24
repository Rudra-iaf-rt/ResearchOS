import { Link } from "react-router-dom";
import { ExternalLink, Pencil, Scale } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DecisionStatusBadge } from "@/components/shared/status-badge";
import { formatDate } from "@/lib/format";
import { decisionStatusMeta } from "@/lib/constants";
import { researchArtifactHref } from "../lib";
import type { DecisionStatus, ResearchDecision } from "@/types";

interface DecisionDetailPanelProps {
  decision: ResearchDecision | null;
  projectName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: () => void;
  onStatusChange: (status: DecisionStatus) => void;
}

export function DecisionDetailPanel({
  decision,
  projectName,
  open,
  onOpenChange,
  onEdit,
  onStatusChange,
}: DecisionDetailPanelProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        {decision && (
          <>
            <SheetHeader>
              <SheetTitle className="flex items-start gap-2 pr-6 text-[16px]">
                <Scale className="mt-0.5 size-4 shrink-0 text-violet-500" aria-hidden="true" />
                <span>{decision.title}</span>
              </SheetTitle>
              <SheetDescription>
                {projectName} · recorded {formatDate(decision.createdAt, "MMM d, yyyy")}
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-5 p-6 pt-4">
              <div className="flex flex-wrap items-center gap-1.5">
                <DecisionStatusBadge status={decision.status} />
                {(Object.keys(decisionStatusMeta) as DecisionStatus[]).map((status) => (
                  <Button
                    key={status}
                    variant="outline"
                    size="sm"
                    disabled={status === decision.status}
                    onClick={() => onStatusChange(status)}
                  >
                    {decisionStatusMeta[status].label}
                  </Button>
                ))}
                <Button variant="ghost" size="sm" className="ml-auto" onClick={onEdit}>
                  <Pencil className="size-3.5" />
                  Edit
                </Button>
              </div>

              <section>
                <h3 className="text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Context
                </h3>
                <p className="mt-1 whitespace-pre-wrap text-[13px] leading-relaxed">
                  {decision.context}
                </p>
              </section>

              <section>
                <h3 className="text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Decision
                </h3>
                <p className="mt-1 whitespace-pre-wrap border-l-2 border-teal-500/50 pl-3 text-[13px] leading-relaxed">
                  {decision.decision}
                </p>
              </section>

              <section>
                <h3 className="text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Alternatives considered
                </h3>
                {decision.alternatives.length === 0 ? (
                  <p className="mt-1 text-[12.5px] text-muted-foreground">
                    No alternatives were recorded.
                  </p>
                ) : (
                  <ul className="mt-1.5 space-y-2">
                    {decision.alternatives.map((alternative) => (
                      <li key={alternative.id} className="rounded-lg border border-border p-2.5">
                        <p className="text-[12.5px] font-medium">{alternative.title}</p>
                        {alternative.rationale && (
                          <p className="mt-0.5 text-[12px] leading-relaxed text-muted-foreground">
                            {alternative.rationale}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section>
                <h3 className="text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Linked artifacts
                </h3>
                {decision.artifacts.length === 0 ? (
                  <p className="mt-1 text-[12.5px] text-muted-foreground">
                    No artifacts are linked to this decision.
                  </p>
                ) : (
                  <ul className="mt-1.5 flex flex-wrap gap-1.5">
                    {decision.artifacts.map((artifact) => (
                      <li key={`${artifact.type}:${artifact.id}`}>
                        <Link
                          to={researchArtifactHref(artifact)}
                          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2 py-0.5 text-[11.5px] text-muted-foreground hover:border-teal-500/40 hover:text-teal-700 dark:hover:text-teal-300"
                        >
                          <ExternalLink className="size-3" aria-hidden="true" />
                          {artifact.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <div className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-muted/20 p-3 text-[11.5px]">
                <div>
                  <p className="text-muted-foreground">Created</p>
                  <p className="mt-0.5 font-medium">
                    {formatDate(decision.createdAt, "MMM d, yyyy HH:mm")}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Updated</p>
                  <p className="mt-0.5 font-medium">
                    {formatDate(decision.updatedAt, "MMM d, yyyy HH:mm")}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Owner</p>
                  <p className="mt-0.5 font-medium">{decision.owner.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Record type</p>
                  <Badge variant="outline" className="mt-0.5">Decision</Badge>
                </div>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
