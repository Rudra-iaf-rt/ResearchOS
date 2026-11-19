import { Badge } from "@/components/ui/badge";
import {
  milestoneStatusMeta,
  priorityMeta,
  projectStatusMeta,
  readStatusMeta,
} from "@/lib/constants";
import type {
  MilestoneStatus,
  PaperReadStatus,
  ProjectStatus,
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
