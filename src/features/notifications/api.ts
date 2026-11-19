import { mutateDb, readDb } from "@/services/mock/client";

export const notificationsApi = {
  list: () =>
    readDb((db) =>
      [...db.notifications].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    ),

  markRead: (id: string) =>
    mutateDb((db) => {
      const notification = db.notifications.find((item) => item.id === id);
      if (notification) notification.read = true;
      return db.notifications;
    }),

  markAllRead: () =>
    mutateDb((db) => {
      db.notifications.forEach((notification) => {
        notification.read = true;
      });
      return db.notifications;
    }),

  unreadCount: () =>
    readDb((db) => db.notifications.filter((notification) => !notification.read).length),
};
