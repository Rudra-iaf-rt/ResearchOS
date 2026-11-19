import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ArtifactType } from "@/types";

export type ThemeMode = "light" | "dark" | "system";

export interface RecentArtifact {
  type: ArtifactType;
  id: string;
  label: string;
  href: string;
  projectId?: string | null;
  viewedAt: string;
}

interface UiState {
  sidebarCollapsed: boolean;
  mobileNavOpen: boolean;
  commandOpen: boolean;
  createMenuOpen: boolean;
  theme: ThemeMode;
  recentArtifacts: RecentArtifact[];
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setMobileNavOpen: (open: boolean) => void;
  setCommandOpen: (open: boolean) => void;
  setCreateMenuOpen: (open: boolean) => void;
  setTheme: (theme: ThemeMode) => void;
  recordArtifactView: (artifact: Omit<RecentArtifact, "viewedAt">) => void;
  clearRecentArtifacts: () => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      mobileNavOpen: false,
      commandOpen: false,
      createMenuOpen: false,
      theme: "light",
      recentArtifacts: [],
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      setMobileNavOpen: (mobileNavOpen) => set({ mobileNavOpen }),
      setCommandOpen: (commandOpen) => set({ commandOpen }),
      setCreateMenuOpen: (createMenuOpen) => set({ createMenuOpen }),
      setTheme: (theme) => set({ theme }),
      recordArtifactView: (artifact) =>
        set((state) => {
          const next: RecentArtifact = {
            ...artifact,
            viewedAt: new Date().toISOString(),
          };
          const withoutDuplicate = state.recentArtifacts.filter(
            (item) => !(item.type === artifact.type && item.id === artifact.id),
          );
          return { recentArtifacts: [next, ...withoutDuplicate].slice(0, 10) };
        }),
      clearRecentArtifacts: () => set({ recentArtifacts: [] }),
    }),
    {
      name: "researchos.ui.v1",
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
        recentArtifacts: state.recentArtifacts,
      }),
    },
  ),
);
