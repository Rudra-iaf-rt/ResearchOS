import type {
  Person,
  ResearchDatabase,
  ResearchFeedItem,
} from "@/types";
import { buildPersonDirectory } from "@/services/mock/directory";
import { readDb } from "@/services/mock/client";
import { formatDuration } from "@/features/research-log/lib";

/**
 * Merge activity events and research log entries into one normalized timeline.
 * Research log entries also create activity events; those back-referenced
 * events are skipped so the feed never shows the same work twice.
 */
export function toFeedItems(db: ResearchDatabase): ResearchFeedItem[] {
  const directory = buildPersonDirectory(db);
  const fallbackActor: Person = {
    id: "unknown",
    name: "Unknown researcher",
    initials: "??",
    color: "#64748B",
  };

  const activityItems: ResearchFeedItem[] = db.activity
    .filter((event) => !event.researchLogId)
    .map((event) => ({
      id: `activity:${event.id}`,
      source: "activity",
      category: event.category,
      action: event.action,
      target: event.target,
      detail: event.detail,
      actor: event.actor,
      projectId: event.projectId,
      artifact: event.artifact ?? null,
      mode: event.mode,
      createdAt: event.createdAt,
    }));

  const logItems: ResearchFeedItem[] = db.researchLog.map((entry) => ({
    id: `log:${entry.id}`,
    source: "research-log",
    category: "research",
    action: `logged ${formatDuration(entry.durationMinutes)} of ${entry.mode}`,
    target: entry.title,
    detail: entry.notes,
    actor: directory.get(entry.actorId) ?? fallbackActor,
    projectId: entry.projectId,
    artifact: entry.artifact,
    mode: entry.mode,
    durationMinutes: entry.durationMinutes,
    createdAt: entry.occurredAt,
  }));

  return [...activityItems, ...logItems].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
}

export const feedApi = {
  list: (): Promise<ResearchFeedItem[]> => readDb((db) => toFeedItems(db)),
};
