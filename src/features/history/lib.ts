import type {
  ArtifactVersion,
  Experiment,
  Notebook,
  Person,
  Project,
  ResearchDatabase,
  VersionArtifactType,
  VersionSnapshotData,
} from "@/types";
import { currentPerson } from "@/services/mock/client";

/** Convert TipTap HTML into readable plain text for diffs and search. */
export function htmlToText(html: string): string {
  return html
    .replace(/<\/(p|h[1-6]|li|blockquote|tr)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function notebookVersionData(notebook: Notebook): VersionSnapshotData {
  return {
    notebook: {
      title: notebook.title,
      description: notebook.description,
      tags: [...notebook.tags],
      entries: structuredClone(notebook.entries),
    },
  };
}

export function notebookVersionContent(notebook: Notebook): string {
  return notebook.entries
    .map((entry) => `## ${entry.title}\n\n${htmlToText(entry.content)}`)
    .join("\n\n---\n\n");
}

export function experimentVersionData(experiment: Experiment): VersionSnapshotData {
  return {
    experiment: {
      title: experiment.title,
      description: experiment.description,
      status: experiment.status,
      parameters: structuredClone(experiment.parameters),
      notes: experiment.notes,
      artifactRefs: structuredClone(experiment.artifactRefs),
    },
  };
}

export function experimentVersionContent(experiment: Experiment): string {
  const parameters = experiment.parameters
    .map((parameter) => `${parameter.key}: ${parameter.value}`)
    .join("\n");
  return `# ${experiment.title}\n\n${experiment.description}\n\n## Parameters\n\n${parameters}\n\n## Notes\n\n${htmlToText(
    experiment.notes,
  )}`;
}

export function projectVersionData(project: Project): VersionSnapshotData {
  return {
    project: {
      title: project.title,
      description: project.description,
      objectives: [...project.objectives],
      tags: [...project.tags],
      status: project.status,
      progress: project.progress,
    },
  };
}

export function projectVersionContent(project: Project): string {
  return `# ${project.title}\n\n${project.description}\n\n## Objectives\n\n${project.objectives
    .map((objective) => `- ${objective}`)
    .join("\n")}\n\n## Metadata\n\nStatus: ${project.status}\nProgress: ${
    project.progress
  }%\nTags: ${project.tags.join(", ")}`;
}

export function artifactSnapshot(
  db: ResearchDatabase,
  artifactType: VersionArtifactType,
  artifactId: string,
): { content: string; data: VersionSnapshotData } | null {
  if (artifactType === "notebook") {
    const notebook = db.notebooks.find((item) => item.id === artifactId);
    if (!notebook) return null;
    return { content: notebookVersionContent(notebook), data: notebookVersionData(notebook) };
  }
  if (artifactType === "experiment") {
    const experiment = db.experiments.find((item) => item.id === artifactId);
    if (!experiment) return null;
    return {
      content: experimentVersionContent(experiment),
      data: experimentVersionData(experiment),
    };
  }
  if (artifactType === "project") {
    const project = db.projects.find((item) => item.id === artifactId);
    if (!project) return null;
    return { content: projectVersionContent(project), data: projectVersionData(project) };
  }
  return null;
}

export function nextVersionNumber(
  db: ResearchDatabase,
  artifactType: VersionArtifactType,
  artifactId: string,
): number {
  return (
    db.versions
      .filter(
        (version) =>
          version.artifactType === artifactType && version.artifactId === artifactId,
      )
      .reduce((max, version) => Math.max(max, version.versionNumber), 0) + 1
  );
}

export function recordArtifactVersion(
  db: ResearchDatabase,
  artifactType: VersionArtifactType,
  artifactId: string,
  options: {
    label?: string;
    summary?: string;
    author?: Person;
    force?: boolean;
    data?: VersionSnapshotData;
    content?: string;
  } = {},
): ArtifactVersion | null {
  const snapshot = artifactSnapshot(db, artifactType, artifactId);
  if (!snapshot) return null;

  const content = options.content ?? snapshot.content;
  const data = options.data ?? snapshot.data;
  const previous = db.versions
    .filter(
      (version) =>
        version.artifactType === artifactType && version.artifactId === artifactId,
    )
    .sort((a, b) => b.versionNumber - a.versionNumber)[0];

  if (
    !options.force &&
    previous &&
    previous.content === content &&
    JSON.stringify(previous.data) === JSON.stringify(data)
  ) {
    return null;
  }

  const versionNumber = nextVersionNumber(db, artifactType, artifactId);
  const version: ArtifactVersion = {
    id: `ver_${artifactType}_${artifactId}_${versionNumber}_${Date.now()}`,
    workspaceId: db.workspace.id,
    artifactType,
    artifactId,
    versionNumber,
    label: options.label ?? `v${versionNumber}`,
    summary: options.summary ?? "Saved a new version.",
    content,
    data,
    author: options.author ?? currentPerson(db),
    createdAt: new Date().toISOString(),
  };
  db.versions.push(version);
  return version;
}

/** Plain-text table parser used by the table diff mode. */
export function parseTableText(content: string): { rows: string[][] } {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.includes("|"));
  const rows = lines
    .filter((line) => !/^\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?$/.test(line))
    .map((line) =>
      line
        .replace(/^\|/, "")
        .replace(/\|$/, "")
        .split("|")
        .map((cell) => cell.trim()),
    );
  return { rows };
}
