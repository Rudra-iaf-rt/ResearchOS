import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowUpRight,
  Check,
  CheckCircle2,
  Copy,
  FolderKanban,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { ProjectStatusBadge } from "@/components/shared/status-badge";
import { AvatarGroup } from "@/components/shared/avatar-group";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { projectAccentClasses } from "@/lib/constants";
import { fromNow } from "@/lib/format";
import { queryKeys } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import type { Project, ProjectSummary } from "@/types";
import { projectsApi } from "../api";

interface ProjectCardProps {
  summary: ProjectSummary;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
  view?: "grid" | "list";
}

function ProjectMenu({
  project,
  onEdit,
  onDelete,
}: {
  project: Project;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
}) {
  const queryClient = useQueryClient();
  const complete = useMutation({
    mutationFn: () => projectsApi.setStatus(project.id, "completed"),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.projects });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      void queryClient.invalidateQueries({ queryKey: queryKeys.activity });
      toast.success("Project completed", { description: `“${project.title}” is marked complete.` });
    },
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={`Actions for ${project.title}`}
        >
          <MoreHorizontal className="size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onSelect={() => onEdit(project)}>
          <Pencil /> Edit project
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => {
            void navigator.clipboard?.writeText(`${window.location.origin}/app/projects/${project.id}`);
            toast.success("Link copied");
          }}
        >
          <Copy /> Copy link
        </DropdownMenuItem>
        {project.status !== "completed" && (
          <DropdownMenuItem onSelect={() => complete.mutate()}>
            <CheckCircle2 /> Mark complete
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem destructive onSelect={() => onDelete(project)}>
          <Trash2 /> Delete project
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function ProjectCard({ summary, onEdit, onDelete, view = "grid" }: ProjectCardProps) {
  const { project, completedTaskCount, taskCount, notebookCount, paperCount, nextMilestone } =
    summary;
  const accent = projectAccentClasses[project.accent];

  if (view === "list") {
    return (
      <div className="group flex items-center gap-4 border-b border-border px-4 py-3.5 transition-colors last:border-b-0 hover:bg-muted/30">
        <span className={cn("size-2.5 shrink-0 rounded-full", accent.dot)} />
        <Link to={`/app/projects/${project.id}`} className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate text-[13px] font-medium group-hover:text-teal-700 dark:group-hover:text-teal-300">
              {project.title}
            </span>
            <ProjectStatusBadge status={project.status} />
          </div>
          <p className="mt-0.5 truncate text-[11.5px] text-muted-foreground">
            {project.tags.join(" · ")} · updated {fromNow(project.updatedAt)}
          </p>
        </Link>
        <div className="hidden w-36 items-center gap-2 sm:flex">
          <Progress value={project.progress} className="h-1.5" />
          <span className="w-8 text-right text-[10.5px] font-semibold tabular-nums text-muted-foreground">
            {project.progress}%
          </span>
        </div>
        <span className="hidden w-24 text-[11px] text-muted-foreground md:block">
          {completedTaskCount}/{taskCount} tasks
        </span>
        <div className="hidden md:block">
          <AvatarGroup people={project.members} max={3} />
        </div>
        <ProjectMenu project={project} onEdit={onEdit} onDelete={onDelete} />
      </div>
    );
  }

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card p-5 shadow-subtle transition-all duration-200 hover:-translate-y-0.5 hover:border-navy-200 hover:shadow-raised dark:hover:border-navy-600">
      <span className={cn("absolute inset-x-0 top-0 h-[2.5px] opacity-80", accent.bar)} />
      <div className="flex items-start justify-between gap-2">
        <ProjectStatusBadge status={project.status} />
        <ProjectMenu project={project} onEdit={onEdit} onDelete={onDelete} />
      </div>

      <Link to={`/app/projects/${project.id}`} className="mt-3 block outline-none">
        <h3 className="text-[14.5px] font-semibold leading-snug tracking-[-0.01em] transition-colors group-hover:text-teal-800 dark:group-hover:text-teal-300">
          {project.title}
        </h3>
        <p className="mt-1.5 line-clamp-2 text-[12px] leading-relaxed text-muted-foreground">
          {project.description}
        </p>
      </Link>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {project.tags.slice(0, 3).map((tag) => (
          <Badge key={tag} variant="secondary" className="font-normal">
            {tag}
          </Badge>
        ))}
        {project.tags.length > 3 && (
          <Badge variant="outline">+{project.tags.length - 3}</Badge>
        )}
      </div>

      <div className="mt-auto pt-5">
        <div className="mb-1.5 flex items-center justify-between text-[11px]">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-semibold tabular-nums">{project.progress}%</span>
        </div>
        <Progress value={project.progress} className="h-1.5" />

        <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-3">
          <div className="flex items-center gap-2">
            <AvatarGroup people={project.members} max={3} />
            <span className="text-[10.5px] text-muted-foreground">
              {completedTaskCount}/{taskCount} tasks
            </span>
          </div>
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <FolderKanban className="size-3" />
            {notebookCount + paperCount}
          </span>
        </div>

        <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
          <span>Updated {fromNow(project.updatedAt)}</span>
          {nextMilestone ? (
            <span className="flex items-center gap-1 text-amber-700 dark:text-amber-300">
              <Check className="size-2.5" />
              {nextMilestone.title.slice(0, 24)}
              {nextMilestone.title.length > 24 ? "…" : ""}
            </span>
          ) : (
            <span className="flex items-center gap-1 text-teal-700 dark:text-teal-300">
              On track <ArrowUpRight className="size-2.5" />
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
