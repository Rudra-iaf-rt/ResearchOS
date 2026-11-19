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

  it("seeds version 2 with a research log and review notifications", () => {
    const db = loadDatabase();
    expect(db.version).toBe(DEMO_DB_VERSION);
    expect(db.version).toBe(2);
    expect(db.researchLog.length).toBeGreaterThan(0);
    expect(db.notifications.some((item) => item.kind === "review")).toBe(true);
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

    expect(upgraded.version).toBe(2);
    expect(upgraded.projects.map((project) => project.id)).toEqual(originalProjectIds);
    expect(upgraded.tasks.length).toBe(originalTaskCount);
    expect(upgraded.researchLog.length).toBeGreaterThan(0);
    expect(upgraded.notifications.some((item) => item.kind === "review")).toBe(true);
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
