import type { Hypothesis, HypothesisStatus, ResearchDatabase } from "@/types";
import { uid } from "@/lib/format";
import {
  currentPerson,
  logActivity,
  mutateDb,
  pushNotification,
  readDb,
} from "@/services/mock/client";

export interface HypothesisInput {
  researchQuestion: string;
  statement: string;
  projectId: string;
}

function assertProject(db: ResearchDatabase, projectId: string) {
  if (!db.projects.some((project) => project.id === projectId)) {
    throw new Error("Choose an existing project");
  }
}

export const hypothesesApi = {
  list: () => readDb((db) => db.hypotheses),

  get: (id: string) =>
    readDb((db) => {
      const hypothesis = db.hypotheses.find((item) => item.id === id);
      if (!hypothesis) throw new Error("Hypothesis not found");
      return hypothesis;
    }),

  create: (input: HypothesisInput) =>
    mutateDb((db) => {
      assertProject(db, input.projectId);
      const now = new Date().toISOString();
      const hypothesis: Hypothesis = {
        id: uid("hyp"),
        workspaceId: db.workspace.id,
        projectId: input.projectId,
        researchQuestion: input.researchQuestion.trim(),
        statement: input.statement.trim(),
        status: "proposed",
        owner: currentPerson(db),
        createdBy: db.user.id,
        createdAt: now,
        updatedAt: now,
      };
      db.hypotheses.unshift(hypothesis);
      logActivity(db, {
        category: "hypothesis",
        action: "created a hypothesis",
        target: hypothesis.statement,
        projectId: hypothesis.projectId,
      });
      pushNotification(db, {
        kind: "system",
        title: "Hypothesis created",
        description: `“${hypothesis.statement}” is now in the Proposed column.`,
        href: "/app/hypotheses",
      });
      return hypothesis;
    }),

  update: (id: string, input: Partial<HypothesisInput>) =>
    mutateDb((db) => {
      const hypothesis = db.hypotheses.find((item) => item.id === id);
      if (!hypothesis) throw new Error("Hypothesis not found");
      if (input.projectId) assertProject(db, input.projectId);
      Object.assign(hypothesis, input, { updatedAt: new Date().toISOString() });
      logActivity(db, {
        category: "hypothesis",
        action: "updated a hypothesis",
        target: hypothesis.statement,
        projectId: hypothesis.projectId,
      });
      return hypothesis;
    }),

  setStatus: (id: string, status: HypothesisStatus) =>
    mutateDb((db) => {
      const hypothesis = db.hypotheses.find((item) => item.id === id);
      if (!hypothesis) throw new Error("Hypothesis not found");
      const previous = hypothesis.status;
      if (previous === status) return hypothesis;
      hypothesis.status = status;
      hypothesis.updatedAt = new Date().toISOString();
      logActivity(db, {
        category: "hypothesis",
        action:
          status === "supported" || status === "refuted"
            ? `marked a hypothesis ${status}`
            : "changed hypothesis status",
        target: hypothesis.statement,
        detail: `${previous} → ${status}`,
        projectId: hypothesis.projectId,
      });
      if (status === "supported" || status === "refuted") {
        pushNotification(db, {
          kind: "system",
          title: `Hypothesis ${status}`,
          description: `“${hypothesis.statement}” was promoted to ${status}.`,
          href: "/app/hypotheses",
        });
      }
      return hypothesis;
    }),
};
