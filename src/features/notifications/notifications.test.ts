import { beforeEach, describe, expect, it } from "vitest";
import { notificationsApi } from "@/features/notifications/api";
import { DEMO_DB_KEY } from "@/services/mock/storage";

describe("notifications API", () => {
  beforeEach(() => {
    window.localStorage.removeItem(DEMO_DB_KEY);
  });

  it("returns notifications newest first with review requests seeded", async () => {
    const notifications = await notificationsApi.list();

    expect(notifications.length).toBeGreaterThanOrEqual(6);
    expect(notifications.some((item) => item.kind === "review")).toBe(true);

    for (let index = 1; index < notifications.length; index += 1) {
      expect(notifications[index - 1].createdAt >= notifications[index].createdAt).toBe(
        true,
      );
    }
  });

  it("counts and clears unread notifications", async () => {
    const before = await notificationsApi.unreadCount();
    expect(before).toBeGreaterThan(0);

    await notificationsApi.markAllRead();
    expect(await notificationsApi.unreadCount()).toBe(0);

    const notifications = await notificationsApi.list();
    expect(notifications.every((notification) => notification.read)).toBe(true);
  });

  it("marks a single notification as read and persists it", async () => {
    const notifications = await notificationsApi.list();
    const unread = notifications.find((notification) => !notification.read);
    expect(unread).toBeDefined();

    await notificationsApi.markRead(unread!.id);

    const after = await notificationsApi.list();
    expect(after.find((item) => item.id === unread!.id)?.read).toBe(true);
  });
});
