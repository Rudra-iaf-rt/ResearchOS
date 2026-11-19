import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { queryKeys } from "@/lib/query-keys";
import { fromNow } from "@/lib/format";
import { cn } from "@/lib/utils";
import { notificationKindMeta } from "@/lib/constants";
import { notificationsApi } from "@/features/notifications/api";

export function NotificationsMenu() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data: notifications = [] } = useQuery({
    queryKey: queryKeys.notifications,
    queryFn: notificationsApi.list,
  });

  const unread = notifications.filter((item) => !item.read).length;

  const markAll = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications }),
  });

  const markOne = useMutation({
    mutationFn: notificationsApi.markRead,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications }),
  });

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-muted-foreground"
          aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
        >
          <Bell className="size-[17px]" />
          {unread > 0 && (
            <span className="absolute right-1.5 top-1.5 flex size-4 items-center justify-center rounded-full bg-teal-600 text-[8.5px] font-bold text-white ring-2 ring-background">
              {unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[360px] p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <p className="text-[13px] font-semibold">Notifications</p>
            <p className="text-[11px] text-muted-foreground">
              {unread > 0 ? `${unread} unread` : "You are all caught up"}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 text-[11px] text-muted-foreground"
            onClick={() => markAll.mutate()}
            disabled={unread === 0 || markAll.isPending}
          >
            <CheckCheck className="size-3.5" />
            Mark all read
          </Button>
        </div>
        <div className="max-h-[360px] overflow-y-auto scrollbar-thin">
          {notifications.length === 0 ? (
            <p className="px-4 py-8 text-center text-[12px] text-muted-foreground">
              No notifications yet.
            </p>
          ) : (
            notifications.map((notification) => (
              <button
                key={notification.id}
                type="button"
                className={cn(
                  "flex w-full items-start gap-3 border-b border-border/70 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-muted/60",
                  !notification.read && "bg-teal-50/40 dark:bg-teal-500/5",
                )}
                onClick={() => {
                  if (!notification.read) markOne.mutate(notification.id);
                  if (notification.href) navigate(notification.href);
                }}
              >
                <span
                  className={cn(
                    "mt-1.5 size-1.5 shrink-0 rounded-full",
                    notification.read
                      ? "bg-border"
                      : (notificationKindMeta[notification.kind]?.dot ?? "bg-teal-500"),
                  )}
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-[12.5px] font-medium leading-snug">
                    {notification.title}
                  </span>
                  <span className="mt-0.5 block text-[11.5px] leading-relaxed text-muted-foreground">
                    {notification.description}
                  </span>
                  <span className="mt-1 block text-[10.5px] text-muted-foreground/80">
                    {fromNow(notification.createdAt)}
                  </span>
                </span>
              </button>
            ))
          )}
        </div>
        <div className="flex items-center justify-between border-t border-border px-4 py-2">
          <button
            type="button"
            onClick={() => navigate("/app/activity")}
            className="text-[11.5px] font-medium text-teal-700 hover:underline dark:text-teal-300"
          >
            View workspace activity
          </button>
          <button
            type="button"
            onClick={() => navigate("/app/notifications")}
            className="text-[11.5px] font-medium text-teal-700 hover:underline dark:text-teal-300"
          >
            View all
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
