import type {
  ArtifactVersion,
  ResearchDatabase,
  VersionArtifactType,
} from "@/types";
import { logActivity, mutateDb, pushNotification, readDb } from "@/services/mock/client";
import { recordArtifactVersion } from "./lib";

const categoryFor = (type: VersionArtifactType) =>
  type === "notebook"
    ? ("notebook" as const)
    : type === "experiment"
      ? ("experiment" as const)
      : type === "project"
        ? ("project" as const)
        : ("file" as const);

function applyVersion(db: ResearchDatabase, version: ArtifactVersion) {
  if (version.artifactType === "notebook") {
    const notebook = db.notebooks.find((item) => item.id === version.artifactId);
    if (!notebook) throw new Error("Notebook no longer exists");
    const data = version.data.notebook;
    if (!data) throw new Error("This version does not contain notebook content");
    notebook.title = data.title;
    notebook.description = data.description;
    notebook.tags = [...data.tags];
    notebook.entries = structuredClone(data.entries);
    notebook.updatedAt = new Date().toISOString();
    return notebook.title;
  }

  if (version.artifactType === "experiment") {
    const experiment = db.experiments.find((item) => item.id === version.artifactId);
    if (!experiment) throw new Error("Experiment no longer exists");
    const data = version.data.experiment;
    if (!data) throw new Error("This version does not contain experiment content");
    experiment.title = data.title;
    experiment.description = data.description;
    experiment.status = data.status;
    experiment.parameters = structuredClone(data.parameters);
    experiment.notes = data.notes;
    experiment.artifactRefs = structuredClone(data.artifactRefs);
    experiment.updatedAt = new Date().toISOString();
    return experiment.title;
  }

  if (version.artifactType === "project") {
    const project = db.projects.find((item) => item.id === version.artifactId);
    if (!project) throw new Error("Project no longer exists");
    const data = version.data.project;
    if (!data) throw new Error("This version does not contain project content");
    project.title = data.title;
    project.description = data.description;
    project.objectives = [...data.objectives];
    project.tags = [...data.tags];
    project.status = data.status;
    project.progress = data.progress;
    project.updatedAt = new Date().toISOString();
    return project.title;
  }

  throw new Error("This artifact type does not support restoring versions yet");
}

export const historyApi = {
  list: (artifactType: VersionArtifactType, artifactId: string) =>
    readDb((db) =>
      db.versions
        .filter(
          (version) =>
            version.artifactType === artifactType && version.artifactId === artifactId,
        )
        .sort((a, b) => a.versionNumber - b.versionNumber),
    ),

  get: (versionId: string) =>
    readDb((db) => {
      const version = db.versions.find((item) => item.id === versionId);
      if (!version) throw new Error("Version not found");
      return version;
    }),

  create: (
    artifactType: VersionArtifactType,
    artifactId: string,
    options: { label: string; summary?: string } = { label: "Manual version" },
  ) =>
    mutateDb((db) => {
      const version = recordArtifactVersion(db, artifactType, artifactId, {
        label: options.label,
        summary: options.summary,
        force: true,
      });
      if (!version) throw new Error("Nothing to version for this artifact");
      return version;
    }),

  restore: (versionId: string) =>
    mutateDb((db) => {
      const source = db.versions.find((item) => item.id === versionId);
      if (!source) throw new Error("Version not found");
      const title = applyVersion(db, source);
      const restored = recordArtifactVersion(db, source.artifactType, source.artifactId, {
        label: `Restored ${source.label}`,
        summary: `Restored from ${source.label} — “${source.summary}”. Previous versions are preserved.`,
        content: source.content,
        data: structuredClone(source.data),
        force: true,
      });
      if (!restored) throw new Error("Could not record the restored version");
      logActivity(db, {
        category: categoryFor(source.artifactType),
        action: "restored a historical version",
        target: title,
        detail: `Restored ${source.label} as ${restored.label}`,
      });
      pushNotification(db, {
        kind: "system",
        title: "Version restored",
        description: `“${title}” was restored from ${source.label}. A new version was created; earlier versions were kept.`,
      });
      return restored;
    }),
};
