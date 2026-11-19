import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  CalendarClock,
  CheckSquare,
  ClipboardCheck,
  Clock,
  FileText,
  Flag,
  Flame,
  FolderKanban,
  FolderPlus,
  Microscope,
  NotebookPen,
  PlayCircle,
  ShieldAlert,
  Sparkles,
  UploadCloud,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format } from "date-fns";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { SectionCard } from "@/components/shared/section-card";
import { ProjectStatusBadge, PaperStatusBadge } from "@/components/shared/status-badge";
import { ActivityTimeline } from "@/components/shared/activity-timeline";
import { AvatarGroup } from "@/components/shared/avatar-group";
import { EmptyState } from "@/components/shared/empty-state";
import { DashboardSkeleton } from "@/components/shared/skeletons";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useCreateDialogs } from "@/components/navigation/create-dialogs-provider";
import { MomentumCalendar } from "@/components/shared/momentum-calendar";
import { ResearchLogItem } from "@/features/research-log/components/research-log-item";
import { formatDuration } from "@/features/research-log/lib";
import { useUiStore } from "@/store/ui-store";
import {
  buildMomentumDays,
  computeStreak,
  type MomentumEntry,
} from "@/lib/momentum";
import { queryKeys } from "@/lib/query-keys";
import {
  daysUntil,
  deadlineLabel,
  formatDate,
  formatNumber,
  fromNow,
  isToday,
} from "@/lib/format";
import { projectAccentClasses } from "@/lib/constants";
import type { ArtifactType } from "@/types";
import { dashboardApi } from "../api";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: dashboardApi.get,
  });
  const { openCreate } = useCreateDialogs();
  const recentArtifacts = useUiStore((state) => state.recentArtifacts);

  if (isLoading || !data) {
    return <DashboardSkeleton />;
  }

  const {
    stats,
    projects,
    tasks,
    milestones,
    notebooks,
    papers,
    activity,
    analytics,
    researchLog,
    notifications,
  } = data;
  const activeProjects = projects.filter((item) => item.project.status === "active");
  const firstName = data.user.name.replace(/^Dr\.\s*/, "").split(" ")[0];

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayIso = todayStart.toISOString();

  const todayLog = researchLog.filter((entry) => isToday(entry.occurredAt));
  const todayMinutes = todayLog.reduce((sum, entry) => sum + entry.durationMinutes, 0);
  const openReviews = notifications.filter(
    (notification) => notification.kind === "review" && !notification.read,
  );
  const overdueTasks = tasks
    .filter(
      (task) =>
        task.status !== "completed" && task.dueDate && task.dueDate < todayIso,
    )
    .sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? ""));
  const todaysDeadlines = [
    ...tasks
      .filter(
        (task) =>
          task.status !== "completed" &&
          task.dueDate &&
          isToday(task.dueDate),
      )
      .map((task) => ({ id: task.id, title: task.title, projectId: task.projectId })),
    ...milestones
      .filter(
        (milestone) =>
          milestone.status !== "completed" && isToday(milestone.dueDate),
      )
      .map((milestone) => ({
        id: milestone.id,
        title: milestone.title,
        projectId: milestone.projectId,
      })),
  ];

  const momentumEntries: MomentumEntry[] = [
    ...activity.map((event) => ({ createdAt: event.createdAt })),
    ...researchLog.map((entry) => ({
      createdAt: entry.occurredAt,
      minutes: entry.durationMinutes,
    })),
  ];
  const momentumDays = buildMomentumDays(momentumEntries, { weeks: 12 });
  const streak = computeStreak(momentumDays);
  const weekMinutes = researchLog
    .filter((entry) => new Date(entry.occurredAt) >= new Date(Date.now() - 7 * 86_400_000))
    .reduce((sum, entry) => sum + entry.durationMinutes, 0);

  const continueItems = recentArtifacts.slice(0, 4);

  const continueIcon: Record<ArtifactType, typeof FolderKanban> = {
    project: FolderKanban,
    task: CheckSquare,
    notebook: NotebookPen,
    paper: BookOpen,
    file: FileText,
    milestone: Flag,
  };

  const upcoming = [
    ...milestones
      .filter((milestone) => milestone.status !== "completed")
      .map((milestone) => ({
        id: milestone.id,
        kind: "milestone" as const,
        title: milestone.title,
        projectId: milestone.projectId,
        dueDate: milestone.dueDate,
      })),
    ...tasks
      .filter((task) => task.status !== "completed" && task.dueDate)
      .map((task) => ({
        id: task.id,
        kind: "task" as const,
        title: task.title,
        projectId: task.projectId,
        dueDate: task.dueDate as string,
      })),
  ]
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 5);

  const projectTitle = (id: string | null) =>
    projects.find((item) => item.project.id === id)?.project.title;

  const recentNotebooks = [...notebooks]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 2);
  const recentPapers = [...papers]
    .sort((a, b) => b.addedAt.localeCompare(a.addedAt))
    .slice(0, 3);

  const quickActions = [
    { label: "Log activity", icon: Microscope, onClick: () => openCreate("log") },
    { label: "New project", icon: FolderPlus, onClick: () => openCreate("project") },
    { label: "New task", icon: CheckSquare, onClick: () => openCreate("task") },
    { label: "New notebook", icon: NotebookPen, onClick: () => openCreate("notebook") },
    { label: "Upload file", icon: UploadCloud, onClick: () => openCreate("upload") },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={format(new Date(), "EEEE, MMMM d, yyyy")}
        title={`${greeting()}, ${firstName}.`}
        description={`You have ${formatNumber(stats.pendingTasks)} open tasks across ${formatNumber(
          stats.activeProjects,
        )} active projects. Here is what deserves your attention today.`}
        actions={
          <>
            <Button variant="outline" asChild>
              <Link to="/app/tasks">
                <CheckSquare className="size-4" />
                Review tasks
              </Link>
            </Button>
            <Button onClick={() => openCreate("project")}>
              <FolderPlus className="size-4" />
              New project
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Active projects"
          value={stats.activeProjects}
          icon={FolderKanban}
          accent="teal"
          hint={`${projects.filter((p) => p.project.status === "planning").length} in planning`}
        />
        <StatCard
          label="Completed projects"
          value={stats.completedProjects}
          icon={Sparkles}
          accent="indigo"
          hint="Archived in this workspace"
        />
        <StatCard
          label="Pending tasks"
          value={stats.pendingTasks}
          icon={CheckSquare}
          accent="amber"
          hint={
            stats.overdueTasks > 0
              ? `${stats.overdueTasks} overdue · needs attention`
              : "Nothing overdue"
          }
        />
        <StatCard
          label="Research documents"
          value={formatNumber(stats.documents)}
          icon={FileText}
          accent="navy"
          hint={`${stats.notebookEntries} notes · ${stats.libraryPapers} papers · ${data.files.length} files`}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <SectionCard
          className="xl:col-span-2"
          title="Continue working"
          description="Recently opened notebooks, papers, and projects — plus fresh material."
          action={
            <Link
              to="/app/log"
              className="flex items-center gap-1 text-[11.5px] font-medium text-teal-700 hover:underline dark:text-teal-300"
            >
              Research log <ArrowRight className="size-3" />
            </Link>
          }
        >
          {continueItems.length === 0 ? (
            <ul className="grid gap-2 sm:grid-cols-2">
              {recentNotebooks.map((notebook) => (
                <li key={notebook.id}>
                  <Link
                    to={`/app/notebooks/${notebook.id}`}
                    className="group flex items-start gap-2.5 rounded-lg border border-border bg-muted/20 p-3 transition-colors hover:border-teal-300 hover:bg-card dark:hover:border-teal-500/30"
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-card text-amber-600 shadow-subtle dark:text-amber-300">
                      <NotebookPen className="size-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[12.5px] font-medium group-hover:text-teal-700 dark:group-hover:text-teal-300">
                        {notebook.title}
                      </span>
                      <span className="mt-0.5 block text-[10.5px] text-muted-foreground">
                        {notebook.entries.length} entries · {fromNow(notebook.updatedAt)}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
              {recentPapers.slice(0, 2).map((paper) => (
                <li key={paper.id}>
                  <Link
                    to={`/app/library?paper=${paper.id}`}
                    className="group flex items-start gap-2.5 rounded-lg border border-border bg-muted/20 p-3 transition-colors hover:border-teal-300 hover:bg-card dark:hover:border-teal-500/30"
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-card text-sky-600 shadow-subtle dark:text-sky-300">
                      <BookOpen className="size-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="line-clamp-1 text-[12.5px] font-medium group-hover:text-teal-700 dark:group-hover:text-teal-300">
                        {paper.title}
                      </span>
                      <span className="mt-0.5 block text-[10.5px] text-muted-foreground">
                        {paper.year} · {paper.journal}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2">
              {continueItems.map((artifact) => {
                const Icon = continueIcon[artifact.type];
                return (
                  <li key={`${artifact.type}:${artifact.id}`}>
                    <Link
                      to={artifact.href}
                      className="group flex items-start gap-2.5 rounded-lg border border-border bg-muted/20 p-3 transition-colors hover:border-teal-300 hover:bg-card dark:hover:border-teal-500/30"
                    >
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-card text-teal-700 shadow-subtle dark:text-teal-300">
                        <Icon className="size-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="line-clamp-1 text-[12.5px] font-medium group-hover:text-teal-700 dark:group-hover:text-teal-300">
                          {artifact.label}
                        </span>
                        <span className="mt-0.5 block text-[10.5px] text-muted-foreground">
                          {artifact.type} · opened {fromNow(artifact.viewedAt)}
                        </span>
                      </span>
                      <PlayCircle className="ml-auto mt-1 size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </SectionCard>

        <SectionCard
          title="Research streak"
          description="Twelve weeks of logged research activity."
          action={
            <Badge variant={streak > 0 ? "success" : "neutral"} className="gap-1 font-normal">
              <Flame className="size-3" />
              {streak} {streak === 1 ? "day" : "days"}
            </Badge>
          }
        >
          <MomentumCalendar entries={momentumEntries} weeks={12} />
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-muted/50 px-2.5 py-2">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Focused today
              </p>
              <p className="mt-0.5 text-[15px] font-semibold tabular-nums">
                {formatDuration(todayMinutes)}
              </p>
            </div>
            <div className="rounded-lg bg-muted/50 px-2.5 py-2">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Last 7 days
              </p>
              <p className="mt-0.5 text-[15px] font-semibold tabular-nums">
                {formatDuration(weekMinutes)}
              </p>
            </div>
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <SectionCard
          className="xl:col-span-2"
          title="Today's research log"
          description="What you have logged so far today."
          action={
            <Button size="sm" variant="outline" onClick={() => openCreate("log")}>
              <Microscope className="size-3.5" />
              Log activity
            </Button>
          }
        >
          {todayLog.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <span className="mb-2 flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <Microscope className="size-5" />
              </span>
              <p className="text-[13px] font-medium">Nothing logged today yet</p>
              <p className="mt-1 max-w-xs text-[12px] text-muted-foreground">
                Capture what you work on to keep Today, your log, and the feed
                accurate.
              </p>
              <Button size="sm" className="mt-3" onClick={() => openCreate("log")}>
                <Microscope className="size-3.5" />
                Log something now
              </Button>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {todayLog.slice(0, 4).map((entry) => (
                <li key={entry.id}>
                  <ResearchLogItem entry={entry} compact />
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard
          title="Open review requests"
          description="Reviews waiting on you."
          action={
            <Link
              to="/app/notifications?tab=reviews"
              className="flex items-center gap-1 text-[11.5px] font-medium text-teal-700 hover:underline dark:text-teal-300"
            >
              Reviews <ArrowRight className="size-3" />
            </Link>
          }
        >
          {openReviews.length === 0 ? (
            <p className="py-8 text-center text-[12px] text-muted-foreground">
              No open review requests. You are all caught up.
            </p>
          ) : (
            <ul className="space-y-2">
              {openReviews.map((notification) => (
                <li key={notification.id}>
                  <Link
                    to={notification.href ?? "/app/notifications"}
                    className="group flex items-start gap-2.5 rounded-lg border border-border bg-muted/20 p-2.5 transition-colors hover:border-rose-300 hover:bg-card dark:hover:border-rose-500/30"
                  >
                    <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300">
                      <ClipboardCheck className="size-3.5" />
                    </span>
                    <span className="min-w-0">
                      <span className="line-clamp-2 text-[12px] font-medium leading-snug group-hover:text-rose-700 dark:group-hover:text-rose-300">
                        {notification.title}
                      </span>
                      <span className="mt-0.5 block text-[10px] text-muted-foreground">
                        {fromNow(notification.createdAt)}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <SectionCard
          title="Overdue tasks"
          description="Work that slipped past its due date."
          action={
            <Badge variant={overdueTasks.length > 0 ? "danger" : "neutral"} className="font-normal">
              {overdueTasks.length}
            </Badge>
          }
        >
          {overdueTasks.length === 0 ? (
            <p className="py-6 text-center text-[12px] text-muted-foreground">
              Nothing overdue. Nicely held.
            </p>
          ) : (
            <ul className="space-y-1">
              {overdueTasks.slice(0, 4).map((task) => (
                <li key={task.id}>
                  <Link
                    to="/app/tasks"
                    className="group flex items-center gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-muted/60"
                  >
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300">
                      <ShieldAlert className="size-3.5" />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium group-hover:text-teal-700 dark:group-hover:text-teal-300">
                      {task.title}
                    </span>
                    <span className="shrink-0 rounded-full bg-rose-50 px-2 py-0.5 text-[9.5px] font-semibold text-rose-600 dark:bg-rose-500/10 dark:text-rose-300">
                      {task.dueDate ? deadlineLabel(task.dueDate) : "Overdue"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard
          title="Today's deadlines"
          description="Due before the day is out."
          action={
            <Badge variant={todaysDeadlines.length > 0 ? "warning" : "neutral"} className="font-normal">
              {todaysDeadlines.length}
            </Badge>
          }
        >
          {todaysDeadlines.length === 0 ? (
            <p className="py-6 text-center text-[12px] text-muted-foreground">
              No deadlines today. Use the room to move research forward.
            </p>
          ) : (
            <ul className="space-y-1">
              {todaysDeadlines.slice(0, 4).map((item) => (
                <li key={item.id}>
                  <Link
                    to={item.projectId ? `/app/projects/${item.projectId}` : "/app/tasks"}
                    className="group flex items-center gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-muted/60"
                  >
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                      <Clock className="size-3.5" />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium group-hover:text-teal-700 dark:group-hover:text-teal-300">
                      {item.title}
                    </span>
                    <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[9.5px] font-semibold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                      Due today
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <SectionCard
          className="xl:col-span-2"
          title="Research momentum"
          description="Completed tasks and notebook entries over the last eight weeks."
          action={
            <div className="flex items-center gap-3 text-[10.5px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-sm bg-teal-500" /> Tasks
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-sm bg-indigo-400" /> Notes
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-sm bg-slate-300 dark:bg-slate-600" /> Papers
              </span>
            </div>
          }
        >
          <div className="mb-1 flex items-end gap-6">
            <div>
              <p className="text-[26px] font-semibold leading-none tracking-[-0.03em]">
                {analytics.reduce((sum, point) => sum + point.tasks, 0)}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">tasks completed</p>
            </div>
            <div>
              <p className="text-[26px] font-semibold leading-none tracking-[-0.03em]">
                {analytics.reduce((sum, point) => sum + point.notes, 0)}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">notebook entries</p>
            </div>
            <Badge variant="success" className="mb-1 ml-auto">
              +18% vs prior period
            </Badge>
          </div>
          <div className="h-[230px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics} margin={{ top: 16, right: 4, left: -28, bottom: 0 }}>
                <defs>
                  <linearGradient id="tasksGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0D9488" stopOpacity={0.24} />
                    <stop offset="100%" stopColor="#0D9488" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="notesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366F1" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="#6366F1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="week"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10.5, fill: "hsl(var(--muted-foreground))" }}
                  dy={6}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10.5, fill: "hsl(var(--muted-foreground))" }}
                  width={38}
                />
                <RechartsTooltip
                  contentStyle={{
                    borderRadius: 10,
                    border: "1px solid hsl(var(--border))",
                    background: "hsl(var(--popover))",
                    fontSize: 11.5,
                    boxShadow: "0 8px 24px -8px rgb(16 24 40 / 0.18)",
                    color: "hsl(var(--popover-foreground))",
                  }}
                  labelStyle={{ fontWeight: 600, marginBottom: 4 }}
                />
                <Area
                  type="monotone"
                  dataKey="tasks"
                  name="Tasks"
                  stroke="#0D9488"
                  strokeWidth={2}
                  fill="url(#tasksGradient)"
                />
                <Area
                  type="monotone"
                  dataKey="notes"
                  name="Notes"
                  stroke="#6366F1"
                  strokeWidth={1.8}
                  fill="url(#notesGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard
          title="Upcoming deadlines"
          description="The next things that need a decision."
          action={
            <Link
              to="/app/tasks"
              className="flex items-center gap-1 text-[11.5px] font-medium text-teal-700 hover:underline dark:text-teal-300"
            >
              View all <ArrowRight className="size-3" />
            </Link>
          }
        >
          {upcoming.length === 0 ? (
            <p className="py-8 text-center text-[12px] text-muted-foreground">
              No upcoming deadlines. Enjoy the clear runway.
            </p>
          ) : (
            <ul className="space-y-1">
              {upcoming.map((item) => {
                const days = daysUntil(item.dueDate);
                const overdue = days < 0;
                const soon = days >= 0 && days <= 3;
                return (
                  <li key={`${item.kind}-${item.id}`}>
                    <Link
                      to={item.projectId ? `/app/projects/${item.projectId}` : "/app/tasks"}
                      className="group flex items-start gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-muted/60"
                    >
                      <span
                        className={
                          item.kind === "milestone"
                            ? "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300"
                            : "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300"
                        }
                      >
                        {item.kind === "milestone" ? (
                          <Flag className="size-3.5" />
                        ) : (
                          <CheckSquare className="size-3.5" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[12.5px] font-medium leading-snug group-hover:text-teal-700 dark:group-hover:text-teal-300">
                          {item.title}
                        </span>
                        <span className="mt-0.5 block truncate text-[10.5px] text-muted-foreground">
                          {projectTitle(item.projectId) ?? "Workspace"}
                        </span>
                      </span>
                      <span
                        className={
                          overdue
                            ? "shrink-0 rounded-full bg-rose-50 px-2 py-0.5 text-[9.5px] font-semibold text-rose-600 dark:bg-rose-500/10 dark:text-rose-300"
                            : soon
                              ? "shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[9.5px] font-semibold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"
                              : "shrink-0 rounded-full bg-muted px-2 py-0.5 text-[9.5px] font-medium text-muted-foreground"
                        }
                      >
                        {deadlineLabel(item.dueDate)}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </SectionCard>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <SectionCard
          className="xl:col-span-2"
          title="Active research"
          description="Portfolio progress across your current projects."
          action={
            <Link
              to="/app/projects"
              className="flex items-center gap-1 text-[11.5px] font-medium text-teal-700 hover:underline dark:text-teal-300"
            >
              All projects <ArrowRight className="size-3" />
            </Link>
          }
        >
          {activeProjects.length === 0 ? (
            <EmptyState
              icon={FolderKanban}
              title="No active projects"
              description="Start a project to track progress, milestones, and research notes."
              action={<Button onClick={() => openCreate("project")}>Create project</Button>}
            />
          ) : (
            <ul className="divide-y divide-border">
              {activeProjects.slice(0, 4).map((summary) => {
                const { project } = summary;
                const accent = projectAccentClasses[project.accent];
                return (
                  <li key={project.id}>
                    <Link
                      to={`/app/projects/${project.id}`}
                      className="group -mx-2 grid gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-muted/40 sm:grid-cols-[minmax(0,1fr)_130px_120px] sm:items-center"
                    >
                      <div className="flex min-w-0 items-start gap-3">
                        <span className={`mt-1 size-2 shrink-0 rounded-full ${accent.dot}`} />
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-medium group-hover:text-teal-700 dark:group-hover:text-teal-300">
                            {project.title}
                          </p>
                          <div className="mt-1 flex items-center gap-2">
                            <ProjectStatusBadge status={project.status} />
                            {summary.nextMilestone && (
                              <span className="hidden items-center gap-1 truncate text-[10.5px] text-muted-foreground sm:flex">
                                <CalendarClock className="size-3" />
                                {formatDate(summary.nextMilestone.dueDate, "MMM d")}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={project.progress} className="h-1.5 flex-1" />
                        <span className="w-8 text-right text-[11px] font-semibold tabular-nums text-muted-foreground">
                          {project.progress}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 sm:justify-end">
                        <span className="text-[10.5px] text-muted-foreground">
                          {summary.completedTaskCount}/{summary.taskCount} tasks
                        </span>
                        <AvatarGroup people={project.members} max={3} />
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </SectionCard>

        <SectionCard
          title="Recent activity"
          description="What changed across the lab."
          action={
            <Link
              to="/app/activity"
              className="flex items-center gap-1 text-[11.5px] font-medium text-teal-700 hover:underline dark:text-teal-300"
            >
              View all <ArrowRight className="size-3" />
            </Link>
          }
        >
          <ActivityTimeline
            events={activity}
            projects={projects.map((item) => item.project)}
            limit={5}
          />
        </SectionCard>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <SectionCard
          title="Recent notebooks"
          action={
            <Link
              to="/app/notebooks"
              className="text-[11.5px] font-medium text-teal-700 hover:underline dark:text-teal-300"
            >
              Browse
            </Link>
          }
        >
          <div className="space-y-3">
            {recentNotebooks.map((notebook) => (
              <Link
                key={notebook.id}
                to={`/app/notebooks/${notebook.id}`}
                className="group block rounded-lg border border-border bg-muted/20 p-3 transition-colors hover:border-teal-300 hover:bg-card dark:hover:border-teal-500/30"
              >
                <div className="flex items-start gap-2.5">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-card text-amber-600 shadow-subtle dark:text-amber-300">
                    <NotebookPen className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[12.5px] font-medium group-hover:text-teal-700 dark:group-hover:text-teal-300">
                      {notebook.title}
                    </p>
                    <p className="mt-0.5 truncate text-[10.5px] text-muted-foreground">
                      {notebook.entries.length} entries · {fromNow(notebook.updatedAt)}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
            <button
              type="button"
              onClick={() => openCreate("notebook")}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border py-2 text-[11.5px] font-medium text-muted-foreground transition-colors hover:border-teal-400 hover:text-teal-700 dark:hover:text-teal-300"
            >
              <NotebookPen className="size-3.5" /> New notebook
            </button>
          </div>
        </SectionCard>

        <SectionCard
          title="Recently added papers"
          action={
            <Link
              to="/app/library"
              className="text-[11.5px] font-medium text-teal-700 hover:underline dark:text-teal-300"
            >
              Library
            </Link>
          }
        >
          <ul className="space-y-3">
            {recentPapers.map((paper) => (
              <li key={paper.id}>
                <Link
                  to={`/app/library?paper=${paper.id}`}
                  className="group flex items-start gap-2.5"
                >
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-300">
                    <BookOpen className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-2 text-[12px] font-medium leading-snug group-hover:text-teal-700 dark:group-hover:text-teal-300">
                      {paper.title}
                    </span>
                    <span className="mt-1 flex items-center gap-2">
                      <span className="truncate text-[10.5px] text-muted-foreground">
                        {paper.year} · {paper.journal}
                      </span>
                      <PaperStatusBadge status={paper.readStatus} />
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard title="Quick actions" description="Add something in two clicks.">
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  type="button"
                  onClick={action.onClick}
                  className="group flex flex-col items-start gap-2 rounded-lg border border-border bg-card p-3 text-left transition-all hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-raised dark:hover:border-teal-500/30"
                >
                  <span className="flex size-8 items-center justify-center rounded-md bg-muted text-muted-foreground transition-colors group-hover:bg-teal-50 group-hover:text-teal-700 dark:group-hover:bg-teal-500/10 dark:group-hover:text-teal-300">
                    <Icon className="size-4" />
                  </span>
                  <span className="text-[11.5px] font-medium">{action.label}</span>
                </button>
              );
            })}
          </div>
          <p className="mt-3 rounded-md bg-muted/50 px-2.5 py-2 text-[10px] leading-relaxed text-muted-foreground">
            This is a local demo workspace. Everything you add is saved in your browser only.
          </p>
        </SectionCard>
      </div>
    </div>
  );
}
