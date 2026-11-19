import type {
  AppPreferences,
  UserProfile,
  Workspace,
} from "@/types";
import { logActivity, mutateDb, readDb } from "@/services/mock/client";
import { resetDatabase } from "@/services/mock/storage";

export type ProfileInput = Pick<
  UserProfile,
  | "name"
  | "email"
  | "role"
  | "institution"
  | "field"
  | "bio"
  | "timezone"
  | "avatarColor"
>;

export type WorkspaceInput = Pick<Workspace, "name" | "description" | "plan">;

export const settingsApi = {
  profile: () => readDb((db) => db.user),

  updateProfile: (input: ProfileInput) =>
    mutateDb((db) => {
      db.user = {
        ...db.user,
        ...input,
        initials: input.name
          .split(" ")
          .filter(Boolean)
          .slice(0, 2)
          .map((part) => part[0]?.toUpperCase() ?? "")
          .join(""),
      };
      return db.user;
    }),

  workspace: () => readDb((db) => db.workspace),

  updateWorkspace: (input: WorkspaceInput) =>
    mutateDb((db) => {
      db.workspace = {
        ...db.workspace,
        ...input,
        slug: input.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, ""),
      };
      logActivity(db, {
        category: "project",
        action: "updated workspace settings",
        target: db.workspace.name,
      });
      return db.workspace;
    }),

  preferences: () => readDb((db) => db.preferences),

  updatePreferences: (input: Partial<AppPreferences>) =>
    mutateDb((db) => {
      db.preferences = {
        ...db.preferences,
        ...input,
        notifications: {
          ...db.preferences.notifications,
          ...(input.notifications ?? {}),
        },
      };
      return db.preferences;
    }),

  exportSnapshot: () =>
    readDb((db) => JSON.stringify(db, null, 2)),

  resetDemoData: async () => {
    resetDatabase();
    return { ok: true };
  },
};
