import type {
  ActivityCategory,
  ArtifactType,
  DecisionStatus,
  EvidenceStance,
  ExperimentStatus,
  FileKind,
  GraphEdgeType,
  GraphNodeType,
  HypothesisStatus,
  MilestoneStatus,
  NotificationKind,
  PaperReadStatus,
  ProjectStatus,
  ResearchMode,
  RunStatus,
  TaskPriority,
  TaskStatus,
} from "@/types";

export const projectStatusMeta: Record<
  ProjectStatus,
  { label: string; tone: "success" | "info" | "warning" | "neutral" }
> = {
  active: { label: "Active", tone: "success" },
  planning: { label: "Planning", tone: "info" },
  "on-hold": { label: "On hold", tone: "warning" },
  completed: { label: "Completed", tone: "neutral" },
};

export const taskStatusMeta: Record<
  TaskStatus,
  { label: string; column: string }
> = {
  todo: { label: "To do", column: "Backlog" },
  "in-progress": { label: "In progress", column: "In progress" },
  completed: { label: "Completed", column: "Completed" },
};

export const priorityMeta: Record<
  TaskPriority,
  { label: string; tone: "danger" | "warning" | "info" | "neutral" }
> = {
  urgent: { label: "Urgent", tone: "danger" },
  high: { label: "High", tone: "warning" },
  medium: { label: "Medium", tone: "info" },
  low: { label: "Low", tone: "neutral" },
};

export const milestoneStatusMeta: Record<
  MilestoneStatus,
  { label: string; tone: "success" | "info" | "warning" | "neutral" | "danger" }
> = {
  upcoming: { label: "Upcoming", tone: "neutral" },
  "in-progress": { label: "In progress", tone: "info" },
  "at-risk": { label: "At risk", tone: "danger" },
  completed: { label: "Completed", tone: "success" },
};

export const readStatusMeta: Record<
  PaperReadStatus,
  { label: string; tone: "neutral" | "info" | "success" }
> = {
  unread: { label: "Unread", tone: "neutral" },
  reading: { label: "Reading", tone: "info" },
  read: { label: "Read", tone: "success" },
};

export const activityCategoryMeta: Record<
  ActivityCategory,
  { label: string }
> = {
  project: { label: "Projects" },
  task: { label: "Tasks" },
  notebook: { label: "Notebooks" },
  paper: { label: "Papers" },
  file: { label: "Files" },
  milestone: { label: "Milestones" },
  research: { label: "Research log" },
  experiment: { label: "Experiments" },
  hypothesis: { label: "Hypotheses" },
  decision: { label: "Decisions" },
  snapshot: { label: "Snapshots" },
};

export const experimentStatusMeta: Record<
  ExperimentStatus,
  { label: string; tone: "neutral" | "info" | "warning" | "success" | "danger" }
> = {
  draft: { label: "Draft", tone: "neutral" },
  queued: { label: "Queued", tone: "info" },
  running: { label: "Running", tone: "warning" },
  succeeded: { label: "Succeeded", tone: "success" },
  failed: { label: "Failed", tone: "danger" },
};

export const runStatusMeta: Record<
  RunStatus,
  { label: string; tone: "neutral" | "info" | "warning" | "success" | "danger" }
> = {
  queued: { label: "Queued", tone: "info" },
  running: { label: "Running", tone: "warning" },
  succeeded: { label: "Succeeded", tone: "success" },
  failed: { label: "Failed", tone: "danger" },
};

export const hypothesisStatusMeta: Record<
  HypothesisStatus,
  { label: string; tone: "neutral" | "info" | "warning" | "success" | "danger" }
> = {
  proposed: { label: "Proposed", tone: "neutral" },
  testing: { label: "Testing", tone: "info" },
  supported: { label: "Supported", tone: "success" },
  refuted: { label: "Refuted", tone: "danger" },
};

export const evidenceStanceMeta: Record<
  EvidenceStance,
  { label: string; tone: "success" | "danger" | "neutral" }
> = {
  supports: { label: "Supports", tone: "success" },
  contradicts: { label: "Contradicts", tone: "danger" },
  neutral: { label: "Neutral", tone: "neutral" },
};

