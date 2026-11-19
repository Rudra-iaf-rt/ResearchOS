import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CalendarDays,
  Check,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { PriorityBadge } from "@/components/shared/status-badge";
import { PersonAvatar } from "@/components/shared/avatar-group";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deadlineLabel } from "@/lib/format";
import { taskStatusMeta } from "@/lib/constants";
import { queryKeys } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import type { Task, TaskStatus } from "@/types";
import { tasksApi } from "../api";

function useTaskMutations(task: Task) {
  const queryClient = useQueryClient();

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.tasks });
    void queryClient.invalidateQueries({ queryKey: queryKeys.projects });
    void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    void queryClient.invalidateQueries({ queryKey: queryKeys.activity });
  };

  const toggle = useMutation({
    mutationFn: () =>
      tasksApi.setStatus(task.id, task.status === "completed" ? "todo" : "completed"),
    onSuccess: () => {
      invalidate();
      if (task.status !== "completed") toast.success("Task completed");
    },
  });

  const move = useMutation({
    mutationFn: (status: TaskStatus) => tasksApi.setStatus(task.id, status),
    onSuccess: invalidate,
  });

  return { toggle, move };
}

export function TaskCompleteButton({ task }: { task: Task }) {
  const { toggle } = useTaskMutations(task);
  const completed = task.status === "completed";

  return (
    <button
      type="button"
      onClick={() => toggle.mutate()}
      disabled={toggle.isPending}
      aria-label={completed ? `Reopen ${task.title}` : `Complete ${task.title}`}
      aria-pressed={completed}
      className={cn(
        "mt-0.5 flex size-[18px] shrink-0 items-center justify-center rounded-full border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        completed
          ? "border-teal-600 bg-teal-600 text-white"
          : "border-input bg-card text-transparent hover:border-teal-500 hover:text-teal-600",
      )}
    >
      <Check className="size-3" strokeWidth={3} />
    </button>
  );
}

function TaskMenu({
  task,
  onEdit,
  onDelete,
}: {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}) {
  const { move } = useTaskMutations(task);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex size-7 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-all hover:bg-muted hover:text-foreground focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group-hover:opacity-100 data-[state=open]:opacity-100"
          aria-label={`Actions for ${task.title}`}
        >
          <MoreHorizontal className="size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem onSelect={() => onEdit(task)}>
          <Pencil /> Edit task
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Move to</DropdownMenuLabel>
        {Object.entries(taskStatusMeta).map(([status, meta]) => (
          <DropdownMenuItem
            key={status}
            disabled={task.status === status}
            onSelect={() => move.mutate(status as TaskStatus)}
          >
            {task.status === status ? <Check /> : <span className="size-4" />}
            {meta.column}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem destructive onSelect={() => onDelete(task)}>
          <Trash2 /> Delete task
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function TaskRow({
  task,
  projectTitle,
  onEdit,
  onDelete,
  showProject = true,
}: {
  task: Task;
  projectTitle?: string;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  showProject?: boolean;
}) {
  const completed = task.status === "completed";
  const overdue =
    !completed && task.dueDate && new Date(task.dueDate) < new Date(new Date().toDateString());

  return (
    <div className="group flex items-start gap-3 border-b border-border px-4 py-3 transition-colors last:border-b-0 hover:bg-muted/25">
      <TaskCompleteButton task={task} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span
            className={cn(
              "text-[13px] font-medium leading-snug",
              completed && "text-muted-foreground line-through",
            )}
          >
            {task.title}
          </span>
          <PriorityBadge priority={task.priority} />
          {task.tags.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="secondary" className="hidden font-normal sm:inline-flex">
              {tag}
            </Badge>
          ))}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10.5px] text-muted-foreground">
          {showProject && (
            <span className="flex min-w-0 items-center gap-1">
              {task.projectId && projectTitle ? (
                <Link
                  to={`/app/projects/${task.projectId}?tab=tasks`}
                  className="truncate hover:text-teal-700 hover:underline dark:hover:text-teal-300"
                >
                  {projectTitle}
                </Link>
              ) : (
                <span>Workspace</span>
              )}
            </span>
          )}
          {task.dueDate && (
            <span
              className={cn(
                "flex items-center gap-1",
                overdue && "font-medium text-rose-600 dark:text-rose-400",
              )}
            >
              <CalendarDays className="size-3" />
              {deadlineLabel(task.dueDate)}
            </span>
          )}
          <span className="capitalize text-muted-foreground/80">
            {taskStatusMeta[task.status].label}
          </span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {task.assignee ? (
          <PersonAvatar person={task.assignee} className="size-6" />
        ) : (
          <span className="flex size-6 items-center justify-center rounded-full border border-dashed border-border text-[9px] text-muted-foreground">
            —
          </span>
        )}
        <TaskMenu task={task} onEdit={onEdit} onDelete={onDelete} />
      </div>
    </div>
  );
}

export function TaskCard({
  task,
  projectTitle,
  onEdit,
  onDelete,
  onDragStart,
  onDragEnd,
}: {
  task: Task;
  projectTitle?: string;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onDragStart: (event: React.DragEvent, task: Task) => void;
  onDragEnd: () => void;
}) {
  return (
    <div
      draggable
      onDragStart={(event) => onDragStart(event, task)}
      onDragEnd={onDragEnd}
      className="group cursor-grab rounded-lg border border-border bg-card p-3.5 shadow-subtle transition-shadow active:cursor-grabbing hover:shadow-raised"
    >
      <div className="flex items-start justify-between gap-2">
        <PriorityBadge priority={task.priority} />
        <TaskMenu task={task} onEdit={onEdit} onDelete={onDelete} />
      </div>
      <p className="mt-2 text-[12.5px] font-medium leading-snug">{task.title}</p>
      {task.description && (
        <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
          {task.description}
        </p>
      )}
      {task.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {task.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="rounded bg-muted px-1.5 py-0.5 text-[9.5px] font-medium text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
      <div className="mt-3 flex items-center justify-between gap-2 border-t border-border/70 pt-2.5">
        <span
          className={cn(
            "flex min-w-0 items-center gap-1 text-[10px] text-muted-foreground",
            !task.dueDate && "text-muted-foreground/60",
          )}
        >
          <CalendarDays className="size-3 shrink-0" />
          <span className="truncate">
            {task.dueDate ? deadlineLabel(task.dueDate) : "No due date"}
          </span>
        </span>
        <span className="flex items-center gap-1.5">
          {task.assignee && <PersonAvatar person={task.assignee} className="size-5" />}
          {projectTitle && (
            <span className="max-w-[90px] truncate text-[9.5px] text-muted-foreground">
              {projectTitle}
            </span>
          )}
        </span>
      </div>
    </div>
  );
}
