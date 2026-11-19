import { beforeEach, describe, expect, it } from "vitest";
import { activityApi } from "@/features/activity/api";
import { projectsApi } from "@/features/projects/api";
import { tasksApi } from "@/features/tasks/api";
import { libraryApi } from "@/features/library/api";
import { DEMO_DB_KEY } from "@/services/mock/storage";

describe("local demo API flows", () => {
  beforeEach(() => {
    window.localStorage.removeItem(DEMO_DB_KEY);
  });

  it("seeds a database on first read", async () => {
    const projects = await projectsApi.list();
    const stored = window.localStorage.getItem(DEMO_DB_KEY);

    expect(projects.length).toBeGreaterThanOrEqual(6);
    expect(stored).not.toBeNull();
  });

  it("creates, updates, and removes a project while recording activity", async () => {
    const before = await projectsApi.list();
    const created = await projectsApi.create({
      title: "Test Research Program",
      description: "A project created by the automated test suite.",
      objectives: ["Validate local persistence."],
      status: "planning",
      startDate: "2026-01-01",
      targetDate: "2026-12-31",
      tags: ["Testing"],
    });

    expect(created.progress).toBe(0);
    expect((await projectsApi.list()).length).toBe(before.length + 1);

    const updated = await projectsApi.update(created.id, {
      status: "active",
      progress: 25,
    });
    expect(updated.status).toBe("active");
    expect(updated.progress).toBe(25);

    const activity = await activityApi.list();
    expect(activity[0]).toMatchObject({
      category: "project",
      target: "Test Research Program",
    });

    await projectsApi.remove(created.id);
    expect((await projectsApi.list()).some((p) => p.id === created.id)).toBe(false);
  });

  it("moves tasks between statuses and timestamps completion", async () => {
    const task = await tasksApi.create({
      title: "Write integration test",
      status: "todo",
      priority: "high",
      projectId: null,
      tags: ["Testing"],
    });

    expect(task.completedAt).toBeNull();

    const completed = await tasksApi.setStatus(task.id, "completed");
    expect(completed.status).toBe("completed");
    expect(completed.completedAt).toBeTruthy();

    const reopened = await tasksApi.setStatus(task.id, "in-progress");
    expect(reopened.completedAt).toBeNull();

    await tasksApi.remove(task.id);
    expect((await tasksApi.list()).some((item) => item.id === task.id)).toBe(false);
  });

  it("tracks reading state and favourites for a paper", async () => {
    const paper = await libraryApi.create({
      title: "A Test Paper",
      authors: ["Ada Lovelace"],
      year: 2026,
      journal: "Testing Letters",
      doi: "10.0000/test",
      abstract: "A test abstract.",
      tags: ["Testing"],
      projectId: null,
    });

    const read = await libraryApi.setReadStatus(paper.id, "reading");
    expect(read.readStatus).toBe("reading");

    const favorite = await libraryApi.toggleFavorite(paper.id);
    expect(favorite.favorite).toBe(true);

    await libraryApi.remove(paper.id);
    expect((await libraryApi.list()).some((item) => item.id === paper.id)).toBe(false);
  });
});