export const decisionStatusMeta: Record<
  DecisionStatus,
  { label: string; tone: "neutral" | "info" | "success" | "warning" }
> = {
  proposed: { label: "Proposed", tone: "info" },
  accepted: { label: "Accepted", tone: "success" },
  superseded: { label: "Superseded", tone: "neutral" },
};

/** Allowed experiment lifecycle transitions. Final states are terminal. */
export const experimentTransitions: Record<ExperimentStatus, ExperimentStatus[]> = {
  draft: ["queued"],
  queued: ["running", "draft"],
  running: ["succeeded", "failed"],
  succeeded: [],
  failed: [],
};

/** Allowed run lifecycle transitions. */
export const runTransitions: Record<RunStatus, RunStatus[]> = {
  queued: ["running"],
  running: ["succeeded", "failed"],
  succeeded: [],
  failed: [],
};

export const researchModeMeta: Record<
  ResearchMode,
  {
    label: string;
    description: string;
    chip: string;
    dot: string;
    chartColor: string;
  }
> = {
  reading: {
    label: "Reading",
    description: "Papers, reviews, and literature notes",
    chip: "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300",
    dot: "bg-sky-500",
    chartColor: "#0284C7",
  },
  writing: {
    label: "Writing",
    description: "Manuscripts, protocols, and pre-registrations",
    chip: "bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300",
    dot: "bg-teal-500",
    chartColor: "#0D9488",
  },
  experiment: {
    label: "Experiment",
    description: "Lab work, runs, and data collection",
    chip: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
    dot: "bg-amber-500",
    chartColor: "#D97706",
  },
  analysis: {
    label: "Analysis",
    description: "Processing, statistics, and modelling",
    chip: "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300",
    dot: "bg-indigo-500",
    chartColor: "#6366F1",
  },
  review: {
    label: "Review",
    description: "Peer review, reading groups, and sign-off",
    chip: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300",
    dot: "bg-rose-500",
    chartColor: "#E11D48",
  },
  admin: {
    label: "Admin",
    description: "Operations, procurement, and coordination",
    chip: "bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-slate-300",
    dot: "bg-slate-400",
    chartColor: "#64748B",
  },
};

export const researchModes = Object.keys(researchModeMeta) as ResearchMode[];

export const graphNodeTypeMeta: Record<
  GraphNodeType,
  { label: string; plural: string; description: string; color: string; chip: string }
> = {
  project: {
    label: "Project",
    plural: "Projects",
    description: "A research project",
    color: "#0D9488",
    chip: "bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300",
  },
  experiment: {
    label: "Experiment",
    plural: "Experiments",
    description: "A planned or running study",
    color: "#6366F1",
    chip: "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300",
  },
  run: {
    label: "Run",
    plural: "Runs",
    description: "An analysis or acquisition run",
    color: "#0284C7",
    chip: "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300",
  },
  hypothesis: {
    label: "Hypothesis",
    plural: "Hypotheses",
    description: "A testable claim or conclusion",
    color: "#D97706",
    chip: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
  },
  paper: {
    label: "Paper",
    plural: "Papers",
    description: "A library citation",
    color: "#7C3AED",
    chip: "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300",
  },
  notebook: {
    label: "Notebook",
    plural: "Notebooks",
    description: "A research notebook",
    color: "#0F766E",
    chip: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
  },
  dataset: {
    label: "Dataset",
    plural: "Datasets",
    description: "A dataset or data file",
    color: "#475569",
    chip: "bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-slate-300",
  },
  decision: {
    label: "Decision",
    plural: "Decisions",
    description: "A recorded project decision",
    color: "#BE123C",
    chip: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300",
  },
};

export const graphNodeTypes = Object.keys(graphNodeTypeMeta) as GraphNodeType[];

export const graphEdgeTypeMeta: Record<
  GraphEdgeType,
  { label: string; dashed: boolean; color: string; description: string }
