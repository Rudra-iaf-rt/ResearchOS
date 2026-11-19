import { format, parseISO } from "date-fns";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  buildCalendarWeeks,
  buildMomentumDays,
  momentumIntensity,
  type MomentumDay,
  type MomentumEntry,
} from "@/lib/momentum";

const intensityClasses: Record<number, string> = {
  0: "bg-muted/70 border border-border/60",
  1: "bg-teal-100 dark:bg-teal-950",
  2: "bg-teal-300 dark:bg-teal-800",
  3: "bg-teal-500 dark:bg-teal-600",
  4: "bg-teal-700 dark:bg-teal-400",
};

interface MomentumCalendarProps {
  entries: MomentumEntry[];
  weeks?: number;
  onSelectDay?: (day: MomentumDay) => void;
  selectedDate?: string | null;
  className?: string;
}

/**
 * Research momentum heatmap. It is computed from real local records (activity
 * events and research log entries), not from a static analytics array.
 */
export function MomentumCalendar({
  entries,
  weeks = 12,
  onSelectDay,
  selectedDate,
  className,
}: MomentumCalendarProps) {
  const days = useMemo(() => buildMomentumDays(entries, { weeks }), [entries, weeks]);
  const grid = useMemo(() => buildCalendarWeeks(days), [days]);
  const today = format(new Date(), "yyyy-MM-dd");

  const monthLabels = useMemo(
    () =>
      grid.map((week, index) => {
        const first = week.find((day): day is MomentumDay => Boolean(day));
        if (!first) return "";
        const previous = grid[index - 1]
          ?.find((day): day is MomentumDay => Boolean(day))
          ?.date;
        const label = format(parseISO(first.date), "MMM");
        if (!previous) return label;
        return format(parseISO(previous), "MMM") === label ? "" : label;
      }),
    [grid],
  );

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex gap-1 pl-5">
        {monthLabels.map((label, index) => (
          <span
            key={`${label}-${index}`}
            className="flex-1 text-[8.5px] font-medium uppercase tracking-wide text-muted-foreground"
          >
            {label}
          </span>
        ))}
      </div>
      <div className="flex gap-1.5">
        <div className="flex w-4 shrink-0 flex-col gap-1 pt-px">
          {["M", "T", "W", "T", "F", "S", "S"].map((label, index) => (
            <span
              key={`${label}-${index}`}
              className="flex h-full flex-1 items-center justify-center text-[8px] font-medium text-muted-foreground"
              aria-hidden="true"
            >
              {index % 2 === 0 ? label : ""}
            </span>
          ))}
        </div>
        <div className="flex min-w-0 flex-1 gap-1">
          {grid.map((week, weekIndex) => (
            <div key={weekIndex} className="flex min-w-0 flex-1 flex-col gap-1">
              {week.map((day, dayIndex) => {
                if (!day) {
                  return (
                    <span
                      key={`empty-${weekIndex}-${dayIndex}`}
                      className="aspect-square w-full"
                      aria-hidden="true"
                    />
                  );
                }
                const intensity = momentumIntensity(day.count);
                const label = `${format(parseISO(day.date), "MMM d, yyyy")} · ${
                  day.count === 0
                    ? "no activity"
                    : `${day.count} ${day.count === 1 ? "entry" : "entries"}`
                }`;
                const classes = cn(
                  "aspect-square w-full rounded-[3px] transition-transform",
                  intensityClasses[intensity],
                  day.date === today && "ring-1 ring-navy-900/60 dark:ring-teal-300",
                  selectedDate === day.date &&
                    "ring-2 ring-teal-600 ring-offset-1 ring-offset-card",
                );

                if (!onSelectDay) {
                  return <span key={day.date} className={classes} title={label} />;
                }

                return (
                  <button
                    key={day.date}
                    type="button"
                    onClick={() => onSelectDay(day)}
                    title={label}
                    aria-label={label}
                    aria-pressed={selectedDate === day.date}
                    className={cn(
                      classes,
                      "cursor-pointer hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600",
                    )}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between pt-1 text-[9.5px] text-muted-foreground">
        <span>Less</span>
        <div className="flex items-center gap-1">
          {[0, 1, 2, 3, 4].map((level) => (
            <span
              key={level}
              className={cn("size-2.5 rounded-[2px]", intensityClasses[level])}
              aria-hidden="true"
            />
          ))}
        </div>
        <span>More</span>
      </div>
    </div>
  );
}
