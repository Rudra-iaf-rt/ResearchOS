import type {
  ExperimentRun,
  ParameterEntry,
  RunStatus,
} from "@/types";
import { uid } from "@/lib/format";
import { runTransitions } from "@/lib/constants";
import {
  currentPerson,
  logActivity,
  mutateDb,
  pushNotification,
  readDb,
} from "@/services/mock/client";
import { formatDurationSeconds } from "./lib";

function clock() {
  return new Date().toISOString().slice(11, 19);
}

function appendLog(run: ExperimentRun, level: string, message: string) {
  const line = `[${clock()}] ${level.padEnd(5)} ${message}`;
  run.logs = run.logs.trim().length ? `${run.logs}\n${line}` : line;
}

export const runsApi = {
  list: (experimentId: string) =>
    readDb((db) =>
      db.experimentRuns
        .filter((run) => run.experimentId === experimentId)
        .sort((a, b) => a.runNumber - b.runNumber),
    ),

  listAll: () => readDb((db) => db.experimentRuns),

  get: (runId: string) =>
    readDb((db) => {
      const run = db.experimentRuns.find((item) => item.id === runId);
      if (!run) throw new Error("Run not found");
      return run;
    }),

  create: (experimentId: string, input: { label: string }) =>
    mutateDb((db) => {
      const experiment = db.experiments.find((item) => item.id === experimentId);
      if (!experiment) throw new Error("Experiment not found");
      const runNumber =
        db.experimentRuns
          .filter((run) => run.experimentId === experimentId)
          .reduce((max, run) => Math.max(max, run.runNumber), 0) + 1;
      const now = new Date().toISOString();
      const run: ExperimentRun = {
        id: uid("run"),
        workspaceId: db.workspace.id,
        experimentId,
        projectId: experiment.projectId,
        runNumber,
        label: input.label.trim() || `run-${runNumber}`,
        status: "queued",
        parameters: structuredClone(experiment.parameters) as ParameterEntry[],
        logs: "",
        artifactRefs: [],
        startedAt: null,
        endedAt: null,
        durationSeconds: null,
        createdBy: db.user.id,
        createdAt: now,
        updatedAt: now,
      };
      db.experimentRuns.push(run);
      logActivity(db, {
        category: "experiment",
        action: "queued a run",
        target: `${experiment.title} · ${run.label}`,
        detail: `Run ${run.runNumber}`,
        projectId: experiment.projectId,
      });
      return run;
    }),

  setStatus: (runId: string, next: RunStatus) =>
    mutateDb((db) => {
      const run = db.experimentRuns.find((item) => item.id === runId);
      if (!run) throw new Error("Run not found");
      const allowed = runTransitions[run.status];
      if (!allowed.includes(next)) {
        throw new Error(`Cannot move a run from ${run.status} to ${next}.`);
      }
      const experiment = db.experiments.find((item) => item.id === run.experimentId);
      const previous = run.status;
      const now = new Date().toISOString();
      run.status = next;
      run.updatedAt = now;

      if (next === "running") {
        run.startedAt = now;
        run.endedAt = null;
        run.durationSeconds = null;
        appendLog(run, "INFO", `Run started by ${currentPerson(db).name}`);
      }

      if (next === "succeeded" || next === "failed") {
        run.endedAt = now;
        if (run.startedAt) {
          run.durationSeconds = Math.max(
            0,
            Math.round((new Date(now).getTime() - new Date(run.startedAt).getTime()) / 1000),
          );
        }
        appendLog(
          run,
          next === "succeeded" ? "DONE" : "ERROR",
          next === "succeeded"
            ? `Run finished successfully in ${formatDurationSeconds(run.durationSeconds)}`
            : "Run failed. Inspect the log and parameter snapshot before retrying.",
        );
      }

      logActivity(db, {
        category: "experiment",
        action: next === "running" ? "started a run" : next === "succeeded" ? "completed a run" : next === "failed" ? "failed a run" : "requeued a run",
        target: experiment ? `${experiment.title} · ${run.label}` : run.label,
        detail: `${previous} → ${next}`,
        projectId: run.projectId,
      });

      if (next === "succeeded" || next === "failed") {
        pushNotification(db, {
          kind: "system",
          title: next === "succeeded" ? "Run completed" : "Run failed",
          description: `${run.label} ${next}. ${formatDurationSeconds(run.durationSeconds)} recorded.`,
          href: experiment ? `/app/experiments/${experiment.id}` : undefined,
        });
      }

      return run;
    }),
};
