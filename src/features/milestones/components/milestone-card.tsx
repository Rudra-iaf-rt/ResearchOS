import { Link } from "react-router-dom";
import { CalendarClock, Flag, Pencil, MoreHorizontal, Trash2 } from "lucide-react";
import { MilestoneStatusBadge } from "@/components/shared/status-badge";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate, daysUntil } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Milestone } from "@/types";

export function MilestoneCard({
  milestone,
  projectTitle,
  onEdit,
  onDelete,
  compact = false,
}: {
  milestone: Milestone;
  projectTitle?: string;
  onEdit?: (milestone: Milestone) => void;
  onDelete?: (milestone: Milestone) => void;
  compact?: boolean;
}) {
  const overdue =
    milestone.status !== "completed" &&
    daysUntil(milestone.dueDate) < 0;

  return (
    <div
      className={cn(
        "group relative flex flex-col rounded-xl border border-border bg-card shadow-subtle transition-colors hover:border-navy-200 dark:hover:border-navy-600",
        compact ? "p-3.5" : "p-4",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="flex size-7 items-center justify-center rounded-md bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300">
          <Flag className="size-3.5" />
        </span>
        <div className="flex items-center gap-1">
          <MilestoneStatusBadge status={milestone.status} />
          {onEdit && onDelete && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex size-7 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-all hover:bg-muted hover:text-foreground focus-visible:opacity-100 data-[state=open]:opacity-100 group-hover:opacity-100"
                  aria-label={`Actions for ${milestone.title}`}
                >
                  <MoreHorizontal className="size-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onSelect={() => onEdit(milestone)}>
                  <Pencil /> Edit milestone
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem destructive onSelect={() => onDelete(milestone)}>
                  <Trash2 /> Delete milestone
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      <p className="mt-2.5 text-[12.5px] font-semibold leading-snug">{milestone.title}</p>
      {!compact && milestone.description && (
        <p className="mt-1 line-clamp-2 text-[11.5px] leading-relaxed text-muted-foreground">
          {milestone.description}
        </p>
      )}

      <div className="mt-3">
        <div className="mb-1 flex items-center justify-between text-[10px] text-muted-foreground">
          <span>Progress</span>
          <span className="font-semibold tabular-nums">{milestone.progress}%</span>
        </div>
        <Progress
          value={milestone.progress}
          className="h-1"
          indicatorClassName={
            milestone.status === "at-risk" ? "bg-rose-500" : "bg-teal-600"
          }
        />
      </div>

      <div className="mt-2.5 flex items-center justify-between gap-2 text-[10px] text-muted-foreground">
        <span
          className={cn(
            "flex items-center gap-1",
            overdue && "font-medium text-rose-600 dark:text-rose-400",
          )}
        >
          <CalendarClock className="size-3" />
          {formatDate(milestone.dueDate, "MMM d, yyyy")}
        </span>
        {projectTitle && milestone.projectId && (
          <Link
            to={`/app/projects/${milestone.projectId}?tab=milestones`}
            className="max-w-[140px] truncate transition-colors hover:text-teal-700 dark:hover:text-teal-300"
          >
            {projectTitle}
          </Link>
        )}
      </div>
    </div>
  );
}
