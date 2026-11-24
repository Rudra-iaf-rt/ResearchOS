import type { KeyboardEvent } from "react";
import { ArrowLeftRight, FlaskConical, MessageSquarePlus, MessageSquareX, MoreHorizontal, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { HypothesisStatusBadge } from "@/components/shared/status-badge";
import { hypothesisStatusMeta } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Hypothesis, HypothesisStatus } from "@/types";

interface HypothesisCardProps {
  hypothesis: Hypothesis;
  projectName: string;
  supports: number;
  contradicts: number;
  experimentCount: number;
  onOpen: () => void;
  onEdit: () => void;
  onMove: (status: HypothesisStatus) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  dragging: boolean;
}

export function HypothesisCard({
  hypothesis,
  projectName,
  supports,
  contradicts,
  experimentCount,
  onOpen,
  onEdit,
  onMove,
  onDragStart,
  onDragEnd,
  dragging,
}: HypothesisCardProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpen();
    }
  };

  return (
    <article
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData("text/plain", hypothesis.id);
        event.dataTransfer.effectAllowed = "move";
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      onClick={onOpen}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`Open hypothesis: ${hypothesis.statement}`}
      className={cn(
        "group cursor-grab rounded-lg border border-border bg-card p-3 text-left shadow-subtle outline-none transition-all hover:border-navy-300 focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing dark:hover:border-navy-600",
        dragging && "opacity-50",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {projectName}
        </p>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="-mr-1 -mt-1 size-7"
              aria-label={`Move ${hypothesis.statement}`}
              onClick={(event) => event.stopPropagation()}
            >
              <MoreHorizontal className="size-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(event) => event.stopPropagation()}>
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="size-3" />
              Edit details
            </DropdownMenuItem>
            <DropdownMenuLabel className="flex items-center gap-1.5">
              <ArrowLeftRight className="size-3" aria-hidden="true" />
              Move to
            </DropdownMenuLabel>
            {(Object.keys(hypothesisStatusMeta) as HypothesisStatus[]).map((status) => (
              <DropdownMenuItem
                key={status}
                disabled={status === hypothesis.status}
                onClick={() => onMove(status)}
              >
                {hypothesisStatusMeta[status].label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <p className="mt-1.5 text-[12.5px] leading-relaxed text-foreground">
        {hypothesis.statement}
      </p>
      <p className="mt-1 line-clamp-2 text-[11.5px] leading-relaxed text-muted-foreground">
        {hypothesis.researchQuestion}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <HypothesisStatusBadge status={hypothesis.status} />
        <Badge variant="success" className="gap-1">
          <MessageSquarePlus className="size-3" aria-hidden="true" />
          {supports}
        </Badge>
        <Badge variant="danger" className="gap-1">
          <MessageSquareX className="size-3" aria-hidden="true" />
          {contradicts}
        </Badge>
        <Badge variant="outline" className="gap-1">
          <FlaskConical className="size-3" aria-hidden="true" />
          {experimentCount}
        </Badge>
      </div>
    </article>
  );
}
