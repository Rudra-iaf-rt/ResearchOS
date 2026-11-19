import type {
  ArtifactRef,
  ArtifactType,
  ResearchDatabase,
} from "@/types";
import { artifactTypeMeta } from "@/lib/constants";

export interface ArtifactOption extends ArtifactRef {
  projectId: string | null;
  href: string;
  /** Short secondary line, e.g. the project or artifact type. */
  meta: string;
}

export function artifactHref(artifact: Pick<ArtifactRef, "type" | "id">): string {
  switch (artifact.type) {
    case "project":
      return `/app/projects/${artifact.id}`;
    case "notebook":
      return `/app/notebooks/${artifact.id}`;
    case "paper":
      return `/app/library?paper=${artifact.id}`;
    case "file":
      return `/app/files?file=${artifact.id}`;
    case "task":
    case "milestone":
      return "/app/tasks";
  }
}

/**
 * Scan the database for linkable research artifacts. Used by research log and
 * quick capture so pages never import seeded arrays directly.
 */
export function scanArtifacts(db: ResearchDatabase): ArtifactOption[] {
  const projectTitle = (id: string | null) =>
    id ? (db.projects.find((project) => project.id === id)?.title ?? null) : null;

  const options: ArtifactOption[] = [];

  db.projects.forEach((project) =>
    options.push({
      type: "project",
      id: project.id,
      label: project.title,
      projectId: project.id,
      href: artifactHref({ type: "project", id: project.id }),
      meta: "Project",
    }),
  );

  db.notebooks.forEach((notebook) =>
    options.push({
      type: "notebook",
      id: notebook.id,
      label: notebook.title,
      projectId: notebook.projectId,
      href: artifactHref({ type: "notebook", id: notebook.id }),
      meta: projectTitle(notebook.projectId) ?? "Notebook",
    }),
  );

  db.papers.forEach((paper) =>
    options.push({
      type: "paper",
      id: paper.id,
      label: paper.title,
      projectId: paper.projectId,
      href: artifactHref({ type: "paper", id: paper.id }),
      meta: projectTitle(paper.projectId) ?? "Research paper",
    }),
  );

  db.files.forEach((file) =>
    options.push({
      type: "file",
      id: file.id,
      label: file.name,
      projectId: file.projectId,
      href: artifactHref({ type: "file", id: file.id }),
      meta: projectTitle(file.projectId) ?? "File",
    }),
  );

  db.tasks.forEach((task) =>
    options.push({
      type: "task",
      id: task.id,
      label: task.title,
      projectId: task.projectId,
      href: artifactHref({ type: "task", id: task.id }),
      meta: projectTitle(task.projectId) ?? "Task",
    }),
  );

  db.milestones.forEach((milestone) =>
    options.push({
      type: "milestone",
      id: milestone.id,
      label: milestone.title,
      projectId: milestone.projectId,
      href: artifactHref({ type: "milestone", id: milestone.id }),
      meta: projectTitle(milestone.projectId) ?? "Milestone",
    }),
  );

  return options;
}

/** Resolve an artifact from database truth; unknown references are rejected. */
export function resolveArtifact(
  db: ResearchDatabase,
  type: ArtifactType | null | undefined,
  id: string | null | undefined,
): ArtifactRef | null {
  if (!type || !id) return null;
  const match = scanArtifacts(db).find(
    (option) => option.type === type && option.id === id,
  );
  if (!match) return null;
  return { type: match.type, id: match.id, label: match.label };
}

/** Parse the `type:id` value used by select controls. */
export function parseArtifactKey(
  key: string,
): { type: ArtifactType; id: string } | null {
  if (!key || key === "none") return null;
  const [type, ...rest] = key.split(":");
  const id = rest.join(":");
  if (!type || !id) return null;
  if (!(type in artifactTypeMeta)) return null;
  return { type: type as ArtifactType, id };
}

export function artifactKey(artifact: ArtifactRef | null): string {
  return artifact ? `${artifact.type}:${artifact.id}` : "none";
}
