import { Link } from "react-router-dom";
import { Scale } from "lucide-react";
import { DecisionStatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";
import type { ResearchDecision } from "@/types";

interface DecisionCardProps {
  decision: ResearchDecision;
  projectName: string;
  onOpen: () => void;
}

export function DecisionCard({ decision, projectName, onOpen }: DecisionCardProps) {
  return (
    <article className="flex flex-col gap-2.5 rounded-xl border border-border bg-card p-4 shadow-subtle transition-colors hover:border-navy-300 dark:hover:border-navy-600">
      <div className="flex items-start justify-between gap-2">
        <button
          type="button"
          onClick={onOpen}
          className="min-w-0 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="flex items-start gap-2">
            <Scale className="mt-0.5 size-4 shrink-0 text-violet-500" aria-hidden="true" />
            <span className="text-[14px] font-semibold leading-snug hover:text-teal-700 dark:hover:text-teal-300">
              {decision.title}
            </span>
          </span>
        </button>
        <DecisionStatusBadge status={decision.status} />
      </div>

      <p className="line-clamp-2 text-[12px] leading-relaxed text-muted-foreground">
        {decision.context}
      </p>
      <p className="line-clamp-2 border-l-2 border-teal-500/40 pl-2 text-[12.5px] leading-relaxed">
        {decision.decision}
      </p>

      <div className="mt-auto flex flex-wrap items-center gap-1.5 border-t border-border pt-2.5 text-[11.5px]">
        <span className="text-muted-foreground">{projectName}</span>
        <span aria-hidden="true" className="text-muted-foreground">·</span>
        <span className="text-muted-foreground">{formatDate(decision.createdAt, "MMM d, yyyy")}</span>
        <Badge variant="outline" className="ml-auto">
          {decision.alternatives.length} alternative{decision.alternatives.length === 1 ? "" : "s"}
        </Badge>
        <Badge variant="outline">
          {decision.artifacts.length} artifact{decision.artifacts.length === 1 ? "" : "s"}
        </Badge>
      </div>
    </article>
  );
}

export function DecisionArtifactLink({
  artifact,
  href,
}: {
  artifact: { label: string };
  href: string;
}) {
  return (
    <Link
      to={href}
      className="rounded-full border border-border bg-card px-2 py-0.5 text-[11.5px] text-muted-foreground hover:border-teal-500/40 hover:text-teal-700 dark:hover:text-teal-300"
    >
      {artifact.label}
    </Link>
  );
}
