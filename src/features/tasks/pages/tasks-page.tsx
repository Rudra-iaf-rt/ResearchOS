import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  Circle,
  Columns3,
  Flag,
  List,
  Plus,
  SearchX,
  SquareCheckBig,
  Timer,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader, SectionHeading } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ListSkeleton } from "@/components/shared/skeletons";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { priorityMeta, taskStatusMeta } from "@/lib/constants";
import { queryKeys } from "@/lib/query-keys";
import type {
  Milestone,
  Task,
  TaskPriority,
  TaskStatus,
} from "@/types";
import { projectsApi } from "@/features/projects/api";
import { milestonesApi } from "@/features/milestones/api";
import { MilestoneCard } from "@/features/milestones/components/milestone-card";
import { MilestoneFormDialog } from "@/features/milestones/components/milestone-form-dialog";
import { tasksApi } from "../api";
import { TaskCard, TaskRow } from "../components/task-items";
import { TaskFormDialog } from "../components/task-form-dialog";

const columns: {
  status: TaskStatus;
  icon: typeof Circle;
  tone: string;
}[] = [
  { status: "todo", icon: Circle, tone: "text-slate-500" },
  { status: "in-progress", icon: Timer, tone: "text-indigo-500" },
  { status: "completed", icon: CheckCircle2, tone: "text-teal-600" },
];

