import type { SnapshotManifestEntry } from "@/types";

/** Route for a manifest entry, or null when the artifact has no workspace view. */
export function snapshotArtifactHref(entry: SnapshotManifestEntry): string | null {
  switch (entry.artifactType) {
    case "notebook":
      return `/app/notebooks/${entry.artifactId}`;
    case "experiment":
      return `/app/experiments/${entry.artifactId}`;
    case "decision":
      return `/app/decisions?focus=${entry.artifactId}`;
    case "dataset":
    case "file":
      return `/app/files?file=${entry.artifactId}`;
    default:
      return null;
  }
}
