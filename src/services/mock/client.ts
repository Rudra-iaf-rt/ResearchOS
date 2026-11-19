import type {
  ActivityCategory,
  ActivityEvent,
  ArtifactRef,
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
