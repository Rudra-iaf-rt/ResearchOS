import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  CalendarRange,
  Clock,
  Flame,
  Plus,
  SearchX,
  Sparkles,
  Timer,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { SearchInput } from "@/components/shared/search-input";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { queryKeys } from "@/lib/query-keys";
import { researchModeMeta, researchModes } from "@/lib/constants";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ResearchMode } from "@/types";
import { projectsApi } from "@/features/projects/api";
import { researchLogApi } from "../api";
import {
  filterLogViews,
  formatDuration,
  groupLogViews,
  modeBreakdown,
  summarizeLog,
  type LogDateRange,
  type ResearchLogView,
} from "../lib";
import { researchModeIcons } from "../mode-icons";
import { ResearchLogFormDialog } from "../components/research-log-form-dialog";
import { ResearchLogItem } from "../components/research-log-item";

const dateRanges: { value: LogDateRange; label: string }[] = [
  { value: "all", label: "All time" },
  { value: "today", label: "Today" },
  { value: "week", label: "Last 7 days" },
  { value: "month", label: "Last 30 days" },
];

export function ResearchLogPage() {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<ResearchMode | "all">("all");
  const [projectId, setProjectId] = useState("all");
  const [range, setRange] = useState<LogDateRange>("all");
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ResearchLogView | null>(null);
  const [deleting, setDeleting] = useState<ResearchLogView | null>(null);

  const { data: entries = [], isLoading, isError } = useQuery({
    queryKey: queryKeys.researchLog,
    queryFn: researchLogApi.list,
  });
  const { data: projects = [] } = useQuery({
    queryKey: queryKeys.projects,
    queryFn: projectsApi.list,
  });

  const filtered = useMemo(
    () => filterLogViews(entries, { mode, projectId, range, search }),
    [entries, mode, projectId, range, search],
  );
  const groups = useMemo(() => groupLogViews(filtered), [filtered]);
  const breakdown = useMemo(() => modeBreakdown(filtered), [filtered]);
  const summary = useMemo(() => summarizeLog(entries), [entries]);

  const counts = useMemo(() => {
    const result: Record<string, number> = { all: entries.length };
    entries.forEach((entry) => {
      result[entry.mode] = (result[entry.mode] ?? 0) + 1;
    });
    return result;
  }, [entries]);

  const isFiltered =
    mode !== "all" || projectId !== "all" || range !== "all" || Boolean(search.trim());
  const hasBreakdown = breakdown.some((point) => point.minutes > 0);

  const clearFilters = () => {
    setMode("all");
    setProjectId("all");
    setRange("all");
    setSearch("");
  };

  const remove = useMutation({
    mutationFn: (id: string) => researchLogApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.researchLog });
      void queryClient.invalidateQueries({ queryKey: queryKeys.feed });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      void queryClient.invalidateQueries({ queryKey: queryKeys.activity });
      toast.success("Research log entry deleted");
      setDeleting(null);
    },
    onError: (error) =>
      toast.error("Could not delete the entry", {
        description: error instanceof Error ? error.message : undefined,
      }),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Daily research experience"
        title="Research log"
        description="Record where your focused time went — reading, writing, experiments, analysis, review, and admin — so your momentum and research feed reflect real work."
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="size-4" />
            Log activity
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Focus today"
          value={formatDuration(summary.todayMinutes)}
          icon={Timer}
          accent="teal"
          hint={`${formatNumber(summary.todayEntries)} ${summary.todayEntries === 1 ? "entry" : "entries"} today`}
        />
        <StatCard
          label="This week"
          value={formatDuration(summary.weekMinutes)}
          icon={Clock}
          accent="indigo"
          hint={`${formatNumber(summary.weekEntries)} entries across ${summary.activeDays} days`}
        />
        <StatCard
          label="Active days"
          value={summary.activeDays}
          icon={CalendarRange}
          accent="amber"
          hint="Days with logged work in the last week"
        />
        <StatCard
          label="Primary mode"
          value={
            summary.topMode ? researchModeMeta[summary.topMode].label : "—"
          }
          icon={Flame}
          accent="navy"
          hint={
            summary.topMode
              ? researchModeMeta[summary.topMode].description
              : "Log work to see your balance"
          }
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <SectionCard
          className="xl:col-span-2"
          title="Activity mode distribution"
          description={
            isFiltered
              ? "Focus time across the filtered entries."
              : "How your logged research time is distributed."
          }
          action={
            <Badge variant="outline" className="font-normal">
              {formatDuration(breakdown.reduce((sum, point) => sum + point.minutes, 0))} total
            </Badge>
          }
        >
          {hasBreakdown ? (
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={breakdown}
                  margin={{ top: 12, right: 4, left: -20, bottom: 0 }}
                >
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 10.5, fill: "hsl(var(--muted-foreground))" }}
                    dy={4}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 10.5, fill: "hsl(var(--muted-foreground))" }}
                    width={42}
                    unit="m"
                  />
                  <RechartsTooltip
                    cursor={{ fill: "hsl(var(--muted))" }}
                    contentStyle={{
                      borderRadius: 10,
                      border: "1px solid hsl(var(--border))",
                      background: "hsl(var(--popover))",
                      fontSize: 11.5,
                      color: "hsl(var(--popover-foreground))",
                    }}
                    formatter={(value: number) => [formatDuration(value), "Focus time"]}
                  />
                  <Bar dataKey="minutes" name="Minutes" radius={[6, 6, 0, 0]}>
                    {breakdown.map((point) => (
                      <Cell key={point.mode} fill={point.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-[220px] flex-col items-center justify-center text-center">
              <Sparkles className="mb-2 size-5 text-muted-foreground/60" />
              <p className="text-[13px] font-medium">No focus time to chart yet</p>
              <p className="mt-1 max-w-xs text-[12px] text-muted-foreground">
                Log an activity and the distribution updates instantly.
              </p>
            </div>
          )}
        </SectionCard>

        <SectionCard title="Mode breakdown" description="Entries by research mode.">
          <ul className="space-y-2.5">
            {breakdown.map((point) => {
              const Icon = researchModeIcons[point.mode];
              const meta = researchModeMeta[point.mode];
              return (
                <li key={point.mode} className="flex items-center gap-2.5">
                  <span
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-md",
                      meta.chip,
                    )}
                  >
                    <Icon className="size-3.5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-[12px] font-medium">{meta.label}</span>
                      <span className="text-[10.5px] tabular-nums text-muted-foreground">
                        {formatDuration(point.minutes)}
                      </span>
                    </span>
                    <span className="mt-1 flex items-center gap-2">
                      <span className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
                        <span
                          className="block h-full rounded-full"
                          style={{
                            width: `${Math.max(
                              (point.minutes /
                                Math.max(
                                  ...breakdown.map((item) => item.minutes),
                                  1,
                                )) *
                                100,
                              0,
                            )}%`,
                            backgroundColor: point.color,
                          }}
                        />
                      </span>
                      <span className="w-10 text-right text-[9.5px] tabular-nums text-muted-foreground">
                        {point.entries} {point.entries === 1 ? "entry" : "entries"}
                      </span>
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </SectionCard>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div
            className="flex flex-wrap items-center gap-1.5"
            role="group"
            aria-label="Filter by activity mode"
          >
            <button
              type="button"
              onClick={() => setMode("all")}
              aria-pressed={mode === "all"}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[12px] font-medium transition-colors",
                mode === "all"
                  ? "border-navy-900 bg-navy-900 text-white dark:border-teal-500/40 dark:bg-teal-500/15 dark:text-teal-200"
                  : "border-border bg-card text-muted-foreground hover:border-navy-300 hover:text-foreground dark:hover:border-navy-500",
              )}
            >
              All modes
              <span
                className={cn(
                  "rounded-full px-1.5 text-[10px] tabular-nums",
                  mode === "all" ? "bg-white/15" : "bg-muted",
                )}
              >
                {counts.all ?? 0}
              </span>
            </button>
            {researchModes.map((value) => {
              const Icon = researchModeIcons[value];
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setMode(value)}
                  aria-pressed={mode === value}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[12px] font-medium transition-colors",
                    mode === value
                      ? "border-navy-900 bg-navy-900 text-white dark:border-teal-500/40 dark:bg-teal-500/15 dark:text-teal-200"
                      : "border-border bg-card text-muted-foreground hover:border-navy-300 hover:text-foreground dark:hover:border-navy-500",
                  )}
                >
                  <Icon className="size-3.5" />
                  {researchModeMeta[value].label}
                  <span
                    className={cn(
                      "rounded-full px-1.5 text-[10px] tabular-nums",
                      mode === value ? "bg-white/15" : "bg-muted",
                    )}
                  >
                    {counts[value] ?? 0}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search log…"
              ariaLabel="Search research log"
              className="w-full sm:w-52"
            />
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger
                className="h-9 w-auto min-w-36 text-[12px]"
                aria-label="Filter by project"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All projects</SelectItem>
                <SelectItem value="none">No project</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={range}
              onValueChange={(value) => setRange(value as LogDateRange)}
            >
              <SelectTrigger
                className="h-9 w-auto min-w-32 text-[12px]"
                aria-label="Filter by date"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {dateRanges.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {isFiltered && (
          <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
            Showing {filtered.length} of {entries.length} entries
            <button
              type="button"
              onClick={clearFilters}
              className="font-medium text-teal-700 hover:underline dark:text-teal-300"
            >
              Clear filters
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3">
            <div className="h-24 animate-pulse rounded-xl border border-border bg-card" />
            <div className="h-24 animate-pulse rounded-xl border border-border bg-card" />
          </div>
        ) : isError ? (
          <EmptyState
            icon={SearchX}
            title="Could not load your research log"
            description="The local demo store returned an error. Reload the page to try again."
          />
        ) : groups.length === 0 ? (
          <EmptyState
            icon={isFiltered ? SearchX : Sparkles}
            title={
              isFiltered
                ? "No entries match those filters"
                : "Your research log is empty"
            }
            description={
              isFiltered
                ? "Try another mode, project, or date range — or clear the filters to see everything."
                : "Log your first activity to build momentum, populate the research feed, and keep Today accurate."
            }
            action={
              isFiltered ? (
                <Button variant="outline" onClick={clearFilters}>
                  Clear filters
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    setEditing(null);
                    setFormOpen(true);
                  }}
                >
                  <Plus className="size-4" />
                  Log activity
                </Button>
              )
            }
          />
        ) : (
          <div className="space-y-4">
            {groups.map((group) => (
              <SectionCard
                key={group.key}
                title={group.label}
                description={`${formatDuration(
                  group.entries.reduce((sum, entry) => sum + entry.durationMinutes, 0),
                )} across ${group.entries.length} ${
                  group.entries.length === 1 ? "entry" : "entries"
                }`}
              >
                <ul className="divide-y divide-border">
                  {group.entries.map((entry) => (
                    <li key={entry.id}>
                      <ResearchLogItem
                        entry={entry}
                        onEdit={(value) => {
                          setEditing(value);
                          setFormOpen(true);
                        }}
                        onDelete={setDeleting}
                      />
                    </li>
                  ))}
                </ul>
              </SectionCard>
            ))}
          </div>
        )}
      </div>

      <ResearchLogFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditing(null);
        }}
        entry={editing}
        defaultProjectId={projectId !== "all" && projectId !== "none" ? projectId : undefined}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete this research log entry?"
        description={
          deleting
            ? `“${deleting.title}” will be removed from your log, feed, and momentum calculations. This cannot be undone.`
            : ""
        }
        confirmLabel="Delete entry"
        onConfirm={async () => {
          if (deleting) await remove.mutateAsync(deleting.id);
        }}
      />
    </div>
  );
}
