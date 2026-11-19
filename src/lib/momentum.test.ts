import { describe, expect, it } from "vitest";
import { format } from "date-fns";
import {
  activeDays,
  buildCalendarWeeks,
  buildMomentumDays,
  computeStreak,
  dayKey,
  momentumIntensity,
  totalMinutes,
} from "@/lib/momentum";

const at = (year: number, month: number, day: number, hours = 12) =>
  new Date(year, month - 1, day, hours, 0, 0);

const iso = (date: Date) => date.toISOString();

describe("momentum helpers", () => {
  const now = at(2026, 6, 15);

  it("builds a continuous day grid ending today", () => {
    const days = buildMomentumDays([], { weeks: 2, now });
    expect(days).toHaveLength(14);
    expect(days[days.length - 1].date).toBe(format(now, "yyyy-MM-dd"));
    expect(days.every((day) => day.count === 0 && day.minutes === 0)).toBe(true);
  });

  it("buckets entries by local day and sums minutes", () => {
    const days = buildMomentumDays(
      [
        { createdAt: iso(at(2026, 6, 15, 9)) },
        { createdAt: iso(at(2026, 6, 15, 17)), minutes: 45 },
        { createdAt: iso(at(2026, 6, 14)), minutes: 30 },
        { createdAt: "not-a-date" },
      ],
      { weeks: 1, now },
    );

    const today = days.find((day) => day.date === format(now, "yyyy-MM-dd"));
    const yesterday = days.find(
      (day) => day.date === format(at(2026, 6, 14), "yyyy-MM-dd"),
    );

    expect(today).toMatchObject({ count: 2, minutes: 45 });
    expect(yesterday).toMatchObject({ count: 1, minutes: 30 });
    expect(totalMinutes(days)).toBe(75);
    expect(activeDays(days)).toBe(2);
  });

  it("ignores entries outside the window", () => {
    const days = buildMomentumDays(
      [{ createdAt: iso(at(2025, 1, 1)) }],
      { weeks: 1, now },
    );
    expect(days.reduce((sum, day) => sum + day.count, 0)).toBe(0);
  });

  it("counts a streak across consecutive days and tolerates an empty today", () => {
    const days = buildMomentumDays(
      [
        { createdAt: iso(at(2026, 6, 15)) },
        { createdAt: iso(at(2026, 6, 14)) },
        { createdAt: iso(at(2026, 6, 13)) },
      ],
      { weeks: 2, now },
    );
    expect(computeStreak(days, now)).toBe(3);

    const withoutToday = buildMomentumDays(
      [
        { createdAt: iso(at(2026, 6, 14)) },
        { createdAt: iso(at(2026, 6, 13)) },
      ],
      { weeks: 2, now },
    );
    expect(computeStreak(withoutToday, now)).toBe(2);
  });

  it("breaks the streak on a gap", () => {
    const days = buildMomentumDays(
      [{ createdAt: iso(at(2026, 6, 13)) }],
      { weeks: 2, now },
    );
    expect(computeStreak(days, now)).toBe(0);
  });

  it("arranges days into seven-row calendar weeks", () => {
    const days = buildMomentumDays([], { weeks: 2, now });
    const weeks = buildCalendarWeeks(days);
    expect(weeks.length).toBeGreaterThanOrEqual(2);
    weeks.forEach((week) => expect(week).toHaveLength(7));
  });

  it("maps counts to intensity buckets", () => {
    expect(momentumIntensity(0)).toBe(0);
    expect(momentumIntensity(1)).toBe(1);
    expect(momentumIntensity(3)).toBe(2);
    expect(momentumIntensity(5)).toBe(3);
    expect(momentumIntensity(9)).toBe(4);
  });

  it("formats day keys in local time", () => {
    expect(dayKey(at(2026, 6, 15))).toBe("2026-06-15");
  });
});
