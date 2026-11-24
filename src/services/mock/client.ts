import type {
  ActivityCategory,
  ActivityEvent,
  AppNotification,
  ArtifactRef,
  NotificationKind,
  Person,
  ResearchDatabase,
  ResearchMode,
} from "@/types";
import { uid } from "@/lib/format";
import { loadDatabase, saveDatabase } from "./storage";

/**
 * Local demo transport.
 *
 * Every write goes through this module so the rest of the app never talks
 * to localStorage directly. When the FastAPI service is available, each
 * feature's `api.ts` can swap these helpers for an HTTP client without
 * changing page components or query hooks.
 */

const LATENCY_MS = import.meta.env.MODE === "test" ? 0 : 90;

export function wait(ms = LATENCY_MS) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export async function readDb<T>(selector: (db: ResearchDatabase) => T): Promise<T> {
  await wait();
  return selector(loadDatabase());
}

export async function mutateDb<T>(
  updater: (db: ResearchDatabase) => T,
): Promise<T> {
  await wait();
  const db = loadDatabase();
  const result = updater(db);
  saveDatabase(db);
  return result;
}

/** The signed-in demo user as a graph/link-friendly Person. */
export function currentPerson(db: ResearchDatabase): Person {
  return {
    id: db.user.id,
    name: db.user.name,
    initials: db.user.initials,
    role: db.user.role,
    color: db.user.avatarColor,
  };
}

/** Create a Phase 1 notification from a Phase 3 reasoning event. */
export function pushNotification(
  db: ResearchDatabase,
  input: {
    kind: NotificationKind;
    title: string;
    description: string;
    href?: string;
  },
): AppNotification {
  const notification: AppNotification = {
    id: uid("note"),
    kind: input.kind,
    title: input.title,
    description: input.description,
    createdAt: new Date().toISOString(),
    read: false,
    href: input.href,
  };
  db.notifications.unshift(notification);
  db.notifications = db.notifications.slice(0, 80);
  return notification;
}

export function logActivity(
  db: ResearchDatabase,
  input: {
    category: ActivityCategory;
    action: string;
    target: string;
    detail?: string;
    projectId?: string | null;
    actor?: Person;
    workspaceId?: string;
    mode?: ResearchMode;
    artifact?: ArtifactRef | null;
    researchLogId?: string;
  },
) {
  const actor = input.actor ?? db.user;
  const event: ActivityEvent = {
    id: uid("act"),
    category: input.category,
    action: input.action,
    target: input.target,
    detail: input.detail,
    projectId: input.projectId ?? null,
    createdAt: new Date().toISOString(),
    workspaceId: input.workspaceId ?? db.workspace.id,
    mode: input.mode,
    artifact: input.artifact ?? undefined,
    researchLogId: input.researchLogId,
    actor: {
      id: actor.id,
      name: actor.name,
      initials: actor.initials,
      role: "role" in actor ? (actor.role as string | undefined) : undefined,
      color: "avatarColor" in actor ? actor.avatarColor : (actor as Person).color,
    },
  };
  db.activity.unshift(event);
  db.activity = db.activity.slice(0, 120);
}