export function TasksPage() {
  const queryClient = useQueryClient();
  const [view, setView] = useState<"board" | "list">("board");
  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState<"all" | TaskPriority>("all");
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [taskStatus, setTaskStatus] = useState<TaskStatus>("todo");
  const [deletingTask, setDeletingTask] = useState<Task | undefined>();
  const [dragOver, setDragOver] = useState<TaskStatus | null>(null);
  const [milestoneDialogOpen, setMilestoneDialogOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | undefined>();
  const [deletingMilestone, setDeletingMilestone] = useState<Milestone | undefined>();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: queryKeys.tasks,
    queryFn: tasksApi.list,
  });
  const { data: projects = [] } = useQuery({
    queryKey: queryKeys.projects,
    queryFn: projectsApi.list,
  });
  const { data: milestones = [] } = useQuery({
    queryKey: queryKeys.milestones,
    queryFn: milestonesApi.list,
  });

  const projectTitle = (id: string | null) =>
    projects.find((project) => project.id === id)?.title;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tasks.filter((task) => {
      const matchesQuery =
        !q ||
        task.title.toLowerCase().includes(q) ||
        task.description?.toLowerCase().includes(q) ||
        task.tags.some((tag) => tag.toLowerCase().includes(q));
      const matchesProject =
        projectFilter === "all" ||
        (projectFilter === "none" ? !task.projectId : task.projectId === projectFilter);
      const matchesPriority =
        priorityFilter === "all" || task.priority === priorityFilter;
      return matchesQuery && matchesProject && matchesPriority;
    });
  }, [tasks, search, projectFilter, priorityFilter]);

  const filteredMilestones = milestones
    .filter((milestone) => {
      const matchesProject =
        projectFilter === "all" ||
        (projectFilter === "none" ? false : milestone.projectId === projectFilter);
      const q = search.trim().toLowerCase();
      const matchesQuery =
        !q ||
        milestone.title.toLowerCase().includes(q) ||
        milestone.description.toLowerCase().includes(q);
      return matchesProject && matchesQuery;
    })
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  const move = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) =>
      tasksApi.setStatus(id, status),
    onSuccess: (task) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.tasks });
      void queryClient.invalidateQueries({ queryKey: queryKeys.projects });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      void queryClient.invalidateQueries({ queryKey: queryKeys.activity });
      toast.success(`Moved to ${taskStatusMeta[task.status].column}`, {
        description: task.title,
      });
    },
  });

  const removeTask = useMutation({
    mutationFn: (id: string) => tasksApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.tasks });
      void queryClient.invalidateQueries({ queryKey: queryKeys.projects });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      void queryClient.invalidateQueries({ queryKey: queryKeys.activity });
      toast.success("Task deleted");
    },
  });

  const removeMilestone = useMutation({
    mutationFn: (id: string) => milestonesApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.milestones });
      void queryClient.invalidateQueries({ queryKey: queryKeys.projects });
      void queryClient.invalidateQueries({ queryKey: queryKeys.activity });
      toast.success("Milestone deleted");
    },
  });

  const openNewTask = (status: TaskStatus = "todo") => {
    setEditingTask(undefined);
    setTaskStatus(status);
    setTaskDialogOpen(true);
  };

  const openEditTask = (task: Task) => {
    setEditingTask(task);
    setTaskDialogOpen(true);
  };

  const hasFilters =
    Boolean(search.trim()) || projectFilter !== "all" || priorityFilter !== "all";

  const totalOpen = filtered.filter((task) => task.status !== "completed").length;
  const overdue = filtered.filter(
    (task) =>
      task.status !== "completed" &&
      task.dueDate &&
      new Date(task.dueDate) < new Date(new Date().toDateString()),
  ).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tasks & milestones"
        description={`${totalOpen} open tasks${overdue ? ` · ${overdue} overdue` : ""}. Drag cards between columns or switch to the list view for detail.`}
        actions={
          <Button onClick={() => openNewTask()}>
            <Plus className="size-4" />
            New task
          </Button>
        }
      />

      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search tasks…"
            ariaLabel="Search tasks"
            className="w-full sm:w-60"
          />
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="w-[190px]" aria-label="Filter by project">
              <SelectValue placeholder="All projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All projects</SelectItem>
              <SelectItem value="none">Workspace tasks</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={priorityFilter}
            onValueChange={(value) => setPriorityFilter(value as "all" | TaskPriority)}
          >
            <SelectTrigger className="w-[150px]" aria-label="Filter by priority">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All priorities</SelectItem>
              {Object.entries(priorityMeta).map(([value, meta]) => (
                <SelectItem key={value} value={value}>
                  {meta.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hasFilters && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setProjectFilter("all");
                setPriorityFilter("all");
              }}
              className="text-[11.5px] font-medium text-teal-700 hover:underline dark:text-teal-300"
            >
              Clear filters
            </button>
          )}
        </div>

        <div className="inline-flex items-center gap-0.5 self-start rounded-lg border border-border bg-card p-0.5 shadow-subtle">
          <button
            type="button"
            onClick={() => setView("board")}
            aria-pressed={view === "board"}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11.5px] font-medium transition-colors",
              view === "board"
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Columns3 className="size-3.5" /> Board
          </button>
          <button
            type="button"
            onClick={() => setView("list")}
            aria-pressed={view === "list"}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11.5px] font-medium transition-colors",
              view === "list"
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <List className="size-3.5" /> List
          </button>
        </div>
      </div>

      {isLoading ? (
        <ListSkeleton rows={6} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={hasFilters ? SearchX : SquareCheckBig}
          title={hasFilters ? "No tasks match these filters" : "No tasks yet"}
          description={
            hasFilters
              ? "Adjust the search or filters to see more of your research tasks."
              : "Capture the next concrete action and connect it to a project."
          }
          action={
            hasFilters ? (
              <Button
                variant="outline"
                onClick={() => {
                  setSearch("");
                  setProjectFilter("all");
                  setPriorityFilter("all");
                }}
              >
                Clear filters
              </Button>
            ) : (
              <Button onClick={() => openNewTask()}>Create the first task</Button>
            )
          }
        />
      ) : view === "board" ? (
        <div className="grid gap-4 lg:grid-cols-3">
          {columns.map((column) => {
            const Icon = column.icon;
            const items = filtered.filter((task) => task.status === column.status);
            return (
              <section
                key={column.status}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragOver(column.status);
                }}
                onDragLeave={() => setDragOver(null)}
                onDrop={(event) => {
                  event.preventDefault();
                  const id = event.dataTransfer.getData("text/plain");
                  setDragOver(null);
                  if (id) {
                    const task = tasks.find((item) => item.id === id);
                    if (task && task.status !== column.status) {
                      move.mutate({ id, status: column.status });
                    }
                  }
                }}
                className={cn(
                  "flex min-h-[420px] flex-col rounded-xl border bg-muted/30 transition-colors",
                  dragOver === column.status
                    ? "border-teal-400 bg-teal-50/50 dark:border-teal-500/40 dark:bg-teal-500/5"
                    : "border-border",
                )}
              >
                <header className="flex items-center gap-2 px-3.5 py-3">
                  <Icon className={cn("size-4", column.tone)} />
                  <h2 className="text-[12.5px] font-semibold">
                    {taskStatusMeta[column.status].column}
                  </h2>
                  <span className="rounded-full bg-card px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-muted-foreground shadow-subtle">
                    {items.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => openNewTask(column.status)}
                    className="ml-auto flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
                    aria-label={`Add task to ${taskStatusMeta[column.status].column}`}
                  >
                    <Plus className="size-3.5" />
                  </button>
                </header>
                <div className="flex flex-1 flex-col gap-2.5 px-2.5 pb-3">
                  {items.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      projectTitle={projectTitle(task.projectId)}
                      onEdit={openEditTask}
                      onDelete={setDeletingTask}
                      onDragStart={(event, dragged) => {
                        event.dataTransfer.setData("text/plain", dragged.id);
                        event.dataTransfer.effectAllowed = "move";
                      }}
                      onDragEnd={() => setDragOver(null)}
                    />
                  ))}
                  {items.length === 0 && (
                    <button
                      type="button"
                      onClick={() => openNewTask(column.status)}
                      className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-border py-6 text-[11.5px] text-muted-foreground transition-colors hover:border-teal-400 hover:text-teal-700 dark:hover:text-teal-300"
                    >
                      Drop a task here or add one
                    </button>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <div className="space-y-5">
          {columns.map((column) => {
            const Icon = column.icon;
            const items = filtered.filter((task) => task.status === column.status);
            if (items.length === 0) return null;
            return (
              <div key={column.status}>
                <div className="mb-2 flex items-center gap-2">
                  <Icon className={cn("size-4", column.tone)} />
                  <h2 className="text-[12.5px] font-semibold">
                    {taskStatusMeta[column.status].column}
                  </h2>
                  <span className="text-[10.5px] text-muted-foreground">{items.length}</span>
                </div>
                <div className="overflow-hidden rounded-xl border border-border bg-card shadow-subtle">
                  {items.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      projectTitle={projectTitle(task.projectId)}
                      onEdit={openEditTask}
                      onDelete={setDeletingTask}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <section className="pt-2">
        <SectionHeading
          title="Milestones"
          description="Decision points and deliverables across your projects."
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditingMilestone(undefined);
                setMilestoneDialogOpen(true);
              }}
            >
              <Flag className="size-3.5" /> New milestone
            </Button>
          }
        />
        {filteredMilestones.length === 0 ? (
          <div className="mt-3 rounded-xl border border-dashed border-border bg-card/60 px-6 py-10 text-center">
            <Flag className="mx-auto mb-2 size-5 text-muted-foreground/60" />
            <p className="text-[12.5px] font-medium">No milestones for this view</p>
            <p className="mt-1 text-[11.5px] text-muted-foreground">
              Add a milestone to mark a decision or deliverable.
            </p>
          </div>
        ) : (
          <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {filteredMilestones.map((milestone) => (
              <MilestoneCard
                key={milestone.id}
                milestone={milestone}
                projectTitle={projectTitle(milestone.projectId)}
                onEdit={(item) => {
                  setEditingMilestone(item);
                  setMilestoneDialogOpen(true);
                }}
                onDelete={setDeletingMilestone}
              />
            ))}
          </div>
        )}
      </section>

      <TaskFormDialog
        open={taskDialogOpen}
        onOpenChange={(open) => {
          setTaskDialogOpen(open);
          if (!open) setEditingTask(undefined);
        }}
        task={editingTask}
        defaultStatus={taskStatus}
        defaultProjectId={
          projectFilter !== "all" && projectFilter !== "none" ? projectFilter : undefined
        }
      />

      <MilestoneFormDialog
        open={milestoneDialogOpen}
        onOpenChange={(open) => {
          setMilestoneDialogOpen(open);
          if (!open) setEditingMilestone(undefined);
        }}
        milestone={editingMilestone}
        defaultProjectId={
          projectFilter !== "all" && projectFilter !== "none" ? projectFilter : undefined
        }
      />

      <ConfirmDialog
        open={Boolean(deletingTask)}
        onOpenChange={(open) => !open && setDeletingTask(undefined)}
        title="Delete this task?"
        description={
          <>
            <strong>{deletingTask?.title}</strong> will be removed from this demo workspace. This
            cannot be undone.
          </>
        }
        confirmLabel="Delete task"
        onConfirm={() => {
          if (deletingTask) removeTask.mutate(deletingTask.id);
        }}
      />

      <ConfirmDialog
        open={Boolean(deletingMilestone)}
        onOpenChange={(open) => !open && setDeletingMilestone(undefined)}
        title="Delete this milestone?"
        description={
          <>
            <strong>{deletingMilestone?.title}</strong> will be removed from its project timeline.
          </>
        }
        confirmLabel="Delete milestone"
        onConfirm={() => {
          if (deletingMilestone) removeMilestone.mutate(deletingMilestone.id);
        }}
      />
    </div>
  );
}
