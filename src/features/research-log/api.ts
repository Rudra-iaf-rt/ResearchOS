import type { ArtifactRef, ResearchLogEntry, ResearchMode } from "@/types";
import { logActivity, mutateDb, readDb } from "@/services/mock/client";
import { userToPerson } from "@/services/mock/directory";
import { uid } from "@/lib/format";
import {
  assertPermission,
  can,
  identityProvider,
} from "@/services/identity";
import { resolveArtifact } from "@/features/artifacts/lib";
import { formatDuration, toLogViews, type ResearchLogView } from "./lib";

export interface ResearchLogInput {
  mode: ResearchMode;
  title: string;
  notes?: string;
  durationMinutes: number;
  occurredAt: string;
  projectId: string | null;
  artifact: ArtifactRef | null;
}

async function requireLogAccess() {
  const identity = await identityProvider.getIdentity();
  assertPermission(identity, "log:write");
  return identity;
}

export const researchLogApi = {
  list: (): Promise<ResearchLogView[]> => readDb((db) => toLogViews(db)),

  create: async (input: ResearchLogInput) => {
    const identity = await requireLogAccess();
    return mutateDb((db) => {
      const now = new Date().toISOString();
      const entry: ResearchLogEntry = {
        id: uid("log"),
        workspaceId: identity.workspace.id,
        actorId: identity.user.id,
        projectId:
          input.projectId && db.projects.some((project) => project.id === input.projectId)
            ? input.projectId
            : null,
        mode: input.mode,
        title: input.title.trim(),
        notes: input.notes?.trim() || undefined,
        durationMinutes: input.durationMinutes,
        artifact: resolveArtifact(db, input.artifact?.type, input.artifact?.id),
        occurredAt: input.occurredAt,
        createdAt: now,
        updatedAt: now,
      };

      db.researchLog.unshift(entry);
      db.researchLog.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));

      logActivity(db, {
        category: "research",
        action: `logged ${formatDuration(entry.durationMinutes)} of ${entry.mode}`,
        target: entry.title,
        detail: entry.notes,
        projectId: entry.projectId,
        workspaceId: entry.workspaceId,
        mode: entry.mode,
        artifact: entry.artifact,
        researchLogId: entry.id,
        actor: userToPerson({
          ...db.user,
          id: identity.user.id,
          name: identity.user.name,
          initials: identity.user.initials,
          role: identity.user.role,
          avatarColor: identity.user.avatarColor,
        }),
      });

      return toLogViews(db).find((view) => view.id === entry.id) as ResearchLogView;
    });
  },

  update: async (id: string, input: ResearchLogInput) => {
    const identity = await requireLogAccess();
    return mutateDb((db) => {
      const entry = db.researchLog.find((item) => item.id === id);
      if (!entry) throw new Error("Research log entry not found");
      if (entry.actorId !== identity.user.id && !can(identity, "workspace:manage")) {
        throw new Error("You can only edit your own log entries");
      }

      entry.mode = input.mode;
      entry.title = input.title.trim();
      entry.notes = input.notes?.trim() || undefined;
      entry.durationMinutes = input.durationMinutes;
      entry.occurredAt = input.occurredAt;
      entry.projectId =
        input.projectId && db.projects.some((project) => project.id === input.projectId)
          ? input.projectId
          : null;
      entry.artifact = resolveArtifact(db, input.artifact?.type, input.artifact?.id);
      entry.updatedAt = new Date().toISOString();
      db.researchLog.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));

      logActivity(db, {
        category: "research",
        action: "updated a research log entry",
        target: entry.title,
        projectId: entry.projectId,
        workspaceId: entry.workspaceId,
        mode: entry.mode,
        artifact: entry.artifact,
        researchLogId: entry.id,
      });

      return toLogViews(db).find((view) => view.id === entry.id) as ResearchLogView;
    });
  },

  remove: async (id: string) => {
    const identity = await requireLogAccess();
    return mutateDb((db) => {
      const entry = db.researchLog.find((item) => item.id === id);
      if (!entry) throw new Error("Research log entry not found");
      if (entry.actorId !== identity.user.id && !can(identity, "workspace:manage")) {
        throw new Error("You can only delete your own log entries");
      }

      db.researchLog = db.researchLog.filter((item) => item.id !== id);
      logActivity(db, {
        category: "research",
        action: "deleted a research log entry",
        target: entry.title,
        projectId: entry.projectId,
        workspaceId: entry.workspaceId,
        mode: entry.mode,
        researchLogId: entry.id,
      });
      return { id };
    });
  },
};
