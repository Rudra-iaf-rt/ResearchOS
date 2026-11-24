import type {
  ArtifactRef,
  ArtifactType,
  Experiment,
  ExperimentStatus,
  ParameterEntry,
  ResearchArtifactType,
  ResearchDatabase,
} from "@/types";
import { uid } from "@/lib/format";
import { experimentTransitions } from "@/lib/constants";
import {
  currentPerson,
  logActivity,
  mutateDb,
  pushNotification,
  readDb,
} from "@/services/mock/client";
import { resolveArtifact } from "@/features/artifacts/lib";

export interface ExperimentInput {
  title: string;
  projectId: string;
  hypothesisId: string | null;
  description: string;
  parameters: ParameterEntry[];
}

function validateParameters(parameters: ParameterEntry[]) {
  const seen = new Set<string>();
  parameters.forEach((parameter) => {
    const key = parameter.key.trim().toLowerCase();
    if (!key) throw new Error("Parameter names cannot be empty");
    if (seen.has(key)) throw new Error(`Duplicate parameter: ${parameter.key}`);
    seen.add(key);
  });
}

function assertExperimentLinks(
  db: ResearchDatabase,
  projectId: string,
  hypothesisId: string | null,
) {
  if (!db.projects.some((project) => project.id === projectId)) {
    throw new Error("Choose an existing project");
  }
  if (hypothesisId) {
    const hypothesis = db.hypotheses.find((item) => item.id === hypothesisId);
    if (!hypothesis) throw new Error("The linked hypothesis no longer exists");
    if (hypothesis.projectId !== projectId) {
      throw new Error("The linked hypothesis belongs to a different project");
    }
  }
}

