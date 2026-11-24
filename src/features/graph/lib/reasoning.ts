import type {
  GraphEdge,
  GraphNode,
  ResearchArtifactRef,
  ResearchDatabase,
} from "@/types";
import { formatDurationSeconds } from "@/features/runs/lib";

function datasetNodeId(id: string) {
  return id.startsWith("dataset:") ? id : `dataset:${id}`;
}

function notebookNodeId(id: string) {
  return id.startsWith("notebook:") ? id : `notebook:${id}`;
}

function paperNodeId(id: string) {
  return id.startsWith("paper:") ? id : `paper:${id}`;
}

function artifactNodeId(ref: ResearchArtifactRef): string | null {
  switch (ref.type) {
    case "notebook":
      return notebookNodeId(ref.id);
    case "paper":
      return paperNodeId(ref.id);
    case "file":
      return datasetNodeId(ref.id);
    case "experiment":
    case "hypothesis":
    case "decision":
      return ref.id;
    default:
      return null;
  }
}

/**
 * Materialize Phase 3 reasoning records into the Phase 2 graph contract.
 * Relationships come only from stored records: a hypothesis and experiment are
 * linked only when the experiment names that hypothesis, runs when they belong
 * to an experiment, and artifact links when they were actually recorded.
 */
export function reasoningGraph(db: ResearchDatabase): {
  nodes: GraphNode[];
  edges: GraphEdge[];
} {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const runByExperiment = new Map<string, typeof db.experimentRuns>();
  const evidenceByHypothesis = new Map<string, typeof db.evidence>();

  db.experimentRuns.forEach((run) => {
    const list = runByExperiment.get(run.experimentId) ?? [];
    list.push(run);
    runByExperiment.set(run.experimentId, list);
  });
  db.evidence.forEach((item) => {
    const list = evidenceByHypothesis.get(item.hypothesisId) ?? [];
    list.push(item);
    evidenceByHypothesis.set(item.hypothesisId, list);
  });

  db.hypotheses.forEach((hypothesis) => {
    const evidence = evidenceByHypothesis.get(hypothesis.id) ?? [];
    const experiments = db.experiments.filter(
      (experiment) => experiment.hypothesisId === hypothesis.id,
    );
    nodes.push({
      id: hypothesis.id,
      type: "hypothesis",
      label: hypothesis.statement,
      status: hypothesis.status,
      metadata: {
        kind: "hypothesis",
        projectId: hypothesis.projectId,
        owner: hypothesis.owner.name,
        description: hypothesis.researchQuestion,
        date: hypothesis.updatedAt,
        href: `/app/hypotheses?focus=${hypothesis.id}`,
        metrics: [
          {
            label: "Evidence",
            value: `${evidence.filter((item) => item.stance === "supports").length} for / ${
              evidence.filter((item) => item.stance === "contradicts").length
            } against`,
          },
          { label: "Experiments", value: String(experiments.length) },
        ],
      },
    });
    edges.push({
      id: `ge3_project_${hypothesis.projectId}_${hypothesis.id}`,
      from: `project:${hypothesis.projectId}`,
      to: hypothesis.id,
      type: "depends",
    });
  });

  db.experiments.forEach((experiment) => {
    const runs = runByExperiment.get(experiment.id) ?? [];
    nodes.push({
      id: experiment.id,
      type: "experiment",
      label: experiment.title,
      status: experiment.status,
      metadata: {
        projectId: experiment.projectId,
        owner: experiment.owner.name,
        description: experiment.description,
        date: experiment.updatedAt,
        href: `/app/experiments/${experiment.id}`,
        action: "open-experiment",
        metrics: [
          { label: "Runs", value: String(runs.length) },
          { label: "Parameters", value: String(experiment.parameters.length) },
        ],
      },
    });
    if (experiment.hypothesisId) {
      edges.push({
        id: `ge3_hyp_exp_${experiment.hypothesisId}_${experiment.id}`,
        from: experiment.hypothesisId,
        to: experiment.id,
        type: "branches",
      });
    }
    experiment.artifactRefs.forEach((artifact) => {
      const nodeId = artifactNodeId(artifact);
      if (nodeId) {
        edges.push({
          id: `ge3_exp_artifact_${experiment.id}_${nodeId}`,
          from: nodeId,
          to: experiment.id,
          type: "links",
        });
      }
    });
  });

  db.experimentRuns.forEach((run) => {
    const experiment = db.experiments.find((item) => item.id === run.experimentId);
    nodes.push({
      id: run.id,
      type: "run",
      label: run.label,
      status: run.status,
      metadata: {
        projectId: run.projectId,
        owner: experiment?.owner.name,
        date: run.endedAt ?? run.startedAt ?? run.createdAt,
        href: `/app/experiments/${run.experimentId}?tab=runs&run=${run.id}`,
        action: "open-run-logs",
        metrics: [
          { label: "Duration", value: formatDurationSeconds(run.durationSeconds) },
          { label: "Artifacts", value: String(run.artifactRefs.length) },
        ],
      },
    });
    edges.push({
      id: `ge3_exp_run_${run.experimentId}_${run.id}`,
      from: run.experimentId,
      to: run.id,
      type: "tests",
    });
    if (experiment?.hypothesisId && run.status === "succeeded") {
      edges.push({
        id: `ge3_run_hyp_${run.id}_${experiment.hypothesisId}`,
        from: run.id,
        to: experiment.hypothesisId,
        type: "derived_from",
      });
    }
  });

  db.decisions.forEach((decision) => {
    nodes.push({
      id: decision.id,
      type: "decision",
      label: decision.title,
      status: decision.status,
      metadata: {
        kind: "decision",
        projectId: decision.projectId,
        owner: decision.owner.name,
        description: decision.context,
        date: decision.updatedAt,
        href: `/app/decisions?focus=${decision.id}`,
        metrics: [
          { label: "Alternatives", value: String(decision.alternatives.length) },
          { label: "Artifacts", value: String(decision.artifacts.length) },
        ],
      },
    });
    decision.artifacts.forEach((artifact) => {
      const nodeId = artifactNodeId(artifact);
      if (nodeId) {
        edges.push({
          id: `ge3_dec_artifact_${decision.id}_${nodeId}`,
          from: decision.id,
          to: nodeId,
          type: "links",
        });
      }
    });
  });

  db.evidence.forEach((item) => {
    if (!item.artifact) return;
    const nodeId = artifactNodeId(item.artifact);
    if (!nodeId) return;
    edges.push({
      id: `ge3_evidence_${item.id}_${nodeId}`,
      from: nodeId,
      to: item.hypothesisId,
      type: "links",
    });
  });

  return { nodes, edges };
}
