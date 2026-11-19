import { createSeedDatabase, createSeedResearchLog, createSeedReviewNotifications } from "./seed";
import type { ResearchDatabase } from "@/types";

const STORAGE_KEY = "researchos.demo.db.v1";
const CURRENT_VERSION = 2;

function hasStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

/**
 * Upgrade a previously stored database in place. Existing projects, notes and
 * files are preserved; only the Phase 1 collections are added.
 */
function upgradeDatabase(db: ResearchDatabase): ResearchDatabase {
  if (db.version === 1) {
    if (!Array.isArray(db.researchLog)) {
      db.researchLog = createSeedResearchLog();
    }
    if (!db.notifications?.some((notification) => notification.kind === "review")) {
      db.notifications = [...(db.notifications ?? []), ...createSeedReviewNotifications()];
    }
    db.version = CURRENT_VERSION;
  }
  return db;
}

export function loadDatabase(): ResearchDatabase {
  if (!hasStorage()) return createSeedDatabase();

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = createSeedDatabase();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    const parsed = JSON.parse(raw) as ResearchDatabase;
    if (!parsed || typeof parsed.version !== "number" || parsed.version > CURRENT_VERSION) {
      const seeded = createSeedDatabase();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    const upgraded = upgradeDatabase(parsed);
    if (upgraded.version !== parsed.version) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(upgraded));
    }
    return upgraded;
  } catch {
    return createSeedDatabase();
  }
}

export function saveDatabase(db: ResearchDatabase) {
  if (!hasStorage()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    // A full local quota should not break the interface. The in-memory
    // session continues, and the next successful mutation persists again.
  }
}

export function resetDatabase(): ResearchDatabase {
  const seeded = createSeedDatabase();
  saveDatabase(seeded);
  return seeded;
}

export const DEMO_DB_KEY = STORAGE_KEY;
export const DEMO_DB_VERSION = CURRENT_VERSION;
