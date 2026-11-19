import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  AtSign,
  Bell,
  BellRing,
  CalendarClock,
  CheckCheck,
  ClipboardCheck,
  Info,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { queryKeys } from "@/lib/query-keys";
import { notificationKindMeta } from "@/lib/constants";
import { fromNow } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AppNotification, NotificationKind } from "@/types";
import { notificationsApi } from "../api";

type NotificationTab = "all" | "unread" | "mentions" | "reviews" | "system";

const tabs: { value: NotificationTab; label: string }[] = [
  { value: "all", label: "All" },
  { value: "unread", label: "Unread" },
  { value: "mentions", label: "Mentions" },
  { value: "reviews", label: "Reviews" },
  { value: "system", label: "System" },
];

const kindIcon: Record<NotificationKind, typeof Bell> = {
  deadline: CalendarClock,
  assignment: UserPlus,
  mention: AtSign,
  review: ClipboardCheck,
  system: Info,
};

function matchesTab(notification: AppNotification, tab: NotificationTab) {
  if (tab === "all") return true;
  if (tab === "unread") return !notification.read;
  if (tab === "mentions") return notification.kind === "mention";
  if (tab === "reviews") return notification.kind === "review";
  if (tab === "system") return notification.kind === "system";
  return true;
}

function isTab(value: string | null): value is NotificationTab {
  return Boolean(value) && tabs.some((tab) => tab.value === value);
}

export function NotificationsPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const tab: NotificationTab = isTab(requestedTab) ? requestedTab : "all";

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: queryKeys.notifications,
    queryFn: notificationsApi.list,
  });

  const unread = notifications.filter((item) => !item.read).length;

  const counts = useMemo(() => {
    const result: Record<NotificationTab, number> = {
      all: notifications.length,
      unread,
      mentions: 0,
      reviews: 0,
      system: 0,
    };
    notifications.forEach((notification) => {
      if (notification.kind === "mention") result.mentions += 1;
      if (notification.kind === "review") result.reviews += 1;
      if (notification.kind === "system") result.system += 1;
    });
    return result;
  }, [notifications, unread]);

  const visible = notifications.filter((notification) => matchesTab(notification, tab));

  const setTab = (next: NotificationTab) => {
    if (next === "all") setSearchParams({});
    else setSearchParams({ tab: next });
  };

  const markOne = useMutation({
    mutationFn: notificationsApi.markRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.notifications }),
    onError: () => toast.error("Could not mark the notification as read"),
  });

  const markAll = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
      toast.success("All notifications marked as read");
    },
    onError: () => toast.error("Could not mark all notifications as read"),
  });

  const open = (notification: AppNotification) => {
    if (!notification.read) markOne.mutate(notification.id);
    if (notification.href) navigate(notification.href);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Daily research experience"
        title="Notifications"
        description="Deadlines, assignments, mentions, review requests, and system notices for the demo workspace."
        actions={
          <Button
            variant="outline"
            onClick={() => markAll.mutate()}
            disabled={unread === 0 || markAll.isPending}
          >
            <CheckCheck className="size-4" />
            Mark all read
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={tab} onValueChange={(value) => setTab(value as NotificationTab)}>
          <TabsList className="flex-wrap">
            {tabs.map((item) => (
              <TabsTrigger key={item.value} value={item.value}>
                {item.label}
                {counts[item.value] > 0 && (
                  <span className="rounded-full bg-muted px-1.5 text-[10px] tabular-nums text-muted-foreground">
                    {counts[item.value]}
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <p className="text-[12px] text-muted-foreground">
          {unread > 0 ? `${unread} unread` : "You are all caught up"}
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <div className="h-20 animate-pulse rounded-xl border border-border bg-card" />
          <div className="h-20 animate-pulse rounded-xl border border-border bg-card" />
          <div className="h-20 animate-pulse rounded-xl border border-border bg-card" />
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          icon={BellRing}
          title={
            tab === "unread"
              ? "No unread notifications"
              : tab === "all"
                ? "No notifications yet"
                : `No ${tab} notifications`
          }
          description={
            tab === "unread"
              ? "Everything is read. New assignments, mentions, and reviews will appear here."
              : "When something needs your attention it will land in this inbox."
          }
        />
      ) : (
        <SectionCard
          title={tabs.find((item) => item.value === tab)?.label ?? "All"}
          description={`${visible.length} ${visible.length === 1 ? "notification" : "notifications"}`}
          action={
            <Badge variant="secondary" className="font-normal">
              Local demo inbox
            </Badge>
          }
        >
          <ul className="divide-y divide-border">
            {visible.map((notification) => {
              const meta = notificationKindMeta[notification.kind];
              const Icon = kindIcon[notification.kind] ?? Bell;
              return (
                <li key={notification.id}>
                  <button
                    type="button"
                    onClick={() => open(notification)}
                    className={cn(
                      "flex w-full items-start gap-3.5 py-3.5 text-left transition-colors hover:bg-muted/40",
                      !notification.read && "bg-teal-50/40 dark:bg-teal-500/5",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg",
                        meta.soft,
                      )}
                    >
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-2">
                        <span className="text-[13px] font-medium leading-snug">
                          {notification.title}
                        </span>
                        <span className="flex shrink-0 items-center gap-1.5">
                          {!notification.read && (
                            <span
                              className={cn("size-1.5 rounded-full", meta.dot)}
                              aria-label="Unread"
                            />
                          )}
                          <time
                            dateTime={notification.createdAt}
                            className="text-[10.5px] text-muted-foreground"
                          >
                            {fromNow(notification.createdAt)}
                          </time>
                        </span>
                      </span>
                      <span className="mt-0.5 block text-[12px] leading-relaxed text-muted-foreground">
                        {notification.description}
                      </span>
                      <span className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-muted px-2 py-0.5 text-[9.5px] font-medium text-muted-foreground">
                        {meta.label}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </SectionCard>
      )}
    </div>
  );
}
