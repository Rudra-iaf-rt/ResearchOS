import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Circle,
  Copy,
  Flag,
  FolderKanban,
  FolderOpen,
  Library,
  Link2,
  ListTree,
  MoreHorizontal,
  Network,
  NotebookPen,
  Pencil,
  Plus,
  Target,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { SectionCard } from "@/components/shared/section-card";
import { StatCard } from "@/components/shared/stat-card";
import { ActivityTimeline } from "@/components/shared/activity-timeline";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { AvatarGroup, PersonAvatar } from "@/components/shared/avatar-group";
import { ProjectStatusBadge, PaperStatusBadge } from "@/components/shared/status-badge";
import { TaskRow } from "@/features/tasks/components/task-items";
import { TaskFormDialog } from "@/features/tasks/components/task-form-dialog";
import { MilestoneCard } from "@/features/milestones/components/milestone-card";
import { MilestoneFormDialog } from "@/features/milestones/components/milestone-form-dialog";
import { NotebookCard } from "@/features/notebooks/components/notebook-card";
import { FileKindIcon } from "@/features/files/components/file-kind-icon";
import { useCreateDialogs } from "@/components/navigation/create-dialogs-provider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { queryKeys } from "@/lib/query-keys";
import { projectStatusMeta, STORAGE_LIMIT_BYTES } from "@/lib/constants";
import { deadlineLabel, formatBytes, formatDate, fromNow } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Milestone, Notebook, ProjectStatus, Task } from "@/types";
import { projectsApi } from "@/features/projects/api";
import { ProjectFormDialog } from "@/features/projects/components/project-form-dialog";
import { tasksApi } from "@/features/tasks/api";
import { milestonesApi } from "@/features/milestones/api";
import { notebooksApi } from "@/features/notebooks/api";
import { libraryApi } from "@/features/library/api";
import { filesApi } from "@/features/files/api";
import { activityApi } from "@/features/activity/api";
import { useUiStore } from "@/store/ui-store";

type ProjectTab =
  | "overview"
  | "tasks"
  | "milestones"
  | "notebooks"
  | "papers"
  | "files"
  | "activity";

const tabItems: { value: ProjectTab; label: string; icon: typeof Target }[] = [
  { value: "overview", label: "Overview", icon: Target },
  { value: "tasks", label: "Tasks", icon: CheckCircle2 },
  { value: "milestones", label: "Milestones", icon: Flag },
  { value: "notebooks", label: "Notebooks", icon: NotebookPen },
  { value: "papers", label: "Papers", icon: Library },
  { value: "files", label: "Files", icon: FolderOpen },
  { value: "activity", label: "Activity", icon: CalendarDays },
];

