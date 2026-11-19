import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity as ActivityIcon,
  CalendarDays,
  Download,
  FolderKanban,
  SearchX,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { StatCard } from "@/components/shared/stat-card";
import { ActivityTimeline } from "@/components/shared/activity-timeline";
import { EmptyState } from "@/components/shared/empty-state";
import { SearchInput } from "@/components/shared/search-input";
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
import { activityCategoryMeta } from "@/lib/constants";
import { downloadBlob, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ActivityCategory } from "@/types";
import { projectsApi } from "@/features/projects/api";
import { activityApi } from "../api";

type RangeFilter = "all" | "today" | "week" | "month";

const ranges: { value: RangeFilter; label: string }[] = [
  { value: "all", label: "All time" },
  { value: "today", label: "Today" },
  { value: "week", label: "Last 7 days" },
  { value: "month", label: "Last 30 days" },
];

const categories = Object.keys(activityCategoryMeta) as ActivityCategory[];

function startOfRange(range: RangeFilter) {
  const now = new Date();
  if (range === "today") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return start;
  }
  if (range === "week") return new Date(now.getTime() - 7 * 86_400_000);
  if (range === "month") return new Date(now.getTime() - 30 * 86_400_000);
  return null;
}

export function ActivityPage() {
  const [category, setCategory] = useState<"all" | ActivityCategory>("all");
  const [projectId, setProjectId] = useState("all");
  const [range, setRange] = useState<RangeFilter>("all");
  const [search, setSearch] = useState("");

  const { data: events = [], isLoading } = useQuery({
    queryKey: queryKeys.activity,
    queryFn: activityApi.list,
  });
  const { data: projects = [] } = useQuery({
    queryKey: queryKeys.projects,
    queryFn: projectsApi.list,
  });

  const counts = useMemo(() => {
    const result: Record<string, number> = { all: events.length };
    events.forEach((event) => {
      result[event.category] = (result[event.category] ?? 0) + 1;
    });
    return result;
  }, [events]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const start = startOfRange(range);
    return events
      .filter((event) => {
        const matchesCategory = category === "all" || event.category === category;
        const matchesProject =
          projectId === "all" ||
          (projectId === "none" ? event.projectId === null : event.projectId === projectId);
        const matchesRange = !start || new Date(event.createdAt) >= start;
        const matchesQuery =
          !q ||
          event.actor.name.toLowerCase().includes(q) ||
          event.target.toLowerCase().includes(q) ||
          event.action.toLowerCase().includes(q) ||
          (event.detail ?? "").toLowerCase().includes(q);
        return matchesCategory && matchesProject && matchesRange && matchesQuery;
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [events, category, projectId, range, search]);

  const weekStart = new Date(Date.now() - 7 * 86_400_000);
  const weekCount = events.filter((event) => new Date(event.createdAt) >= weekStart).length;
  const contributors = new Set(events.map((event) => event.actor.id)).size;
  const touchedProjects = new Set(
    events.map((event) => event.projectId).filter((id): id is string => Boolean(id)),
  ).size;

  const isFiltered = category !== "all" || projectId !== "all" || range !== "all" || Boolean(search.trim());

  const clearFilters = () => {
    setCategory("all");
    setProjectId("all");
    setRange("all");
    setSearch("");
  };

  const exportCsv = () => {
    const header = ["Date", "Actor", "Category", "Action", "Target", "Detail", "Project"];
    const rows = filtered.map((event) => [
      new Date(event.createdAt).toISOString(),
      event.actor.name,
      activityCategoryMeta[event.category].label,
      event.action,
      event.target,
      event.detail ?? "",
      projects.find((project) => project.id === event.projectId)?.title ?? "",
    ]);
    const csv = [header, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","),
      )
      .join("\n");
    downloadBlob(csv, `researchos-activity-${formatDate(new Date(), "yyyy-MM-dd")}.csv`, "text/csv");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Activity"
        description="A complete record of changes across projects, tasks, notebooks, papers, milestones, and files in this demo workspace."
        actions={
          <Button variant="outline" onClick={exportCsv} disabled={filtered.length === 0}>
            <Download className="size-4" />
            Export CSV
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total events" value={events.length} icon={ActivityIcon} accent="teal" hint="All recorded workspace changes" />
        <StatCard label="This week" value={weekCount} icon={CalendarDays} accent="indigo" hint="Last seven days" />
        <StatCard label="Contributors" value={contributors} icon={Users} accent="amber" hint="People with recorded activity" />
        <StatCard label="Projects touched" value={touchedProjects} icon={FolderKanban} accent="navy" hint="Projects with at least one event" />
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter by category">
            <button
              type="button"
              onClick={() => setCategory("all")}
              aria-pressed={category === "all"}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12px] font-medium transition-colors",
                category === "all"
                  ? "border-navy-900 bg-navy-900 text-white dark:border-teal-500/40 dark:bg-teal-500/15 dark:text-teal-200"
                  : "border-border bg-card text-muted-foreground hover:border-navy-300 hover:text-foreground dark:hover:border-navy-500",
              )}
            >
              All events
              <span
                className={cn(
                  "rounded-full px-1.5 text-[10px] tabular-nums",
                  category === "all" ? "bg-white/15" : "bg-muted",
                )}
              >
                {counts.all ?? 0}
              </span>
            </button>
            {categories.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setCategory(value)}
                aria-pressed={category === value}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12px] font-medium transition-colors",
                  category === value
                    ? "border-navy-900 bg-navy-900 text-white dark:border-teal-500/40 dark:bg-teal-500/15 dark:text-teal-200"
                    : "border-border bg-card text-muted-foreground hover:border-navy-300 hover:text-foreground dark:hover:border-navy-500",
                )}
              >
                {activityCategoryMeta[value].label}
                <span
                  className={cn(
                    "rounded-full px-1.5 text-[10px] tabular-nums",
                    category === value ? "bg-white/15" : "bg-muted",
                  )}
                >
                  {counts[value] ?? 0}
                </span>
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search activity…"
              ariaLabel="Search activity"
              className="w-full sm:w-52"
            />
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger className="h-9 w-auto min-w-36 text-[12px]" aria-label="Filter by project">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All projects</SelectItem>
                <SelectItem value="none">Workspace</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={range} onValueChange={(value) => setRange(value as RangeFilter)}>
              <SelectTrigger className="h-9 w-auto min-w-32 text-[12px]" aria-label="Filter by date">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ranges.map((item) => (
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
            Showing {filtered.length} of {events.length} events
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
          <div className="h-96 animate-pulse rounded-xl border border-border bg-card" />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={isFiltered ? SearchX : ActivityIcon}
            title={isFiltered ? "No activity matches those filters" : "No activity recorded yet"}
            description={
              isFiltered
                ? "Try a different category, project, or date range — or clear the filters to see the full timeline."
                : "Actions across your workspace will appear here as you create projects, complete tasks, and add research material."
            }
            action={
              isFiltered ? (
                <Button variant="outline" onClick={clearFilters}>
                  Clear filters
                </Button>
              ) : undefined
            }
          />
        ) : (
          <SectionCard
            title="Workspace timeline"
            description={`${filtered.length} recorded ${filtered.length === 1 ? "event" : "events"}${isFiltered ? " matching your filters" : ""}.`}
            action={
              <Badge variant="secondary" className="font-normal">
                Local demo history
              </Badge>
            }
          >
            <ActivityTimeline events={filtered} projects={projects} grouped />
          </SectionCard>
        )}
      </div>
    </div>
  );
}
