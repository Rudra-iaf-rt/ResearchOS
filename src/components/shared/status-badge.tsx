import { Badge } from "@/components/ui/badge";
import {
  decisionStatusMeta,
  evidenceStanceMeta,
  experimentStatusMeta,
  hypothesisStatusMeta,
  milestoneStatusMeta,
  priorityMeta,
  projectStatusMeta,
  readStatusMeta,
  runStatusMeta,
} from "@/lib/constants";
import type {
  DecisionStatus,
  EvidenceStance,
  ExperimentStatus,
  HypothesisStatus,
  MilestoneStatus,
  PaperReadStatus,
  ProjectStatus,
  RunStatus,
  TaskPriority,
} from "@/types";

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  const meta = projectStatusMeta[status];
  return (
    <Badge variant={meta.tone === "info" ? "info" : meta.tone}>
      <span
        className="size-1.5 rounded-full bg-current opacity-80"
        aria-hidden="true"
      />
      {meta.label}
    </Badge>
  );
}

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const meta = priorityMeta[priority];
  return <Badge variant={meta.tone}>{meta.label}</Badge>;
}

export function MilestoneStatusBadge({ status }: { status: MilestoneStatus }) {
  const meta = milestoneStatusMeta[status];
  return <Badge variant={meta.tone}>{meta.label}</Badge>;
}

export function PaperStatusBadge({ status }: { status: PaperReadStatus }) {
  const meta = readStatusMeta[status];
  return <Badge variant={meta.tone}>{meta.label}</Badge>;
}

export function ExperimentStatusBadge({ status }: { status: ExperimentStatus }) {
  const meta = experimentStatusMeta[status];
  return (
    <Badge variant={meta.tone}>
      <span className="size-1.5 rounded-full bg-current opacity-80" aria-hidden="true" />
      {meta.label}
    </Badge>
  );
}

export function RunStatusBadge({ status }: { status: RunStatus }) {
  const meta = runStatusMeta[status];
  return (
    <Badge variant={meta.tone}>
      <span className="size-1.5 rounded-full bg-current opacity-80" aria-hidden="true" />
      {meta.label}
    </Badge>
  );
}

export function HypothesisStatusBadge({ status }: { status: HypothesisStatus }) {
  const meta = hypothesisStatusMeta[status];
  return <Badge variant={meta.tone}>{meta.label}</Badge>;
}

export function EvidenceStanceBadge({ stance }: { stance: EvidenceStance }) {
  const meta = evidenceStanceMeta[stance];
  return <Badge variant={meta.tone}>{meta.label}</Badge>;
}

export function DecisionStatusBadge({ status }: { status: DecisionStatus }) {
  const meta = decisionStatusMeta[status];
  return <Badge variant={meta.tone}>{meta.label}</Badge>;
}
