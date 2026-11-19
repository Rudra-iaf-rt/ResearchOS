import type {
  ActivityCategory,
  ArtifactType,
  FileKind,
  MilestoneStatus,
  NotificationKind,
  PaperReadStatus,
  ProjectStatus,
  ResearchMode,
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
