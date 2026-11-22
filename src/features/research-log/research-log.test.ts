import { beforeEach, describe, expect, it } from "vitest";
import type { ResearchMode } from "@/types";
import { researchLogApi } from "@/features/research-log/api";
import {
  filterLogViews,
  formatDuration,
  groupLogViews,
  modeBreakdown,
  summarizeLog,
  toLogViews,
  type ResearchLogView,
} from "@/features/research-log/lib";
import { feedApi } from "@/features/feed/api";
import { activityApi } from "@/features/activity/api";
import { DEMO_DB_KEY, DEMO_DB_VERSION, loadDatabase } from "@/services/mock/storage";

const baseInput = {
  mode: "analysis" as ResearchMode,
  title: "Re-ran the coupling model",
  notes: "Checked cohort B.",
  durationMinutes: 45,
  occurredAt: new Date().toISOString(),
  projectId: "proj_cortical",
  artifact: { type: "notebook" as const, id: "nb_cortical_analysis", label: "ignored" },
};

describe("research log API", () => {
  beforeEach(() => {
    window.localStorage.removeItem(DEMO_DB_KEY);
  });

  it("creates an entry, stamps the actor, and resolves the artifact", async () => {
    const before = await researchLogApi.list();
    const created = await researchLogApi.create(baseInput);

    expect(created).toMatchObject({
      title: baseInput.title,
      mode: "analysis",
      durationMinutes: 45,
      projectId: "proj_cortical",
      actorId: "user_maya",
      workspaceId: "ws_northlight",
    });
    expect(created.actor.name).toBeTruthy();
    expect(created.artifact).toMatchObject({
      type: "notebook",
      id: "nb_cortical_analysis",
    });
    expect(created.artifact?.label).not.toBe("ignored");

    const after = await researchLogApi.list();
    expect(after.length).toBe(before.length + 1);
  });

  it("records a research activity event that the feed de-duplicates", async () => {
    const created = await researchLogApi.create(baseInput);

    const activity = await activityApi.list();
    const event = activity.find((item) => item.researchLogId === created.id);
    expect(event).toMatchObject({
      category: "research",
      mode: "analysis",
      workspaceId: "ws_northlight",
    });

    const feed = await feedApi.list();
    const matches = feed.filter((item) => item.target === baseInput.title);
    expect(matches).toHaveLength(1);
    expect(matches[0].source).toBe("research-log");
    expect(matches[0].durationMinutes).toBe(45);
  });

  it("updates and removes an entry, writing activity for each change", async () => {
    const created = await researchLogApi.create(baseInput);

    const updated = await researchLogApi.update(created.id, {
      ...baseInput,
      title: "Re-ran the coupling model with locked ICA",
      mode: "writing",
      durationMinutes: 60,
      projectId: null,
    });
    expect(updated.title).toContain("locked ICA");
    expect(updated.mode).toBe("writing");
    expect(updated.projectId).toBeNull();

    await researchLogApi.remove(created.id);
    expect((await researchLogApi.list()).some((item) => item.id === created.id)).toBe(false);

    const activity = await activityApi.list();
    expect(activity[0].action).toMatch(/deleted a research log entry/);
  });

  it("persists entries across a fresh database read", async () => {
    const created = await researchLogApi.create(baseInput);
    const db = loadDatabase();
    expect(db.version).toBe(DEMO_DB_VERSION);
    expect(db.researchLog.some((entry) => entry.id === created.id)).toBe(true);
  });
});

const view = (input: Partial<ResearchLogView> & { id: string; mode: ResearchMode }) =>
  ({
    workspaceId: "ws_northlight",
    actorId: "user_maya",
    projectId: null,
    title: "Entry",
    durationMinutes: 30,
    artifact: null,
    occurredAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    actor: { id: "user_maya", name: "Dr. Maya Chen", initials: "MC", color: "#0D9488" },
    projectTitle: null,
    artifactUrl: null,
    ...input,
  }) as ResearchLogView;

describe("research log helpers", () => {
  const views = [
    view({
      id: "a",
      mode: "reading",
      title: "Read a paper",
      projectId: "proj_cortical",
      durationMinutes: 30,
    }),
    view({
      id: "b",
      mode: "writing",
      title: "Drafted methods",
      projectId: "proj_cortical",
      durationMinutes: 60,
    }),
    view({
      id: "c",
      mode: "admin",
      title: "Ordered supplies",
      projectId: null,
      durationMinutes: 15,
    }),
  ];

  it("filters by mode, project, and query", () => {
    expect(filterLogViews(views, { mode: "writing" })).toHaveLength(1);
    expect(filterLogViews(views, { projectId: "proj_cortical" })).toHaveLength(2);
    expect(filterLogViews(views, { projectId: "none" })).toHaveLength(1);
    expect(filterLogViews(views, { search: "supplies" })).toHaveLength(1);
    expect(filterLogViews(views, { search: "maya" })).toHaveLength(3);
  });

  it("limits results to the selected date range", () => {
    const old = view({
      id: "old",
      mode: "reading",
      occurredAt: new Date(Date.now() - 40 * 86_400_000).toISOString(),
    });
    expect(filterLogViews([...views, old], { range: "today" })).toHaveLength(3);
    expect(filterLogViews([...views, old], { range: "month" })).toHaveLength(3);
    expect(filterLogViews([...views, old], { range: "all" })).toHaveLength(4);
  });

  it("groups entries with friendly day labels", () => {
    const groups = groupLogViews(views);
    expect(groups).toHaveLength(1);
    expect(groups[0].label).toBe("Today");
    expect(groups[0].entries).toHaveLength(3);
  });

  it("computes mode breakdown and summaries", () => {
    const breakdown = modeBreakdown(views);
    const writing = breakdown.find((point) => point.mode === "writing");
    expect(writing).toMatchObject({ minutes: 60, entries: 1 });

    const summary = summarizeLog(views);
    expect(summary.todayEntries).toBe(3);
    expect(summary.todayMinutes).toBe(105);
    expect(summary.weekMinutes).toBe(105);
    expect(summary.activeDays).toBe(1);
    expect(summary.topMode).toBe("writing");
  });

  it("formats durations for the UI", () => {
    expect(formatDuration(25)).toBe("25m");
    expect(formatDuration(60)).toBe("1h");
    expect(formatDuration(95)).toBe("1h 35m");
  });

  it("sorts log views newest first", () => {
    const db = loadDatabase();
    const sorted = toLogViews(db);
    for (let index = 1; index < sorted.length; index += 1) {
      expect(sorted[index - 1].occurredAt >= sorted[index].occurredAt).toBe(true);
    }
  });
});
