import { addDays, format, parseISO, startOfDay, startOfWeek, subDays } from "date-fns";

export interface MomentumEntry {
  /** ISO timestamp of the event or research log entry. */
  createdAt: string;
  /** Optional focus time attached to the entry. */
  minutes?: number;
}

export interface MomentumDay {
  /** Local calendar day, `yyyy-MM-dd`. */
  date: string;
  count: number;
  minutes: number;
}

export function dayKey(value: string | Date): string {
  const date = typeof value === "string" ? parseISO(value) : value;
  return format(date, "yyyy-MM-dd");
}

/**
 * Build one record per day for the trailing `weeks` weeks, ending today.
 * Days without entries are included so calendars and streaks stay continuous.
 */
export function buildMomentumDays(
  entries: MomentumEntry[],
  options: { weeks?: number; now?: Date } = {},
): MomentumDay[] {
  const weeks = options.weeks ?? 12;
  const today = startOfDay(options.now ?? new Date());
  const totalDays = weeks * 7;
  const start = subDays(today, totalDays - 1);

  const buckets = new Map<string, MomentumDay>();
  for (let index = 0; index < totalDays; index += 1) {
    const key = format(addDays(start, index), "yyyy-MM-dd");
    buckets.set(key, { date: key, count: 0, minutes: 0 });
  }

  entries.forEach((entry) => {
    const date = parseISO(entry.createdAt);
    if (Number.isNaN(date.getTime())) return;
    const bucket = buckets.get(dayKey(date));
    if (!bucket) return;
    bucket.count += 1;
    bucket.minutes += entry.minutes ?? 0;
  });

  return [...buckets.values()];
}

/**
 * Consecutive days with at least one entry, anchored at today. A missing entry
 * today does not break the streak until the day is over, so yesterday counts.
 */
export function computeStreak(days: MomentumDay[], now: Date = new Date()): number {
  const byDate = new Map(days.map((day) => [day.date, day]));
  let cursor = startOfDay(now);

  if ((byDate.get(format(cursor, "yyyy-MM-dd"))?.count ?? 0) === 0) {
    cursor = subDays(cursor, 1);
  }

  let streak = 0;
  while ((byDate.get(format(cursor, "yyyy-MM-dd"))?.count ?? 0) > 0) {
    streak += 1;
    cursor = subDays(cursor, 1);
  }
  return streak;
}

/**
 * Arrange days into week columns starting on Monday. Padding cells are `null`
 * so the grid keeps a stable seven-row shape.
 */
export function buildCalendarWeeks(
  days: MomentumDay[],
  weekStartsOn: 0 | 1 = 1,
): (MomentumDay | null)[][] {
  if (days.length === 0) return [];
  const first = parseISO(days[0].date);
  const gridStart = startOfWeek(first, { weekStartsOn });
  const byDate = new Map(days.map((day) => [day.date, day]));
  const weeks: (MomentumDay | null)[][] = [];

  let cursor = gridStart;
  while (cursor <= parseISO(days[days.length - 1].date)) {
    const week: (MomentumDay | null)[] = [];
    for (let offset = 0; offset < 7; offset += 1) {
      week.push(byDate.get(format(addDays(cursor, offset), "yyyy-MM-dd")) ?? null);
    }
    weeks.push(week);
    cursor = addDays(cursor, 7);
  }

  return weeks;
}

/** 0–4 intensity bucket used by calendar cells and legends. */
export function momentumIntensity(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  if (count <= 5) return 3;
  return 4;
}

export function totalMinutes(days: MomentumDay[]): number {
  return days.reduce((sum, day) => sum + day.minutes, 0);
}

export function activeDays(days: MomentumDay[]): number {
  return days.filter((day) => day.count > 0).length;
}
