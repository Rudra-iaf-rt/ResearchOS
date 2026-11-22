import { beforeEach, describe, expect, it } from "vitest";
import {
  DEMO_DB_KEY,
  DEMO_DB_VERSION,
  loadDatabase,
  resetDatabase,
} from "@/services/mock/storage";
import { createSeedDatabase } from "@/services/mock/seed";

describe("demo database migration", () => {
  beforeEach(() => {
    window.localStorage.removeItem(DEMO_DB_KEY);
  });

  it("seeds version 3 with graph collections and research data", () => {
    const db = loadDatabase();
    expect(db.version).toBe(DEMO_DB_VERSION);
    expect(db.version).toBe(3);
    expect(db.researchLog.length).toBeGreaterThan(0);
    expect(db.notifications.some((item) => item.kind === "review")).toBe(true);
    expect(db.graphNodes.length).toBeGreaterThan(0);
    expect(db.graphEdges.length).toBeGreaterThan(0);
    expect(db.citations.length).toBeGreaterThan(0);
    expect(db.tasks.some((task) => task.parentTaskId)).toBe(true);
  });

  it("upgrades a stored version 1 database without losing existing records", () => {
    const legacy = createSeedDatabase();
    legacy.version = 1;
    // Simulate a database written before Phase 1.
    delete (legacy as { researchLog?: unknown }).researchLog;
    legacy.notifications = legacy.notifications.filter((item) => item.kind !== "review");
    const originalProjectIds = legacy.projects.map((project) => project.id);
    const originalTaskCount = legacy.tasks.length;

    window.localStorage.setItem(DEMO_DB_KEY, JSON.stringify(legacy));

    const upgraded = loadDatabase();

    expect(upgraded.version).toBe(3);
    expect(upgraded.projects.map((project) => project.id)).toEqual(originalProjectIds);
    expect(upgraded.tasks.length).toBeGreaterThanOrEqual(originalTaskCount);
    expect(upgraded.researchLog.length).toBeGreaterThan(0);
    expect(upgraded.notifications.some((item) => item.kind === "review")).toBe(true);
    expect(upgraded.graphNodes.length).toBeGreaterThan(0);
    expect(upgraded.graphEdges.every((edge) => typeof edge.from === "string")).toBe(true);
    expect(upgraded.citations.length).toBeGreaterThan(0);
  });

  it("upgrades a version 2 database in place and keeps tasks and files", () => {
    const legacy = createSeedDatabase();
    legacy.version = 2;
    const originalTask = legacy.tasks[0];
    const originalFileIds = legacy.files.map((file) => file.id);
    window.localStorage.setItem(DEMO_DB_KEY, JSON.stringify(legacy));

    const upgraded = loadDatabase();

    expect(upgraded.version).toBe(3);
    expect(upgraded.tasks.find((task) => task.id === originalTask.id)?.title).toBe(
      originalTask.title,
    );
    expect(upgraded.files.map((file) => file.id)).toEqual(originalFileIds);
    expect(upgraded.graphNodes.length).toBeGreaterThan(0);
    expect(upgraded.folders.some((folder) => folder.projectId === "proj_cortical")).toBe(true);
  });

  it("resets the database back to the seeded state", () => {
    const db = loadDatabase();
    db.projects = [];
    window.localStorage.setItem(DEMO_DB_KEY, JSON.stringify(db));

    const reset = resetDatabase();
    expect(reset.projects.length).toBeGreaterThan(0);
    expect(loadDatabase().projects.length).toBeGreaterThan(0);
  });
});
