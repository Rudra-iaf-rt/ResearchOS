import { Link } from "react-router-dom";
import {
  Activity as ActivityIcon,
  CheckSquare,
  Clock,
  FileUp,
  Flag,
  FolderKanban,
  Library,
  Microscope,
  NotebookPen,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { activityCategoryMeta, artifactTypeMeta, researchModeMeta } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ActivityCategory, ResearchFeedItem } from "@/types";
import { artifactHref } from "@/features/artifacts/lib";
import { formatDuration } from "@/features/research-log/lib";

const categoryIcon: Record<ActivityCategory, typeof ActivityIcon> = {
  project: FolderKanban,
  task: CheckSquare,
  notebook: NotebookPen,
  paper: Library,
  file: FileUp,
  milestone: Flag,
  research: Microscope,
};

const categoryTone: Record<ActivityCategory, string> = {
  project: "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300",
  task: "bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300",
  notebook: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
  paper: "bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-300",
  file: "bg-slate-100 text-slate-600 dark:bg-slate-500/10 dark:text-slate-300",
  milestone: "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300",
  research: "bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300",
};

interface FeedItemProps {
  item: ResearchFeedItem;
  compact?: boolean;
}

export function FeedItem({ item, compact = false }: FeedItemProps) {
  const Icon = categoryIcon[item.category];
  const mode = item.mode ? researchModeMeta[item.mode] : null;
  const artifactUrl = item.artifact ? artifactHref(item.artifact) : null;

  return (
    <article className="flex gap-3.5 py-3.5">
      <span
        className={cn(
          "mt-0.5 flex shrink-0 items-center justify-center rounded-full",
          compact ? "size-8" : "size-9",
          categoryTone[item.category],
        )}
      >
        <Icon className={compact ? "size-3.5" : "size-4"} aria-hidden="true" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className={cn("leading-snug", compact ? "text-[12.5px]" : "text-[13px]")}>
            <span className="font-semibold">{item.actor.name}</span>{" "}
            <span className="text-muted-foreground">{item.action}</span>{" "}
            <span className="font-medium text-foreground">{item.target}</span>
          </p>
          <time
            dateTime={item.createdAt}
            className="shrink-0 text-[10.5px] text-muted-foreground"
          >
            {formatDate(item.createdAt, "h:mm a")}
          </time>
        </div>

        {item.detail && !compact && (
          <p className="mt-1 line-clamp-2 text-[11.5px] leading-relaxed text-muted-foreground">
            {item.detail}
          </p>
        )}

        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10.5px] text-muted-foreground">
          <Badge variant="outline" className="h-5 px-1.5 text-[9.5px] font-medium">
            {item.source === "research-log" ? "Research log" : activityCategoryMeta[item.category].label}
          </Badge>

          {mode && (
            <span className="inline-flex items-center gap-1 font-medium text-foreground/75">
              <span className={cn("size-1.5 rounded-full", mode.dot)} aria-hidden="true" />
              {mode.label}
            </span>
          )}

          {typeof item.durationMinutes === "number" && item.durationMinutes > 0 && (
            <>
              <span className="size-1 rounded-full bg-border" aria-hidden="true" />
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3" aria-hidden="true" />
                {formatDuration(item.durationMinutes)}
              </span>
            </>
          )}

          {item.artifact && (
            <>
              <span className="size-1 rounded-full bg-border" aria-hidden="true" />
              {artifactUrl ? (
                <Link
                  to={artifactUrl}
                  className="inline-flex max-w-56 items-center gap-1 truncate hover:text-teal-700 dark:hover:text-teal-300"
                  title={`Open ${item.artifact.label}`}
                >
                  <span className="text-muted-foreground/70">
                    {artifactTypeMeta[item.artifact.type].label}
                  </span>
                  <span className="truncate">{item.artifact.label}</span>
                </Link>
              ) : (
                <span className="inline-flex items-center gap-1 truncate">
                  <span className="text-muted-foreground/70">
                    {artifactTypeMeta[item.artifact.type].label}
                  </span>
                  <span className="truncate">{item.artifact.label}</span>
                </span>
              )}
            </>
          )}
        </div>
      </div>
    </article>
  );
}

export function FeedActorAvatar({ item }: { item: ResearchFeedItem }) {
  return (
    <Avatar className="size-5">
      <AvatarFallback
        style={{ backgroundColor: item.actor.color }}
        className="text-[8px] font-semibold text-white"
      >
        {item.actor.initials}
      </AvatarFallback>
    </Avatar>
  );
}