export const experimentsApi = {
  list: () => readDb((db) => db.experiments),

  get: (id: string) =>
    readDb((db) => {
      const experiment = db.experiments.find((item) => item.id === id);
      if (!experiment) throw new Error("Experiment not found");
      return experiment;
    }),

  create: (input: ExperimentInput) =>
    mutateDb((db) => {
      assertExperimentLinks(db, input.projectId, input.hypothesisId);
      validateParameters(input.parameters);
      const now = new Date().toISOString();
      const experiment: Experiment = {
        id: uid("exp"),
        workspaceId: db.workspace.id,
        projectId: input.projectId,
        hypothesisId: input.hypothesisId,
        title: input.title.trim(),
        description: input.description.trim(),
        status: "draft",
        parameters: structuredClone(input.parameters),
        notes: "",
        artifactRefs: [],
        owner: currentPerson(db),
        createdBy: db.user.id,
        createdAt: now,
        updatedAt: now,
      };
      db.experiments.unshift(experiment);
      logActivity(db, {
        category: "experiment",
        action: "created an experiment",
        target: experiment.title,
        projectId: experiment.projectId,
      });
      pushNotification(db, {
        kind: "system",
        title: "Experiment created",
        description: `“${experiment.title}” is ready for its first run.`,
        href: `/app/experiments/${experiment.id}`,
      });
      return experiment;
    }),

  update: (id: string, input: Partial<ExperimentInput>) =>
    mutateDb((db) => {
      const experiment = db.experiments.find((item) => item.id === id);
      if (!experiment) throw new Error("Experiment not found");
      const projectId = input.projectId ?? experiment.projectId;
      const hypothesisId =
        input.hypothesisId !== undefined ? input.hypothesisId : experiment.hypothesisId;
      assertExperimentLinks(db, projectId, hypothesisId);
      if (input.parameters) validateParameters(input.parameters);
      Object.assign(experiment, input, { updatedAt: new Date().toISOString() });
      logActivity(db, {
        category: "experiment",
        action: "updated an experiment",
        target: experiment.title,
        projectId: experiment.projectId,
      });
      return experiment;
    }),

  setStatus: (id: string, next: ExperimentStatus) =>
    mutateDb((db) => {
      const experiment = db.experiments.find((item) => item.id === id);
      if (!experiment) throw new Error("Experiment not found");
      const allowed = experimentTransitions[experiment.status];
      if (!allowed.includes(next)) {
        throw new Error(
          `Cannot move an experiment from ${experiment.status} to ${next}.`,
        );
      }
      const previous = experiment.status;
      experiment.status = next;
      experiment.updatedAt = new Date().toISOString();
      logActivity(db, {
        category: "experiment",
        action: "changed experiment status",
        target: experiment.title,
        detail: `${previous} → ${next}`,
        projectId: experiment.projectId,
      });
      if (next === "succeeded" || next === "failed") {
        pushNotification(db, {
          kind: "system",
          title: next === "succeeded" ? "Experiment succeeded" : "Experiment failed",
          description: `“${experiment.title}” moved to ${next}.`,
          href: `/app/experiments/${experiment.id}`,
        });
      }
      return experiment;
    }),

  saveParameters: (id: string, parameters: ParameterEntry[]) =>
    mutateDb((db) => {
      const experiment = db.experiments.find((item) => item.id === id);
      if (!experiment) throw new Error("Experiment not found");
      validateParameters(parameters);
      experiment.parameters = structuredClone(parameters);
      experiment.updatedAt = new Date().toISOString();
      logActivity(db, {
        category: "experiment",
        action: "updated experiment parameters",
        target: experiment.title,
        detail: `${parameters.length} parameters`,
        projectId: experiment.projectId,
      });
      return experiment;
    }),

  saveNotes: (id: string, notes: string) =>
    mutateDb((db) => {
      const experiment = db.experiments.find((item) => item.id === id);
      if (!experiment) throw new Error("Experiment not found");
      experiment.notes = notes;
      experiment.updatedAt = new Date().toISOString();
      return experiment;
    }),

  linkArtifact: (id: string, type: ResearchArtifactType, artifactId: string) =>
    mutateDb((db) => {
      const experiment = db.experiments.find((item) => item.id === id);
      if (!experiment) throw new Error("Experiment not found");
      if (type !== "notebook" && type !== "file") {
        throw new Error("Experiments can link notebooks and files");
      }
      const artifact = resolveArtifact(db, type as ArtifactType, artifactId);
      if (!artifact) throw new Error("Artifact not found");
      if (
        experiment.artifactRefs.some(
          (item) => item.type === artifact.type && item.id === artifact.id,
        )
      ) {
        return experiment;
      }
      experiment.artifactRefs.push(artifact);
      experiment.updatedAt = new Date().toISOString();
      logActivity(db, {
        category: "experiment",
        action: "linked an artifact to an experiment",
        target: experiment.title,
        detail: artifact.label,
        projectId: experiment.projectId,
        artifact,
      });
      return experiment;
    }),

  unlinkArtifact: (id: string, type: ArtifactRef["type"], artifactId: string) =>
    mutateDb((db) => {
      const experiment = db.experiments.find((item) => item.id === id);
      if (!experiment) throw new Error("Experiment not found");
      experiment.artifactRefs = experiment.artifactRefs.filter(
        (item) => !(item.type === type && item.id === artifactId),
      );
      experiment.updatedAt = new Date().toISOString();
      return experiment;
    }),

  remove: (id: string) =>
    mutateDb((db) => {
      const experiment = db.experiments.find((item) => item.id === id);
      db.experiments = db.experiments.filter((item) => item.id !== id);
      db.experimentRuns = db.experimentRuns.filter((run) => run.experimentId !== id);
      db.versions = db.versions.filter(
        (version) => !(version.artifactType === "experiment" && version.artifactId === id),
      );
      db.decisions = db.decisions.map((decision) => ({
        ...decision,
        artifacts: decision.artifacts.filter(
          (artifact) => !(artifact.type === "experiment" && artifact.id === id),
        ),
      }));
      if (experiment) {
        logActivity(db, {
          category: "experiment",
          action: "deleted an experiment",
          target: experiment.title,
          projectId: experiment.projectId,
        });
      }
      return { id };
    }),
};
