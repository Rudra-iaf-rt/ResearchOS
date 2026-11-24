import type {
  ArtifactType,
  DecisionStatus,
  ResearchArtifactRef,
  ResearchDatabase,
  ResearchDecision,
} from "@/types";
import { uid } from "@/lib/format";
import { resolveArtifact } from "@/features/artifacts/lib";
import {
  currentPerson,
  logActivity,
  mutateDb,
  pushNotification,
  readDb,
} from "@/services/mock/client";

export interface DecisionInput {
  title: string;
  projectId: string;
  context: string;
  decision: string;
  alternatives: ResearchDecision["alternatives"];
  artifacts: ResearchArtifactRef[];
  status: DecisionStatus;
}

function artifactProjectId(db: ResearchDatabase, ref: ResearchArtifactRef): string | null {
  if (ref.type === "experiment") {
    return db.experiments.find((item) => item.id === ref.id)?.projectId ?? null;
  }
  if (ref.type === "hypothesis") {
    return db.hypotheses.find((item) => item.id === ref.id)?.projectId ?? null;
  }
  if (ref.type === "decision") {
    return db.decisions.find((item) => item.id === ref.id)?.projectId ?? null;
  }
  const artifact = resolveArtifact(db, ref.type as ArtifactType, ref.id);
  if (!artifact) return null;
  if (ref.type === "project") return ref.id;
  const option = db.notebooks.find((item) => item.id === ref.id);
  if (option) return option.projectId;
  const paper = db.papers.find((item) => item.id === ref.id);
  if (paper) return paper.projectId;
  const file = db.files.find((item) => item.id === ref.id);
  if (file) return file.projectId;
  const task = db.tasks.find((item) => item.id === ref.id);
  if (task) return task.projectId;
  const milestone = db.milestones.find((item) => item.id === ref.id);
  if (milestone) return milestone.projectId;
  return null;
}

function validate(db: ResearchDatabase, input: DecisionInput) {
  if (!db.projects.some((project) => project.id === input.projectId)) {
    throw new Error("Choose an existing project");
  }
  input.artifacts.forEach((ref) => {
    const exists =
      ref.type === "experiment"
        ? db.experiments.some((item) => item.id === ref.id)
        : ref.type === "hypothesis"
          ? db.hypotheses.some((item) => item.id === ref.id)
          : ref.type === "decision"
            ? db.decisions.some((item) => item.id === ref.id)
            : Boolean(resolveArtifact(db, ref.type as ArtifactType, ref.id));
    if (!exists) throw new Error(`Linked artifact “${ref.label}” is no longer available`);
    const projectId = artifactProjectId(db, ref);
    if (projectId && projectId !== input.projectId) {
      throw new Error(`“${ref.label}” belongs to a different project`);
    }
  });
}

export const decisionsApi = {
  list: () => readDb((db) => db.decisions),

  get: (id: string) =>
    readDb((db) => {
      const decision = db.decisions.find((item) => item.id === id);
      if (!decision) throw new Error("Decision not found");
      return decision;
    }),

  create: (input: DecisionInput) =>
    mutateDb((db) => {
      validate(db, input);
      const now = new Date().toISOString();
      const decision: ResearchDecision = {
        id: uid("dec"),
        workspaceId: db.workspace.id,
        projectId: input.projectId,
        title: input.title.trim(),
        context: input.context.trim(),
        decision: input.decision.trim(),
        alternatives: input.alternatives.map((alternative) => ({
          ...alternative,
          title: alternative.title.trim(),
          rationale: alternative.rationale.trim(),
        })),
        artifacts: structuredClone(input.artifacts),
        status: input.status,
        owner: currentPerson(db),
        createdBy: db.user.id,
        createdAt: now,
        updatedAt: now,
      };
      db.decisions.unshift(decision);
      logActivity(db, {
        category: "decision",
        action: "recorded a research decision",
        target: decision.title,
        projectId: decision.projectId,
      });
      pushNotification(db, {
        kind: "system",
        title: "Decision recorded",
        description: `“${decision.title}” was added to the ${decision.status} decisions.`,
        href: "/app/decisions",
      });
      return decision;
    }),

  update: (id: string, input: Partial<DecisionInput>) =>
    mutateDb((db) => {
      const decision = db.decisions.find((item) => item.id === id);
      if (!decision) throw new Error("Decision not found");
      const merged: DecisionInput = {
        title: input.title ?? decision.title,
        projectId: input.projectId ?? decision.projectId,
        context: input.context ?? decision.context,
        decision: input.decision ?? decision.decision,
        alternatives: input.alternatives ?? decision.alternatives,
        artifacts: input.artifacts ?? decision.artifacts,
        status: input.status ?? decision.status,
      };
      validate(db, merged);
      Object.assign(decision, merged, { updatedAt: new Date().toISOString() });
      logActivity(db, {
        category: "decision",
        action: "updated a research decision",
        target: decision.title,
        projectId: decision.projectId,
      });
      return decision;
    }),

  setStatus: (id: string, status: DecisionStatus) =>
    mutateDb((db) => {
      const decision = db.decisions.find((item) => item.id === id);
      if (!decision) throw new Error("Decision not found");
      const previous = decision.status;
      decision.status = status;
      decision.updatedAt = new Date().toISOString();
      logActivity(db, {
        category: "decision",
        action: "changed decision status",
        target: decision.title,
        detail: `${previous} → ${status}`,
        projectId: decision.projectId,
      });
      return decision;
    }),

  remove: (id: string) =>
    mutateDb((db) => {
      const decision = db.decisions.find((item) => item.id === id);
      db.decisions = db.decisions.filter((item) => item.id !== id);
      if (decision) {
        logActivity(db, {
          category: "decision",
          action: "deleted a research decision",
          target: decision.title,
          projectId: decision.projectId,
        });
      }
      return { id };
    }),
};