export function ProjectDetailPage() {
  const { projectId: id } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { openCreate } = useCreateDialogs();
  const [searchParams, setSearchParams] = useSearchParams();

  const requested = searchParams.get("tab") as ProjectTab | null;
  const tab: ProjectTab = tabItems.some((item) => item.value === requested)
    ? (requested as ProjectTab)
    : "overview";

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [deletingTask, setDeletingTask] = useState<Task | undefined>();
  const [milestoneFormOpen, setMilestoneFormOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | undefined>();
  const [deletingMilestone, setDeletingMilestone] = useState<Milestone | undefined>();
  const [deletingNotebook, setDeletingNotebook] = useState<Notebook | undefined>();

  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.project(id ?? "missing"),
    queryFn: () => projectsApi.get(id as string),
    enabled: Boolean(id),
  });
  const { data: notebooks = [] } = useQuery({
    queryKey: queryKeys.notebooks,
    queryFn: notebooksApi.list,
  });
  const { data: papers = [] } = useQuery({
    queryKey: queryKeys.papers,
    queryFn: libraryApi.list,
  });
  const { data: files = [] } = useQuery({
    queryKey: queryKeys.files,
    queryFn: filesApi.list,
  });
  const { data: activity = [] } = useQuery({
    queryKey: queryKeys.activity,
    queryFn: activityApi.list,
  });

  const recordArtifactView = useUiStore((state) => state.recordArtifactView);

  useEffect(() => {
    if (!data?.project) return;
    recordArtifactView({
      type: "project",
      id: data.project.id,
      label: data.project.title,
      href: `/app/projects/${data.project.id}`,
      projectId: data.project.id,
    });
  }, [data?.project, recordArtifactView]);

  const projectNotebooks = useMemo(
    () => notebooks.filter((notebook) => notebook.projectId === id),
    [notebooks, id],
  );
  const projectPapers = useMemo(
    () => papers.filter((paper) => paper.projectId === id),
    [papers, id],
  );
  const projectFiles = useMemo(
    () => files.filter((file) => file.projectId === id),
    [files, id],
  );
  const projectActivity = useMemo(
    () => activity.filter((event) => event.projectId === id),
    [activity, id],
  );

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.projects });
    void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    void queryClient.invalidateQueries({ queryKey: queryKeys.activity });
    if (id) void queryClient.invalidateQueries({ queryKey: queryKeys.project(id) });
  };

  const setStatus = useMutation({
    mutationFn: (status: ProjectStatus) => projectsApi.setStatus(id as string, status),
    onSuccess: (project) => {
      refresh();
      toast.success("Project status updated", {
        description: `“${project.title}” is now ${projectStatusMeta[project.status].label.toLowerCase()}.`,
      });
    },
    onError: () => toast.error("Could not update the project status"),
  });

  const removeProject = useMutation({
    mutationFn: () => projectsApi.remove(id as string),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.projects });
      void queryClient.invalidateQueries({ queryKey: queryKeys.tasks });
      void queryClient.invalidateQueries({ queryKey: queryKeys.milestones });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      void queryClient.invalidateQueries({ queryKey: queryKeys.activity });
      toast.success("Project deleted");
      navigate("/app/projects", { replace: true });
    },
    onError: () => toast.error("Could not delete the project"),
  });

  const removeTask = useMutation({
    mutationFn: (task: Task) => tasksApi.remove(task.id),
    onSuccess: () => {
      refresh();
      toast.success("Task deleted");
      setDeletingTask(undefined);
    },
  });

  const removeMilestone = useMutation({
    mutationFn: (milestone: Milestone) => milestonesApi.remove(milestone.id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.milestones });
      refresh();
      toast.success("Milestone deleted");
      setDeletingMilestone(undefined);
    },
  });

  const removeNotebook = useMutation({
    mutationFn: (notebook: Notebook) => notebooksApi.remove(notebook.id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.notebooks });
      refresh();
      toast.success("Notebook deleted");
      setDeletingNotebook(undefined);
    },
  });

  const setTab = (value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value === "overview") next.delete("tab");
    else next.set("tab", value);
    setSearchParams(next, { replace: true });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-32 animate-pulse rounded-xl border border-border bg-card" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl border border-border bg-card" />
          ))}
        </div>
        <div className="h-80 animate-pulse rounded-xl border border-border bg-card" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <EmptyState
        icon={FolderKanban}
        title="Project not found"
        description="This project may have been deleted or the link is incorrect. Return to the project portfolio to continue."
        action={
          <Button asChild>
            <Link to="/app/projects">
              <ArrowLeft className="size-4" /> Back to projects
            </Link>
          </Button>
        }
      />
    );
  }

  const { project, tasks, milestones } = data;
  const completedTasks = tasks.filter((task) => task.status === "completed").length;
  const openTasks = tasks.filter((task) => task.status !== "completed");
  const completedMilestones = milestones.filter((m) => m.status === "completed").length;
  const nextMilestone = milestones
    .filter((milestone) => milestone.status !== "completed")
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];
  const storageUsed = projectFiles.reduce((sum, file) => sum + file.size, 0);
  const daysLeft = Math.ceil(
    (new Date(project.targetDate).getTime() - Date.now()) / 86_400_000,
  );

  const addTask = () => {
    setEditingTask(undefined);
    setTaskFormOpen(true);
  };
  const addMilestone = () => {
    setEditingMilestone(undefined);
    setMilestoneFormOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/app/projects"
          className="mb-3 inline-flex items-center gap-1.5 text-[11.5px] font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> All projects
        </Link>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <ProjectStatusBadge status={project.status} />
              {project.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="font-normal">
                  {tag}
                </Badge>
              ))}
            </div>
            <h1 className="mt-2 text-[26px] font-semibold leading-tight tracking-[-0.03em] sm:text-[30px]">
              {project.title}
            </h1>
            <p className="mt-1.5 max-w-3xl text-[13.5px] leading-relaxed text-muted-foreground">
              {project.description}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11.5px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <CalendarDays className="size-3.5" />
                {formatDate(project.startDate, "MMM d, yyyy")} –{" "}
                {formatDate(project.targetDate, "MMM d, yyyy")}
              </span>
              <span className="size-1 rounded-full bg-border" />
              <span
                className={cn(
                  "flex items-center gap-1.5",
                  daysLeft < 0 && "font-medium text-rose-600 dark:text-rose-400",
                )}
              >
                <Flag className="size-3.5" />
                {daysLeft < 0
                  ? `${Math.abs(daysLeft)} days past target`
                  : `${daysLeft} days remaining`}
              </span>
              <span className="size-1 rounded-full bg-border" />
              <span className="flex items-center gap-1.5">
                <Users className="size-3.5" />
                {project.members.length} collaborators
              </span>
              <span className="size-1 rounded-full bg-border" />
              <span>Updated {fromNow(project.updatedAt)}</span>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <Pencil className="size-4" /> Edit project
            </Button>
            <Button onClick={addTask}>
              <Plus className="size-4" /> Add task
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" aria-label="More project actions">
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem asChild>
                  <Link to={`/app/projects/${project.id}?tab=activity`}>
                    <CalendarDays /> View activity
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to={`/app/projects/${project.id}/graph`}>
                    <Network /> Research graph
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to={`/app/projects/${project.id}/tree`}>
                    <ListTree /> Project tree
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => {
                    void navigator.clipboard?.writeText(
                      `${window.location.origin}/app/projects/${project.id}`,
                    );
                    toast.success("Project link copied");
                  }}
                >
                  <Copy /> Copy link
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Set status</DropdownMenuLabel>
                {(Object.keys(projectStatusMeta) as ProjectStatus[]).map((status) => (
                  <DropdownMenuItem
                    key={status}
                    disabled={project.status === status || setStatus.isPending}
                    onSelect={() => setStatus.mutate(status)}
                  >
                    {project.status === status ? <CheckCircle2 /> : <Circle />}
                    {projectStatusMeta[status].label}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem destructive onSelect={() => setDeleteOpen(true)}>
                  <Trash2 /> Delete project
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-border bg-card p-4 shadow-subtle sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 flex-1">
              <div className="mb-1.5 flex items-center justify-between text-[11.5px]">
                <span className="font-medium">Overall progress</span>
                <span className="font-semibold tabular-nums">{project.progress}%</span>
              </div>
              <Progress value={project.progress} className="h-2" />
            </div>
            <div className="flex items-center gap-4 sm:ml-6">
              <div>
                <p className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground">Tasks</p>
                <p className="text-[13px] font-semibold tabular-nums">
                  {completedTasks}/{tasks.length}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
                  Milestones
                </p>
                <p className="text-[13px] font-semibold tabular-nums">
                  {completedMilestones}/{milestones.length}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground">Team</p>
                <div className="mt-0.5">
                  <AvatarGroup people={project.members} max={4} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <div className="-mx-4 overflow-x-auto px-4 pb-1 scrollbar-thin sm:mx-0 sm:px-0">
          <TabsList className="h-auto w-max min-w-full justify-start gap-1 bg-muted p-1">
            {tabItems.map((item) => {
              const Icon = item.icon;
              return (
                <TabsTrigger key={item.value} value={item.value} className="gap-1.5 px-3 py-1.5">
                  <Icon className="size-3.5" />
                  {item.label}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Tasks completed"
              value={`${completedTasks}/${tasks.length}`}
              icon={CheckCircle2}
              accent="teal"
              hint={`${openTasks.length} still open`}
            />
            <StatCard
              label="Milestones"
              value={`${completedMilestones}/${milestones.length}`}
              icon={Flag}
              accent="indigo"
              hint={nextMilestone ? `Next ${formatDate(nextMilestone.dueDate, "MMM d")}` : "All complete"}
            />
            <StatCard
              label="Notebooks"
              value={projectNotebooks.length}
              icon={NotebookPen}
              accent="amber"
              hint={`${projectPapers.length} linked papers`}
            />
            <StatCard
              label="Files"
              value={projectFiles.length}
              icon={FolderOpen}
              accent="navy"
              hint={`${formatBytes(storageUsed)} referenced`}
            />
          </div>

          <div className="grid gap-5 xl:grid-cols-3">
            <div className="space-y-5 xl:col-span-2">
              <SectionCard title="Objectives" description="What this project is here to establish.">
                <ul className="space-y-2.5">
                  {project.objectives.map((objective, index) => (
                    <li key={objective} className="flex items-start gap-2.5 text-[12.5px] leading-relaxed">
                      <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-teal-50 text-[10px] font-semibold text-teal-700 dark:bg-teal-500/10 dark:text-teal-300">
                        {index + 1}
                      </span>
                      <span>{objective}</span>
                    </li>
                  ))}
                </ul>
              </SectionCard>

              <SectionCard
                title="Open tasks"
                description={`${openTasks.length} tasks need attention.`}
                action={
                  <Button variant="ghost" size="sm" className="h-7 px-2" onClick={addTask}>
                    <Plus className="size-3.5" /> Add
                  </Button>
                }
              >
                {openTasks.length === 0 ? (
                  <p className="py-6 text-center text-[12px] text-muted-foreground">
                    Every task in this project is complete.
                  </p>
                ) : (
                  <div className="-mx-5 -mb-5 overflow-hidden border-t border-border">
                    {openTasks.slice(0, 5).map((task) => (
                      <TaskRow
                        key={task.id}
                        task={task}
                        showProject={false}
                        onEdit={(value) => {
                          setEditingTask(value);
                          setTaskFormOpen(true);
                        }}
                        onDelete={setDeletingTask}
                      />
                    ))}
                  </div>
                )}
              </SectionCard>

              <SectionCard
                title="Milestones"
                description="Decisions and deliverables along the way."
                action={
                  <Button variant="ghost" size="sm" className="h-7 px-2" onClick={addMilestone}>
                    <Plus className="size-3.5" /> Add
                  </Button>
                }
              >
                {milestones.length === 0 ? (
                  <p className="py-6 text-center text-[12px] text-muted-foreground">
                    No milestones yet. Add one to mark an important decision or deliverable.
                  </p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {milestones.slice(0, 4).map((milestone) => (
                      <MilestoneCard
                        key={milestone.id}
                        milestone={milestone}
                        compact
                        onEdit={(value) => {
                          setEditingMilestone(value);
                          setMilestoneFormOpen(true);
                        }}
                        onDelete={setDeletingMilestone}
                      />
                    ))}
                  </div>
                )}
              </SectionCard>
            </div>

            <div className="space-y-5">
              <SectionCard title="Project details">
                <dl className="space-y-3 text-[12px]">
                  <div className="flex items-start justify-between gap-3">
                    <dt className="text-muted-foreground">Owner</dt>
                    <dd className="flex items-center gap-1.5 font-medium">
                      <PersonAvatar person={project.owner} className="size-5" />
                      {project.owner.name}
                    </dd>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <dt className="text-muted-foreground">Start date</dt>
                    <dd className="font-medium">{formatDate(project.startDate)}</dd>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <dt className="text-muted-foreground">Target date</dt>
                    <dd className="font-medium">{formatDate(project.targetDate)}</dd>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <dt className="text-muted-foreground">Status</dt>
                    <dd><ProjectStatusBadge status={project.status} /></dd>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <dt className="text-muted-foreground">Created</dt>
                    <dd className="font-medium">{formatDate(project.createdAt, "MMM d, yyyy")}</dd>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <dt className="text-muted-foreground">Storage</dt>
                    <dd className="font-medium tabular-nums">
                      {formatBytes(storageUsed)} / {formatBytes(STORAGE_LIMIT_BYTES, 0)}
                    </dd>
                  </div>
                </dl>
              </SectionCard>

              <SectionCard title="Collaborators" description={`${project.members.length} people`}>
                <ul className="space-y-3">
                  {project.members.map((member) => (
                    <li key={member.id} className="flex items-center gap-2.5">
                      <PersonAvatar person={member} className="size-7" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[12px] font-medium">{member.name}</p>
                        <p className="truncate text-[10.5px] text-muted-foreground">
                          {member.role ?? "Collaborator"}
                        </p>
                      </div>
                      {member.id === project.owner.id && (
                        <Badge variant="outline" className="text-[9px]">Owner</Badge>
                      )}
                    </li>
                  ))}
                </ul>
              </SectionCard>

              <SectionCard
                title="Recent activity"
                action={
                  <button
                    type="button"
                    onClick={() => setTab("activity")}
                    className="text-[11px] font-medium text-teal-700 hover:underline dark:text-teal-300"
                  >
                    View all
                  </button>
                }
              >
                {projectActivity.length === 0 ? (
                  <p className="py-4 text-center text-[11.5px] text-muted-foreground">
                    No activity recorded yet.
                  </p>
                ) : (
                  <ActivityTimeline events={projectActivity} projects={[project]} limit={4} />
                )}
              </SectionCard>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="tasks">
          <SectionCard
            title="Tasks"
            description={`${tasks.length} tasks · ${completedTasks} complete`}
            action={
              <Button size="sm" onClick={addTask}>
                <Plus className="size-3.5" /> New task
              </Button>
            }
            bodyClassName="px-0 pb-0"
          >
            {tasks.length === 0 ? (
              <div className="px-5 pb-5">
                <EmptyState
                  icon={CheckCircle2}
                  title="No tasks in this project"
                  description="Break the work into small, owned next actions so progress is visible."
                  action={<Button onClick={addTask}><Plus className="size-4" /> Add task</Button>}
                />
              </div>
            ) : (
              <div className="overflow-hidden border-t border-border">
                {[...tasks]
                  .sort((a, b) => {
                    if (a.status === "completed" && b.status !== "completed") return 1;
                    if (b.status === "completed" && a.status !== "completed") return -1;
                    return (a.dueDate ?? "").localeCompare(b.dueDate ?? "");
                  })
                  .map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      showProject={false}
                      onEdit={(value) => {
                        setEditingTask(value);
                        setTaskFormOpen(true);
                      }}
                      onDelete={setDeletingTask}
                    />
                  ))}
              </div>
            )}
          </SectionCard>
        </TabsContent>

        <TabsContent value="milestones">
          <SectionCard
            title="Milestones"
            description="Important decisions, deliverables, and gates."
            action={
              <Button size="sm" onClick={addMilestone}>
                <Plus className="size-3.5" /> New milestone
              </Button>
            }
          >
            {milestones.length === 0 ? (
              <p className="py-8 text-center text-[12px] text-muted-foreground">
                No milestones yet.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {milestones.map((milestone) => (
                  <MilestoneCard
                    key={milestone.id}
                    milestone={milestone}
                    onEdit={(value) => {
                      setEditingMilestone(value);
                      setMilestoneFormOpen(true);
                    }}
                    onDelete={setDeletingMilestone}
                  />
                ))}
              </div>
            )}
          </SectionCard>
        </TabsContent>

        <TabsContent value="notebooks">
          <SectionCard
            title="Project notebooks"
            description="Protocols, analyses, and research decisions."
            action={
              <Button
                size="sm"
                onClick={() => openCreate("notebook", { projectId: project.id })}
              >
                <Plus className="size-3.5" /> New notebook
              </Button>
            }
          >
            {projectNotebooks.length === 0 ? (
              <EmptyState
                icon={NotebookPen}
                title="No notebooks linked"
                description="Create a notebook to capture methods, observations, and decisions for this project."
                action={
                  <Button onClick={() => openCreate("notebook", { projectId: project.id })}>
                    <NotebookPen className="size-4" /> New notebook
                  </Button>
                }
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
                {projectNotebooks.map((notebook) => (
                  <NotebookCard
                    key={notebook.id}
                    notebook={notebook}
                    projectTitle={project.title}
                    onDelete={setDeletingNotebook}
                  />
                ))}
              </div>
            )}
          </SectionCard>
        </TabsContent>

        <TabsContent value="papers">
          <SectionCard
            title="Linked papers"
            description="Literature attached to this project."
            action={
              <Button size="sm" variant="outline" asChild>
                <Link to="/app/library">
                  <Library className="size-3.5" /> Open library
                </Link>
              </Button>
            }
            bodyClassName="px-0 pb-0"
          >
            {projectPapers.length === 0 ? (
              <div className="px-5 pb-5">
                <EmptyState
                  icon={Library}
                  title="No papers linked"
                  description="Add citations in the research library and associate them with this project."
                  action={
                    <Button asChild>
                      <Link to="/app/library">Go to library</Link>
                    </Button>
                  }
                />
              </div>
            ) : (
              <div className="border-t border-border">
                {projectPapers.map((paper) => (
                  <Link
                    key={paper.id}
                    to={`/app/library?paper=${paper.id}`}
                    className="group flex items-start gap-3 border-b border-border px-4 py-3.5 transition-colors last:border-b-0 hover:bg-muted/30"
                  >
                    <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-300">
                      <BookOpen className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-[12.5px] font-medium leading-snug group-hover:text-teal-700 dark:group-hover:text-teal-300">
                        {paper.title}
                      </p>
                      <p className="mt-0.5 truncate text-[10.5px] text-muted-foreground">
                        {paper.authors.join(", ")} · {paper.year} · {paper.journal}
                      </p>
                    </div>
                    <PaperStatusBadge status={paper.readStatus} />
                    <ArrowUpRight className="mt-1 size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </Link>
                ))}
              </div>
            )}
          </SectionCard>
        </TabsContent>

        <TabsContent value="files">
          <SectionCard
            title="Project files"
            description="Datasets, manuscripts, figures, and protocols."
            action={
              <Button
                size="sm"
                variant="outline"
                onClick={() => openCreate("upload", { projectId: project.id })}
              >
                <Plus className="size-3.5" /> Add files
              </Button>
            }
            bodyClassName="px-0 pb-0"
          >
            {projectFiles.length === 0 ? (
              <div className="px-5 pb-5">
                <EmptyState
                  icon={FolderOpen}
                  title="No files linked"
                  description="Add file records for this project's datasets, manuscripts, and figures."
                  action={
                    <Button onClick={() => openCreate("upload", { projectId: project.id })}>
                      <FolderOpen className="size-4" /> Add files
                    </Button>
                  }
                />
              </div>
            ) : (
              <div className="border-t border-border">
                {projectFiles.map((file) => (
                  <Link
                    key={file.id}
                    to={`/app/files?file=${file.id}`}
                    className="group flex items-center gap-3 border-b border-border px-4 py-3 transition-colors last:border-b-0 hover:bg-muted/30"
                  >
                    <FileKindIcon kind={file.kind} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12.5px] font-medium group-hover:text-teal-700 dark:group-hover:text-teal-300">
                        {file.name}
                      </p>
                      <p className="truncate text-[10.5px] text-muted-foreground">
                        {formatBytes(file.size)} · uploaded by {file.uploadedBy.name} ·{" "}
                        {fromNow(file.uploadedAt)}
                      </p>
                    </div>
                    <span className="text-[10.5px] text-muted-foreground">
                      {formatDate(file.uploadedAt, "MMM d")}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </SectionCard>
        </TabsContent>

        <TabsContent value="activity">
          <SectionCard
            title="Project activity"
            description={`${projectActivity.length} recorded events for this project.`}
          >
            {projectActivity.length === 0 ? (
              <p className="py-8 text-center text-[12px] text-muted-foreground">
                No activity recorded yet. Changes to tasks, notebooks, papers, and files will
                appear here.
              </p>
            ) : (
              <ActivityTimeline events={projectActivity} projects={[project]} grouped />
            )}
          </SectionCard>
        </TabsContent>
      </Tabs>

      <ProjectFormDialog open={editOpen} onOpenChange={setEditOpen} project={project} />

      <TaskFormDialog
        open={taskFormOpen}
        onOpenChange={(open) => {
          setTaskFormOpen(open);
          if (!open) setEditingTask(undefined);
        }}
        defaultProjectId={project.id}
        task={editingTask}
      />

      <MilestoneFormDialog
        open={milestoneFormOpen}
        onOpenChange={(open) => {
          setMilestoneFormOpen(open);
          if (!open) setEditingMilestone(undefined);
        }}
        defaultProjectId={project.id}
        milestone={editingMilestone}
      />

      <ConfirmDialog
        open={Boolean(deletingTask)}
        onOpenChange={(open) => !open && setDeletingTask(undefined)}
        title="Delete this task?"
        description={<>“{deletingTask?.title}” will be removed from this project.</>}
        confirmLabel="Delete task"
        onConfirm={() => {
          if (deletingTask) removeTask.mutate(deletingTask);
        }}
      />

      <ConfirmDialog
        open={Boolean(deletingMilestone)}
        onOpenChange={(open) => !open && setDeletingMilestone(undefined)}
        title="Delete this milestone?"
        description={<>“{deletingMilestone?.title}” will be removed from this project.</>}
        confirmLabel="Delete milestone"
        onConfirm={() => {
          if (deletingMilestone) removeMilestone.mutate(deletingMilestone);
        }}
      />

      <ConfirmDialog
        open={Boolean(deletingNotebook)}
        onOpenChange={(open) => !open && setDeletingNotebook(undefined)}
        title="Delete this notebook?"
        description={<>“{deletingNotebook?.title}” and its entries will be removed.</>}
        confirmLabel="Delete notebook"
        onConfirm={() => {
          if (deletingNotebook) removeNotebook.mutate(deletingNotebook);
        }}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete this project?"
        description={
          <>
            <strong>{project.title}</strong> will be removed along with its tasks and milestones.
            Notebooks, papers, and files will be unlinked but kept.
          </>
        }
        confirmLabel="Delete project"
        onConfirm={() => removeProject.mutate()}
      />

      <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <Link2 className="size-3" />
        {deadlineLabel(project.targetDate)} · project changes are saved in your local demo
        workspace.
      </p>
    </div>
  );
}
