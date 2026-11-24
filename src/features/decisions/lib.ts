import type { ResearchArtifactRef } from "@/types";
import { artifactHref } from "@/features/artifacts/lib";

/** Resolve any research artifact reference — including Phase 3 records — to a route. */
export function researchArtifactHref(artifact: ResearchArtifactRef): string {
  switch (artifact.type) {
    case "experiment":
      return `/app/experiments/${artifact.id}`;
    case "hypothesis":
      return `/app/hypotheses?focus=${artifact.id}`;
    case "decision":
      return `/app/decisions?focus=${artifact.id}`;
    default:
      return artifactHref({ type: artifact.type, id: artifact.id });
  }
}
