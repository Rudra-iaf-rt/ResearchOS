import { format, parseISO } from "date-fns";
import { CalendarOff, Clock } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { EmptyState } from "@/components/shared/empty-state";
import { formatDuration } from "@/features/research-log/lib";
import type { ResearchFeedItem } from "@/types";
import { FeedItem } from "./feed-item";

interface DayDetailSheetProps {
  date: string | null;
  items: ResearchFeedItem[];
  onOpenChange: (open: boolean) => void;
}

export function DayDetailSheet({ date, items, onOpenChange }: DayDetailSheetProps) {
  const dayItems = date
    ? items.filter((item) => format(parseISO(item.createdAt), "yyyy-MM-dd") === date)
    : [];
  const minutes = dayItems.reduce(
    (sum, item) => sum + (item.durationMinutes ?? 0),
    0,
  );

  return (
    <Sheet open={Boolean(date)} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[94%] max-w-md gap-0 p-0">
        <SheetHeader className="border-b border-border p-6 pb-4">
          <SheetTitle>
            {date ? format(parseISO(date), "EEEE, MMMM d") : "Day detail"}
          </SheetTitle>
          <SheetDescription>
            {dayItems.length === 0
              ? "No recorded research activity on this day."
              : `${dayItems.length} ${dayItems.length === 1 ? "event" : "events"}${
                  minutes > 0 ? ` · ${formatDuration(minutes)} logged` : ""
                }`}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-2 scrollbar-thin">
          {dayItems.length === 0 ? (
            <EmptyState
              className="mt-6 border-none bg-transparent"
              icon={CalendarOff}
              title="A quiet day"
              description="Nothing was recorded here. Try another day in the momentum calendar."
            />
          ) : (
            <ul className="divide-y divide-border">
              {dayItems.map((item) => (
                <li key={item.id}>
                  <FeedItem item={item} />
                </li>
              ))}
            </ul>
          )}
        </div>

        {dayItems.length > 0 && (
          <div className="flex items-center gap-2 border-t border-border bg-muted/30 px-6 py-3 text-[11px] text-muted-foreground">
            <Clock className="size-3.5" />
            Focus time is summed from logged research entries only.
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
