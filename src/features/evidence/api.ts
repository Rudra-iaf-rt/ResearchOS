import type {
  ArtifactType,
  EvidenceStance,
  HypothesisEvidence,
} from "@/types";
import { uid } from "@/lib/format";
import { resolveArtifact } from "@/features/artifacts/lib";
import {
  logActivity,
  mutateDb,
  pushNotification,
  readDb,
} from "@/services/mock/client";

export interface EvidenceInput {
  stance: EvidenceStance;
  description: string;
  artifactType?: ArtifactType | null;
  artifactId?: string | null;
}

export const evidenceApi = {
  list: (hypothesisId: string) =>
    readDb((db) =>
      db.evidence
        .filter((item) => item.hypothesisId === hypothesisId)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    ),

  create: (hypothesisId: string, input: EvidenceInput) =>
    mutateDb((db) => {
      const hypothesis = db.hypotheses.find((item) => item.id === hypothesisId);
      if (!hypothesis) throw new Error("Hypothesis not found");
      const artifact = resolveArtifact(db, input.artifactType, input.artifactId);
      if (input.artifactId && !artifact) {
        throw new Error("The linked artifact is no longer available");
      }
      const now = new Date().toISOString();
      const evidence: HypothesisEvidence = {
        id: uid("ev"),
        workspaceId: db.workspace.id,
        hypothesisId,
        stance: input.stance,
        description: input.description.trim(),
        artifact,
        createdBy: db.user.id,
        createdAt: now,
        updatedAt: now,
      };
      db.evidence.push(evidence);
      logActivity(db, {
        category: "hypothesis",
        action:
          input.stance === "supports"
            ? "added supporting evidence"
            : input.stance === "contradicts"
              ? "added contradicting evidence"
              : "added neutral evidence",
        target: hypothesis.statement,
        detail: evidence.description,
        projectId: hypothesis.projectId,
        artifact,
      });
      pushNotification(db, {
        kind: "system",
        title: "Evidence recorded",
        description: `${input.stance === "supports" ? "Supporting" : input.stance === "contradicts" ? "Contradicting" : "Neutral"} evidence was added to “${hypothesis.statement}”.`,
        href: "/app/hypotheses",
      });
      return evidence;
    }),

  remove: (evidenceId: string) =>
    mutateDb((db) => {
      const evidence = db.evidence.find((item) => item.id === evidenceId);
      if (!evidence) throw new Error("Evidence not found");
      const hypothesis = db.hypotheses.find((item) => item.id === evidence.hypothesisId);
      db.evidence = db.evidence.filter((item) => item.id !== evidenceId);
      if (hypothesis) {
        logActivity(db, {
          category: "hypothesis",
          action: "removed evidence",
          target: hypothesis.statement,
          detail: evidence.description,
          projectId: hypothesis.projectId,
        });
      }
      return { id: evidenceId };
    }),
};
