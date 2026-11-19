import { beforeEach, describe, expect, it } from "vitest";
import type { ResearchFeedItem } from "@/types";
import {
  effectiveArtifactType,
  feedMomentumEntries,
  filterFeedItems,
  groupFeedItems,
} from "@/features/feed/lib";
import { toFeedItems } from "@/features/feed/api";
import { researchLogApi } from "@/features/research-log/api";
import { DEMO_DB_KEY, loadDatabase } from "@/services/mock/storage";

const actor = {
  id: "user_maya",
  name: "Dr. Maya Chen",
  initials: "MC",
  color: "#0D9488",
};

const item = (
  overrides: Partial<ResearchFeedItem> & { id: string },
): ResearchFeedItem => ({
  source: "research-log",
  category: "research",
  action: "logged 30m of analysis",
  target: "Entry",
  actor,
  projectId: null,
  artifact: null,
  createdAt: new Date().toISOString(),
  ...overrides,
});

describe("feed aggregation", () => {
  beforeEach(() => {
    window.localStorage.removeItem(DEMO_DB_KEY);
  });

  it("merges activity and research log entries without duplicating logged work", async () => {
    const created = await researchLogApi.create({
      mode: "analysis",
      title: "Feed dedupe check",
      durationMinutes: 30,
      occurredAt: new Date().toISOString(),
      projectId: "proj_cortical",
      artifact: null,
    });

    const db = loadDatabase();
    const feed = toFeedItems(db);

    expect(feed.some((entry) => entry.id === `log:${created.id}`)).toBe(true);
    expect(
      feed.some(
        (entry) =>
          entry.source === "activity" &&
          entry.id.includes(created.id),
      ),
    ).toBe(false);
    expect(feed.filter((entry) => entry.target === "Feed dedupe check")).toHaveLength(1);
  });

  it("sorts the merged feed newest first", async () => {
    const feed = toFeedItems(loadDatabase());
    for (let index = 1; index < feed.length; index += 1) {
      expect(feed[index - 1].createdAt >= feed[index].createdAt).toBe(true);
    }
  });
});

describe("feed filters", () => {
  const items: ResearchFeedItem[] = [
    item({
      id: "1",
      projectId: "proj_cortical",
      artifact: { type: "paper", id: "paper_1", label: "Paper" },
      mode: "reading",
      target: "Read a paper",
    }),
    item({
      id: "2",
      source: "activity",
      category: "task",
      action: "completed",
      target: "Finished preprocessing",
      projectId: "proj_heat",
      actor: { ...actor, id: "person_arjun", name: "Arjun Rao" },
    }),
    item({
      id: "3",
      projectId: null,
      target: "Workspace admin",
      category: "research",
    }),
  ];

  it("filters by project, member, artifact type, category, and search", () => {
    expect(filterFeedItems(items, { projectId: "proj_cortical" })).toHaveLength(1);
    expect(filterFeedItems(items, { projectId: "none" })).toHaveLength(1);
    expect(filterFeedItems(items, { memberId: "person_arjun" })).toHaveLength(1);
    expect(filterFeedItems(items, { artifactType: "paper" })).toHaveLength(1);
    expect(filterFeedItems(items, { artifactType: "task" })).toHaveLength(1);
    expect(filterFeedItems(items, { category: "research" })).toHaveLength(2);
    expect(filterFeedItems(items, { search: "preprocessing" })).toHaveLength(1);
    expect(filterFeedItems(items, { search: "arjun" })).toHaveLength(1);
  });

  it("derives an effective artifact type from the category", () => {
    expect(effectiveArtifactType(items[0])).toBe("paper");
    expect(effectiveArtifactType(items[1])).toBe("task");
    expect(effectiveArtifactType(items[2])).toBe("none");
  });

  it("groups items into day buckets", () => {
    const groups = groupFeedItems(items);
    expect(groups).toHaveLength(1);
    expect(groups[0].label).toBe("Today");
    expect(groups[0].items).toHaveLength(3);
  });

  it("maps feed items to momentum entries", () => {
    const entries = feedMomentumEntries([
      item({ id: "a", durationMinutes: 30 }),
      item({ id: "b" }),
    ]);
    expect(entries[0].minutes).toBe(30);
    expect(entries[1].minutes).toBeUndefined();
  });
});