> = {
  depends: {
    label: "Depends on",
    dashed: false,
    color: "#64748B",
    description: "Solid arrow — the source depends on the target",
  },
  derived_from: {
    label: "Derived from",
    dashed: true,
    color: "#0D9488",
    description: "Dashed arrow — the source was derived from the target",
  },
  cites: {
    label: "Cites",
    dashed: true,
    color: "#7C3AED",
    description: "Dashed arrow — a citation relationship",
  },
  tests: {
    label: "Tests",
    dashed: false,
    color: "#4F46E5",
    description: "Solid arrow — the source tests the target",
  },
  links: {
    label: "Links",
    dashed: true,
    color: "#0891B2",
    description: "Dotted relationship between artifacts",
  },
  branches: {
    label: "Branches",
    dashed: false,
    color: "#D97706",
    description: "Solid arrow — the source branches into the target",
  },
};

export const graphEdgeTypes = Object.keys(graphEdgeTypeMeta) as GraphEdgeType[];

export const graphLayoutMeta = {
  "dagre-lr": { label: "Left to right", description: "Layered DAG, left to right" },
  "dagre-tb": { label: "Top to bottom", description: "Layered DAG, top to bottom" },
  radial: { label: "Radial", description: "Concentric rings by depth" },
  manual: { label: "Manual", description: "Stored node positions" },
} as const;

export type GraphLayout = keyof typeof graphLayoutMeta;

export const artifactTypeMeta: Record<
  ArtifactType,
  { label: string; plural: string }
> = {
  project: { label: "Project", plural: "Projects" },
  task: { label: "Task", plural: "Tasks" },
  notebook: { label: "Notebook", plural: "Notebooks" },
  paper: { label: "Paper", plural: "Papers" },
  file: { label: "File", plural: "Files" },
  milestone: { label: "Milestone", plural: "Milestones" },
};

export const artifactTypes = Object.keys(artifactTypeMeta) as ArtifactType[];

export const notificationKindMeta: Record<
  NotificationKind,
  { label: string; dot: string; soft: string }
> = {
  deadline: {
    label: "Deadline",
    dot: "bg-amber-500",
    soft: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
  },
  assignment: {
    label: "Assignment",
    dot: "bg-indigo-500",
    soft: "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300",
  },
  mention: {
    label: "Mention",
    dot: "bg-teal-500",
    soft: "bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300",
  },
  review: {
    label: "Review",
    dot: "bg-rose-500",
    soft: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300",
  },
  system: {
    label: "System",
    dot: "bg-slate-400",
    soft: "bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-slate-300",
  },
};

export const fileKindMeta: Record<
  FileKind,
  { label: string; color: string }
> = {
  pdf: { label: "PDF", color: "text-rose-600 bg-rose-50 dark:bg-rose-500/10 dark:text-rose-300" },
  dataset: { label: "Dataset", color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 dark:text-indigo-300" },
  image: { label: "Image", color: "text-sky-600 bg-sky-50 dark:bg-sky-500/10 dark:text-sky-300" },
  document: { label: "Document", color: "text-navy-700 bg-slate-100 dark:bg-slate-500/10 dark:text-slate-300" },
  code: { label: "Code", color: "text-teal-700 bg-teal-50 dark:bg-teal-500/10 dark:text-teal-300" },
  spreadsheet: { label: "Spreadsheet", color: "text-emerald-700 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-300" },
  archive: { label: "Archive", color: "text-amber-700 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-300" },
};

export const projectAccentClasses = {
  teal: {
    dot: "bg-teal-500",
    soft: "bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300",
    bar: "bg-teal-600",
  },
  indigo: {
    dot: "bg-indigo-500",
    soft: "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300",
    bar: "bg-indigo-500",
  },
  amber: {
    dot: "bg-amber-500",
    soft: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
    bar: "bg-amber-500",
  },
  rose: {
    dot: "bg-rose-500",
    soft: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300",
    bar: "bg-rose-500",
  },
  sky: {
    dot: "bg-sky-500",
    soft: "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300",
    bar: "bg-sky-500",
  },
} as const;

export const researchFields = [
  "Computational Biology",
  "Neuroscience",
  "Materials Science",
  "Climate Science",
  "Public Health",
  "Computer Science",
  "Physics",
  "Chemistry",
  "Social Sciences",
  "Engineering",
];

export const STORAGE_LIMIT_BYTES = 20 * 1024 * 1024 * 1024; // 20 GB demo workspace quota
