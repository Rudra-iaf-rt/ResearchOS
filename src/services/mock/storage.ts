import {
  createSeedCitations,
  createSeedDatabase,
  createSeedGraphEdges,
  createSeedGraphNodes,
  createSeedResearchLog,
  createSeedReviewNotifications,
  createSeedSubtasks,
  createSeedTaskMilestoneAssignments,
} from "./seed";
import type { ResearchDatabase } from "@/types";

const STORAGE_KEY = "researchos.demo.db.v1";
const CURRENT_VERSION = 3;

function hasStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

/**
 * Upgrade a previously stored database in place. Existing projects, notes and
 * files are preserved; Phase 1 and Phase 2 collections are added as needed.
 */
function upgradeDatabase(db: ResearchDatabase): ResearchDatabase {
  if (db.version === 1) {
    if (!Array.isArray(db.researchLog)) {
      db.researchLog = createSeedResearchLog();
    }
    if (!db.notifications?.some((notification) => notification.kind === "review")) {
      db.notifications = [...(db.notifications ?? []), ...createSeedReviewNotifications()];
    }
    db.version = 2;
  }

  if (db.version === 2) {
    if (!Array.isArray(db.graphNodes)) db.graphNodes = createSeedGraphNodes();
    if (!Array.isArray(db.graphEdges)) db.graphEdges = createSeedGraphEdges();
    if (!Array.isArray(db.citations)) db.citations = createSeedCitations();

    // Existing tasks keep their content; only the tree relationships are added.
    const assignments = createSeedTaskMilestoneAssignments();
    db.tasks = (db.tasks ?? []).map((task) => ({
      ...task,
      milestoneId: task.milestoneId ?? assignments[task.id] ?? null,
      parentTaskId: task.parentTaskId ?? null,
    }));
    createSeedSubtasks().forEach((subtask) => {
      if (!db.tasks.some((task) => task.id === subtask.id)) db.tasks.push(subtask);
    });

    db.folders = (db.folders ?? []).map((folder) => ({
      ...folder,
      projectId:
        folder.projectId ?? (folder.id === "folder_eeg_raw" ? "proj_cortical" : null),
    }));

    db.version = 3;
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
