import { Link } from "react-router-dom";
import { Clock, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { artifactTypeMeta, researchModeMeta } from "@/lib/constants";
import { formatDate, fromNow } from "@/lib/format";
import { cn } from "@/lib/utils";
import { formatDuration, type ResearchLogView } from "../lib";
import { researchModeIcons } from "../mode-icons";

interface ResearchLogItemProps {
  entry: ResearchLogView;
  onEdit?: (entry: ResearchLogView) => void;
  onDelete?: (entry: ResearchLogView) => void;
  showDate?: boolean;
  compact?: boolean;
  className?: string;
}

export function ResearchLogItem({
  entry,
  onEdit,
  onDelete,
  showDate = false,
  compact = false,
  className,
}: ResearchLogItemProps) {
  const mode = researchModeMeta[entry.mode];
  const Icon = researchModeIcons[entry.mode];
  const editable = Boolean(onEdit || onDelete);

  return (
    <div className={cn("group flex gap-3", compact ? "py-2" : "py-3", className)}>
      <span
        className={cn(
          "mt-0.5 flex shrink-0 items-center justify-center rounded-lg",
          compact ? "size-7" : "size-9",
          mode.chip,
        )}
        title={`${mode.label} · ${mode.description}`}
      >
        <Icon className={compact ? "size-3.5" : "size-4"} aria-hidden="true" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              "font-medium leading-snug text-foreground",
              compact ? "text-[12.5px]" : "text-[13px]",
            )}
          >
            {entry.title}
          </p>
          {editable && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="-mr-1 -mt-1 size-7 shrink-0 text-muted-foreground opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100 data-[state=open]:opacity-100"
                  aria-label={`Actions for ${entry.title}`}
                >
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                {onEdit && (
                  <DropdownMenuItem onSelect={() => onEdit(entry)}>
                    <Pencil />
                    Edit entry
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem destructive onSelect={() => onDelete(entry)}>
                      <Trash2 />
                      Delete entry
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {entry.notes && !compact && (
          <p className="mt-0.5 line-clamp-2 text-[11.5px] leading-relaxed text-muted-foreground">
            {entry.notes}
          </p>
        )}

        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10.5px] text-muted-foreground">
          <span className="inline-flex items-center gap-1 font-medium text-foreground/75">
            <Clock className="size-3" aria-hidden="true" />
            {formatDuration(entry.durationMinutes)}
          </span>
          <span className="size-1 rounded-full bg-border" aria-hidden="true" />
          <span>{mode.label}</span>
          {entry.projectTitle && (
            <>
              <span className="size-1 rounded-full bg-border" aria-hidden="true" />
              <Link
                to={entry.projectId ? `/app/projects/${entry.projectId}` : "/app/projects"}
                className="max-w-40 truncate hover:text-teal-700 dark:hover:text-teal-300"
              >
                {entry.projectTitle}
              </Link>
            </>
          )}
          {entry.artifact && entry.artifactUrl && (
            <>
              <span className="size-1 rounded-full bg-border" aria-hidden="true" />
              <Link
                to={entry.artifactUrl}
                className="inline-flex max-w-48 items-center gap-1 truncate hover:text-teal-700 dark:hover:text-teal-300"
                title={`Open ${entry.artifact.label}`}
              >
                <span className="text-muted-foreground/70">
                  {artifactTypeMeta[entry.artifact.type].label}
                </span>
                <span className="truncate">{entry.artifact.label}</span>
              </Link>
            </>
          )}
          {showDate && (
            <>
              <span className="size-1 rounded-full bg-border" aria-hidden="true" />
              <time dateTime={entry.occurredAt}>
                {formatDate(entry.occurredAt, "MMM d, h:mm a")}
              </time>
            </>
          )}
        </div>

        {!compact && (
          <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-muted-foreground/80">
            <Avatar className="size-4">
              <AvatarFallback
                style={{ backgroundColor: entry.actor.color }}
                className="text-[7px] font-semibold text-white"
              >
                {entry.actor.initials}
              </AvatarFallback>
            </Avatar>
            <span>{entry.actor.name}</span>
            <span aria-hidden="true">·</span>
            <span>{fromNow(entry.occurredAt)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
