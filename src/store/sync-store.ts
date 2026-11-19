import { create } from "zustand";

export type SyncStatus = "synced" | "syncing" | "offline" | "conflict";

interface SyncState {
  status: SyncStatus;
  lastSyncedAt: string;
  setStatus: (status: SyncStatus) => void;
  beginSync: () => void;
  markSynced: () => void;
}

/**
 * Demo-only sync state.
 *
 * No network transport exists in Phase 1; this store powers the sync
 * indicator and its simulator so the states can be exercised safely.
 */
export const useSyncStore = create<SyncState>()((set) => ({
  status: "synced",
  lastSyncedAt: new Date().toISOString(),
  setStatus: (status) =>
    set((state) => ({
      status,
      lastSyncedAt: status === "synced" ? new Date().toISOString() : state.lastSyncedAt,
    })),
  beginSync: () => set({ status: "syncing" }),
  markSynced: () => set({ status: "synced", lastSyncedAt: new Date().toISOString() }),
}));
