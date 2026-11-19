import { format, parseISO, startOfDay, subDays } from "date-fns";
import type {
  Person,
  ResearchDatabase,
  ResearchLogEntry,
  ResearchMode,
} from "@/types";
import { buildPersonDirectory } from "@/services/mock/directory";
import { artifactHref } from "@/features/artifacts/lib";
import { researchModeMeta, researchModes } from "@/lib/constants";

export interface ResearchLogView extends ResearchLogEntry {
  actor: Person;
  projectTitle: string | null;
  artifactUrl: string | null;
}

export type LogDateRange = "today" | "week" | "month" | "all";

export interface LogFilters {
  mode?: ResearchMode | "all";
  projectId?: string;
  range?: LogDateRange;
  search?: string;
}

function toView(db: ResearchDatabase, entry: ResearchLogEntry): ResearchLogView {
  const directory = buildPersonDirectory(db);
  const actor =
    directory.get(entry.actorId) ??
    ({
      id: entry.actorId,
      name: "Unknown researcher",
      initials: "??",
      color: "#64748B",
    } satisfies Person);

  return {
    ...entry,
    actor,
    projectTitle:
      db.projects.find((project) => project.id === entry.projectId)?.title ?? null,
    artifactUrl: entry.artifact ? artifactHref(entry.artifact) : null,
  };
}

export function toLogViews(db: ResearchDatabase): ResearchLogView[] {
  return [...db.researchLog]
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
    .map((entry) => toView(db, entry));
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
}

export function rangeStart(range: LogDateRange, now: Date = new Date()): Date | null {
  if (range === "today") return startOfDay(now);
  if (range === "week") return startOfDay(subDays(now, 6));
  if (range === "month") return startOfDay(subDays(now, 29));
  return null;
}

export function filterLogViews(
  views: ResearchLogView[],
  filters: LogFilters,
  now: Date = new Date(),
): ResearchLogView[] {
  const start = rangeStart(filters.range ?? "all", now);
  const query = filters.search?.trim().toLowerCase() ?? "";

  return views.filter((view) => {
    const matchesMode = !filters.mode || filters.mode === "all" || view.mode === filters.mode;
    const matchesProject =
      !filters.projectId ||
      filters.projectId === "all" ||
      (filters.projectId === "none"
        ? view.projectId === null
        : view.projectId === filters.projectId);
    const occurred = parseISO(view.occurredAt);
    const matchesRange = !start || occurred >= start;
    const matchesQuery =
      !query ||
      view.title.toLowerCase().includes(query) ||
      (view.notes ?? "").toLowerCase().includes(query) ||
      view.actor.name.toLowerCase().includes(query) ||
      (view.artifact?.label ?? "").toLowerCase().includes(query);
    return matchesMode && matchesProject && matchesRange && matchesQuery;
  });
}

export interface LogGroup {
  key: string;
  label: string;
  entries: ResearchLogView[];
}

export function groupLogViews(views: ResearchLogView[], now: Date = new Date()): LogGroup[] {
  const today = startOfDay(now);
  const yesterday = subDays(today, 1);

  const groups = new Map<string, LogGroup>();
  views.forEach((view) => {
    const occurred = startOfDay(parseISO(view.occurredAt));
    const key = format(occurred, "yyyy-MM-dd");
    let group = groups.get(key);
    if (!group) {
      let label = format(occurred, "EEEE, MMM d");
      if (occurred.getTime() === today.getTime()) label = "Today";
      else if (occurred.getTime() === yesterday.getTime()) label = "Yesterday";
      group = { key, label, entries: [] };
      groups.set(key, group);
    }
    group.entries.push(view);
  });

  return [...groups.values()].sort((a, b) => b.key.localeCompare(a.key));
}

export interface ModeBreakdownPoint {
  mode: ResearchMode;
  label: string;
  minutes: number;
  entries: number;
  color: string;
}

export function modeBreakdown(views: ResearchLogView[]): ModeBreakdownPoint[] {
  return researchModes.map((mode) => {
    const entries = views.filter((view) => view.mode === mode);
    return {
      mode,
      label: researchModeMeta[mode].label,
      minutes: entries.reduce((sum, entry) => sum + entry.durationMinutes, 0),
      entries: entries.length,
      color: researchModeMeta[mode].chartColor,
    };
  });
}

export interface LogSummary {
  todayMinutes: number;
  todayEntries: number;
  weekMinutes: number;
  weekEntries: number;
  activeDays: number;
  topMode: ResearchMode | null;
}

export function summarizeLog(
  views: ResearchLogView[],
  now: Date = new Date(),
): LogSummary {
  const weekStart = startOfDay(subDays(now, 6));
  const todayStart = startOfDay(now);
  const week = views.filter((view) => parseISO(view.occurredAt) >= weekStart);
  const today = views.filter((view) => parseISO(view.occurredAt) >= todayStart);

  const minutesByMode = new Map<ResearchMode, number>();
  week.forEach((view) => {
    minutesByMode.set(
      view.mode,
      (minutesByMode.get(view.mode) ?? 0) + view.durationMinutes,
    );
  });
  const topMode =
    [...minutesByMode.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  const days = new Set(week.map((view) => format(parseISO(view.occurredAt), "yyyy-MM-dd")));

  return {
    todayMinutes: today.reduce((sum, view) => sum + view.durationMinutes, 0),
    todayEntries: today.length,
    weekMinutes: week.reduce((sum, view) => sum + view.durationMinutes, 0),
    weekEntries: week.length,
    activeDays: days.size,
    topMode,
  };
}

export function toDateTimeLocal(value: string | Date = new Date()): string {
  const date = typeof value === "string" ? parseISO(value) : value;
  if (Number.isNaN(date.getTime())) return format(new Date(), "yyyy-MM-dd'T'HH:mm");
  return format(date, "yyyy-MM-dd'T'HH:mm");
}
