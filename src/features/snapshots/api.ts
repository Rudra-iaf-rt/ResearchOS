import type {
  ResearchDatabase,
  ResearchSnapshot,
  SnapshotArtifactType,
  SnapshotManifestEntry,
} from "@/types";
import { uid } from "@/lib/format";
import {
  logActivity,
  mutateDb,
  pushNotification,
  readDb,
} from "@/services/mock/client";

export interface SnapshotCandidate {
  key: string;
  artifactId: string;
  artifactType: SnapshotArtifactType;
  title: string;
  projectId: string;
  versionRef: string | null;
  category: SnapshotArtifactType;
  meta: string;
}

function latestVersionLabel(db: ResearchDatabase, artifactId: string): string | null {
  const versions = db.versions
    .filter((version) => version.artifactType === "notebook" && version.artifactId === artifactId)
    .sort((a, b) => b.versionNumber - a.versionNumber);
  return versions[0] ? `${versions[0].label}` : null;
}

/** Build the live checklist for a project. Selected entries are frozen at create time. */
export function collectSnapshotCandidates(
  db: ResearchDatabase,
  projectId: string,
): SnapshotCandidate[] {
  const candidates: SnapshotCandidate[] = [];

  db.notebooks
    .filter((notebook) => notebook.projectId === projectId)
    .forEach((notebook) => {
      const version = latestVersionLabel(db, notebook.id);
      candidates.push({
        key: `notebook:${notebook.id}`,
        artifactId: notebook.id,
        artifactType: "notebook",
        title: notebook.title,
        projectId,
        versionRef: version,
        category: "notebook",
        meta: version ? `Notebook · ${version}` : "Notebook",
      });
    });

  db.experiments
    .filter((experiment) => experiment.projectId === projectId)
    .forEach((experiment) => {
      const runs = db.experimentRuns.filter((run) => run.experimentId === experiment.id);
      const versionRef =
        runs.length > 0
          ? `${runs.length} run${runs.length === 1 ? "" : "s"} · latest ${runs[runs.length - 1]?.status}`
          : `${experiment.parameters.length} parameters`;
      candidates.push({
        key: `experiment:${experiment.id}`,
        artifactId: experiment.id,
        artifactType: "experiment",
        title: experiment.title,
        projectId,
        versionRef,
        category: "experiment",
        meta: `Experiment · ${experiment.status}`,
      });
    });

  db.files
    .filter((file) => file.projectId === projectId)
    .forEach((file) => {
      const isDataset = file.kind === "dataset";
      candidates.push({
        key: `file:${file.id}`,
        artifactId: file.id,
        artifactType: isDataset ? "dataset" : "file",
        title: file.name,
        projectId,
        versionRef: null,
        category: isDataset ? "dataset" : "file",
        meta: isDataset ? "Dataset" : "File",
      });
    });

  db.decisions
    .filter((decision) => decision.projectId === projectId)
    .forEach((decision) => {
      candidates.push({
        key: `decision:${decision.id}`,
        artifactId: decision.id,
        artifactType: "decision",
        title: decision.title,
        projectId,
        versionRef: `${decision.status} decision`,
        category: "decision",
        meta: `Decision · ${decision.status}`,
      });
    });

  return candidates;
}

export function snapshotCandidate(
  db: ResearchDatabase,
  projectId: string,
  artifactId: string,
  artifactType: SnapshotArtifactType,
): SnapshotCandidate | null {
  return (
    collectSnapshotCandidates(db, projectId).find(
      (candidate) =>
        candidate.artifactId === artifactId && candidate.artifactType === artifactType,
    ) ?? null
  );
}

export interface SnapshotInput {
  label: string;
  projectId: string;
  description: string;
  doi: string;
  itemKeys: string[];
}

export const snapshotsApi = {
  list: () =>
    readDb((db) =>
      [...db.snapshots].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    ),

  get: (id: string) =>
    readDb((db) => {
      const snapshot = db.snapshots.find((item) => item.id === id);
      if (!snapshot) throw new Error("Snapshot not found");
      return snapshot;
    }),

  candidates: (projectId: string) =>
    readDb((db) => collectSnapshotCandidates(db, projectId)),

  create: (input: SnapshotInput) =>
    mutateDb((db) => {
      const project = db.projects.find((item) => item.id === input.projectId);
      if (!project) throw new Error("Choose an existing project");
      const candidates = collectSnapshotCandidates(db, input.projectId);
      const selected = input.itemKeys
        .map((key) => candidates.find((candidate) => candidate.key === key))
        .filter((candidate): candidate is SnapshotCandidate => Boolean(candidate));
      if (selected.length === 0) {
        throw new Error("Select at least one item for the snapshot manifest");
      }
      const now = new Date().toISOString();
      const manifest: SnapshotManifestEntry[] = selected.map((candidate) => ({
        id: uid("manifest"),
        artifactId: candidate.artifactId,
        artifactType: candidate.artifactType,
        title: candidate.title,
        projectId: input.projectId,
        versionRef: candidate.versionRef,
        selectedAt: now,
      }));
      const snapshot: ResearchSnapshot = {
        id: uid("snap"),
        workspaceId: db.workspace.id,
        projectId: input.projectId,
        label: input.label.trim(),
        description: input.description.trim(),
        manifest,
        doi: input.doi.trim() || null,
        createdBy: db.user.id,
        createdAt: now,
      };
      db.snapshots.unshift(snapshot);
      logActivity(db, {
        category: "snapshot",
        action: "created a research snapshot",
        target: snapshot.label,
        detail: `${manifest.length} manifest entries`,
        projectId: snapshot.projectId,
      });
      pushNotification(db, {
        kind: "system",
        title: "Snapshot created",
        description: `“${snapshot.label}” froze ${manifest.length} research artifacts.`,
        href: "/app/snapshots",
      });
      return snapshot;
    }),

  remove: (id: string) =>
    mutateDb((db) => {
      const snapshot = db.snapshots.find((item) => item.id === id);
      db.snapshots = db.snapshots.filter((item) => item.id !== id);
      if (snapshot) {
        logActivity(db, {
          category: "snapshot",
          action: "deleted a research snapshot",
          target: snapshot.label,
          projectId: snapshot.projectId,
        });
      }
      return { id };
    }),

  /** A real, downloadable metadata manifest. It is not a binary-data archive. */
  manifestExport: (snapshot: ResearchSnapshot) =>
    readDb((db) => {
      const project = db.projects.find((item) => item.id === snapshot.projectId);
      return {
        schema: "researchos.snapshot.manifest",
        schemaVersion: 1,
        generatedAt: new Date().toISOString(),
        snapshot: {
          id: snapshot.id,
          label: snapshot.label,
          description: snapshot.description,
          projectId: snapshot.projectId,
          createdAt: snapshot.createdAt,
          createdBy: snapshot.createdBy,
          doi: snapshot.doi,
        },
        project: project
          ? {
              id: project.id,
              title: project.title,
              description: project.description,
              owner: project.owner.name,
            }
          : { id: snapshot.projectId, title: "Unknown project" },
        manifest: snapshot.manifest,
        manifestCount: snapshot.manifest.length,
        notice:
          "Metadata manifest only. Binary files, datasets, and notebooks are not bundled in this export.",
      };
    }),
};
