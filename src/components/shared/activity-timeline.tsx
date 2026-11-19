import {
  CheckSquare,
  FileUp,
  Flag,
  FolderKanban,
  Library,
  Microscope,
  NotebookPen,
} from "lucide-react";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ActivityCategory, ActivityEvent, Project } from "@/types";

const categoryIcon: Record<ActivityCategory, typeof FolderKanban> = {
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

function groupLabel(date: string) {
  const value = new Date(date);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (value.toDateString() === today.toDateString()) return "Today";
  if (value.toDateString() === yesterday.toDateString()) return "Yesterday";
  return formatDate(value, "EEEE, MMM d");
}

export function ActivityTimeline({
  events,
  projects,
  grouped = false,
  className,
  limit,
}: {
  events: ActivityEvent[];
  projects?: Project[];
  grouped?: boolean;
  className?: string;
  limit?: number;
}) {
  const visible = limit ? events.slice(0, limit) : events;

  const groups = grouped
    ? visible.reduce<{ label: string; items: ActivityEvent[] }[]>((acc, event) => {
        const label = groupLabel(event.createdAt);
        const group = acc.find((item) => item.label === label);
        if (group) group.items.push(event);
        else acc.push({ label, items: [event] });
        return acc;
      }, [])
    : [{ label: "", items: visible }];

  return (
    <div className={cn("space-y-6", className)}>
      {groups.map((group) => (
        <div key={group.label || "all"}>
          {group.label && (
            <div className="mb-3 flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                {group.label}
              </span>
              <span className="h-px flex-1 bg-border" />
            </div>
          )}
          <ol className="relative space-y-0">
            {group.items.map((event, index) => {
              const Icon = categoryIcon[event.category];
              const project = projects?.find((item) => item.id === event.projectId);
              return (
                <li key={event.id} className="relative flex gap-3.5 pb-5 last:pb-0">
                  {index !== group.items.length - 1 && (
                    <span className="absolute left-[17px] top-9 h-[calc(100%-24px)] w-px bg-border" />
                  )}
                  <span
                    className={cn(
                      "relative z-10 mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full ring-4 ring-card",
                      categoryTone[event.category],
                    )}
                  >
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <p className="text-[13px] leading-snug">
                      <span className="font-semibold">{event.actor.name}</span>{" "}
                      <span className="text-muted-foreground">{event.action}</span>{" "}
                      <span className="font-medium">{event.target}</span>
                    </p>
                    {event.detail && (
                      <p className="mt-0.5 text-[12px] text-muted-foreground">{event.detail}</p>
                    )}
                    <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-muted-foreground">
                      <time dateTime={event.createdAt}>
                        {formatDate(event.createdAt, "MMM d, h:mm a")}
                      </time>
                      {project && (
                        <>
                          <span className="size-1 rounded-full bg-border" />
                          <span className="truncate">{project.title}</span>
                        </>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      ))}
    </div>
  );
}
