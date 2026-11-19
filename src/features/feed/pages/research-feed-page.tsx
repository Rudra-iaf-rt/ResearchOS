import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity as ActivityIcon,
  CalendarDays,
  Flame,
  SearchX,
  Timer,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { SearchInput } from "@/components/shared/search-input";
import { MomentumCalendar } from "@/components/shared/momentum-calendar";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { queryKeys } from "@/lib/query-keys";
import { activityCategoryMeta, artifactTypes, artifactTypeMeta } from "@/lib/constants";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  activeDays,
  buildMomentumDays,
  computeStreak,
  totalMinutes,
} from "@/lib/momentum";
import type { ActivityCategory, ArtifactType } from "@/types";
import { projectsApi } from "@/features/projects/api";
import { workspaceApi } from "@/features/workspace/api";
import { formatDuration } from "@/features/research-log/lib";
import { feedApi } from "../api";
import { feedMomentumEntries, filterFeedItems, groupFeedItems } from "../lib";
import { FeedItem } from "../components/feed-item";
import { DayDetailSheet } from "../components/day-detail-sheet";

const categories = Object.keys(activityCategoryMeta) as ActivityCategory[];

export function ResearchFeedPage() {
  const [projectId, setProjectId] = useState("all");
  const [memberId, setMemberId] = useState("all");
  const [artifactType, setArtifactType] = useState<ArtifactType | "none" | "all">("all");
  const [category, setCategory] = useState<ActivityCategory | "all">("all");
  const [search, setSearch] = useState("");
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: queryKeys.feed,
    queryFn: feedApi.list,
  });
  const { data: projects = [] } = useQuery({
    queryKey: queryKeys.projects,
    queryFn: projectsApi.list,
  });
  const { data: members = [] } = useQuery({
    queryKey: queryKeys.members,
    queryFn: workspaceApi.members,
  });

  const filtered = useMemo(
    () =>
      filterFeedItems(items, {
        projectId,
        memberId,
        artifactType,
        category,
        search,
      }),
    [items, projectId, memberId, artifactType, category, search],
  );
  const groups = useMemo(() => groupFeedItems(filtered), [filtered]);

  const momentumEntries = useMemo(() => feedMomentumEntries(items), [items]);
  const momentumDays = useMemo(
    () => buildMomentumDays(momentumEntries, { weeks: 12 }),
    [momentumEntries],
  );
  const streak = useMemo(() => computeStreak(momentumDays), [momentumDays]);

  const weekStart = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - 6);
    return start;
  }, []);
  const weekItems = items.filter((item) => new Date(item.createdAt) >= weekStart);
  const contributors = new Set(items.map((item) => item.actor.id)).size;

  const isFiltered =
    projectId !== "all" ||
    memberId !== "all" ||
    artifactType !== "all" ||
    category !== "all" ||
    Boolean(search.trim());

  const clearFilters = () => {
    setProjectId("all");
    setMemberId("all");
    setArtifactType("all");
    setCategory("all");
    setSearch("");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Daily research experience"
        title="Research feed"
        description="One timeline for logged research time and workspace activity. Filter by project, member, artifact type, or category, then open a day to inspect what happened."
        actions={
          <Badge variant="outline" className="gap-1.5 font-normal">
            <Flame className="size-3.5 text-amber-500" />
            {streak > 0
              ? `${streak}-day research streak`
              : "Start a streak today"}
          </Badge>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Feed events"
          value={formatNumber(items.length)}
          icon={ActivityIcon}
          accent="teal"
          hint="Research log + workspace activity"
        />
        <StatCard
          label="This week"
          value={formatNumber(weekItems.length)}
          icon={CalendarDays}
          accent="indigo"
          hint="Events in the last seven days"
        />
        <StatCard
          label="Contributors"
          value={formatNumber(contributors)}
          icon={Users}
          accent="amber"
          hint="People visible in the demo workspace"
        />
        <StatCard
          label="Focus logged"
          value={formatDuration(totalMinutes(momentumDays))}
          icon={Timer}
          accent="navy"
          hint={`${activeDays(momentumDays)} active days in 12 weeks`}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <div className="flex flex-col gap-2.5 rounded-xl border border-border bg-card p-3 shadow-subtle">
            <div className="flex flex-wrap items-center gap-2">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search the feed…"
                ariaLabel="Search research feed"
                className="w-full sm:w-56"
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
              <Select value={memberId} onValueChange={setMemberId}>
                <SelectTrigger
                  className="h-9 w-auto min-w-36 text-[12px]"
                  aria-label="Filter by member"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All members</SelectItem>
                  {members.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={artifactType}
                onValueChange={(value) =>
                  setArtifactType(value as ArtifactType | "none" | "all")
                }
              >
                <SelectTrigger
                  className="h-9 w-auto min-w-32 text-[12px]"
                  aria-label="Filter by artifact type"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All artifacts</SelectItem>
                  <SelectItem value="none">No artifact</SelectItem>
                  {artifactTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {artifactTypeMeta[type].plural}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div
              className="flex flex-wrap items-center gap-1.5"
              role="group"
              aria-label="Filter by activity category"
            >
              <button
                type="button"
                onClick={() => setCategory("all")}
                aria-pressed={category === "all"}
                className={cn(
                  "rounded-md border px-2 py-1 text-[11px] font-medium transition-colors",
                  category === "all"
                    ? "border-navy-900 bg-navy-900 text-white dark:border-teal-500/40 dark:bg-teal-500/15 dark:text-teal-200"
                    : "border-border bg-card text-muted-foreground hover:text-foreground",
                )}
              >
                All categories
              </button>
              {categories.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setCategory(value)}
                  aria-pressed={category === value}
                  className={cn(
                    "rounded-md border px-2 py-1 text-[11px] font-medium transition-colors",
                    category === value
                      ? "border-navy-900 bg-navy-900 text-white dark:border-teal-500/40 dark:bg-teal-500/15 dark:text-teal-200"
                      : "border-border bg-card text-muted-foreground hover:text-foreground",
                  )}
                >
                  {activityCategoryMeta[value].label}
                </button>
              ))}
            </div>

            {isFiltered && (
              <div className="flex items-center gap-2 border-t border-border pt-2 text-[11.5px] text-muted-foreground">
                Showing {filtered.length} of {items.length} events
                <button
                  type="button"
                  onClick={clearFilters}
                  className="font-medium text-teal-700 hover:underline dark:text-teal-300"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="space-y-3">
              <div className="h-32 animate-pulse rounded-xl border border-border bg-card" />
              <div className="h-32 animate-pulse rounded-xl border border-border bg-card" />
            </div>
          ) : groups.length === 0 ? (
            <EmptyState
              icon={isFiltered ? SearchX : ActivityIcon}
              title={
                isFiltered
                  ? "No feed events match those filters"
                  : "The research feed is empty"
              }
              description={
                isFiltered
                  ? "Try another project, member, artifact type, or category — or clear the filters to see the full timeline."
                  : "Log research activity or make a change in the workspace and it will appear here."
              }
            />
          ) : (
            <div className="space-y-4">
              {groups.map((group) => (
                <SectionCard
                  key={group.key}
                  title={group.label}
                  description={`${group.items.length} ${
                    group.items.length === 1 ? "event" : "events"
                  }`}
                  action={
                    <button
                      type="button"
                      onClick={() => setSelectedDay(group.key)}
                      className="text-[11.5px] font-medium text-teal-700 hover:underline dark:text-teal-300"
                    >
                      Open day
                    </button>
                  }
                >
                  <ul className="divide-y divide-border">
                    {group.items.map((item) => (
                      <li key={item.id}>
                        <FeedItem item={item} />
                      </li>
                    ))}
                  </ul>
                </SectionCard>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-5">
          <SectionCard
            title="Research momentum"
            description="Your last twelve weeks of activity."
          >
            <MomentumCalendar
              entries={momentumEntries}
              weeks={12}
              selectedDate={selectedDay}
              onSelectDay={(day) => setSelectedDay(day.date)}
            />
            <div className="mt-3 flex items-center justify-between rounded-lg bg-muted/50 px-2.5 py-2 text-[11px]">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Flame className="size-3.5 text-amber-500" />
                Current streak
              </span>
              <span className="font-semibold tabular-nums">
                {streak} {streak === 1 ? "day" : "days"}
              </span>
            </div>
          </SectionCard>

          <SectionCard title="What appears here" description="Two sources, one timeline.">
            <ul className="space-y-2.5 text-[11.5px] text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="mt-1 size-1.5 shrink-0 rounded-full bg-teal-500" />
                <span>
                  <span className="font-medium text-foreground">Research log</span> entries
                  from you and your members, including mode and focus time.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 size-1.5 shrink-0 rounded-full bg-indigo-500" />
                <span>
                  <span className="font-medium text-foreground">Workspace activity</span> such
                  as projects, tasks, notebooks, papers, milestones, and files.
                </span>
              </li>
            </ul>
            <p className="mt-3 rounded-md border border-border bg-muted/40 px-2.5 py-2 text-[10.5px] leading-relaxed text-muted-foreground">
              The feed is derived from local records only. Nothing is shared or sent to a
              server in this demo.
            </p>
          </SectionCard>
        </div>
      </div>

      <DayDetailSheet
        date={selectedDay}
        items={items}
        onOpenChange={(open) => !open && setSelectedDay(null)}
      />
    </div>
  );
}
