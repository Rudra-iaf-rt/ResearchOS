export type ISODateString = string;

export type ProjectStatus = "active" | "planning" | "on-hold" | "completed";

export interface Person {
  id: string;
  name: string;
  initials: string;
  role?: string;
  color: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  objectives: string[];
  status: ProjectStatus;
  progress: number;
  tags: string[];
  startDate: ISODateString;
  targetDate: ISODateString;
  createdAt: ISODateString;
  updatedAt: ISODateString;
  owner: Person;
  members: Person[];
  accent: "teal" | "indigo" | "amber" | "rose" | "sky";
}

export type TaskStatus = "todo" | "in-progress" | "completed";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  projectId: string | null;
  assignee: Person | null;
  dueDate: ISODateString | null;
  tags: string[];
  createdAt: ISODateString;
  updatedAt: ISODateString;
  completedAt: ISODateString | null;
  /** Project milestone this task rolls up to (Phase 2 project tree). */
  milestoneId?: string | null;
  /** Parent task when this record is a subtask (Phase 2 project tree). */
  parentTaskId?: string | null;
}

export type MilestoneStatus = "upcoming" | "in-progress" | "at-risk" | "completed";

export interface Milestone {
  id: string;
  projectId: string;
  title: string;
  description: string;
  dueDate: ISODateString;
  status: MilestoneStatus;
  progress: number;
}

export interface NotebookEntry {
  id: string;
  title: string;
  content: string;
  createdAt: ISODateString;
  updatedAt: ISODateString;
  author: Person;
}

export interface Notebook {
  id: string;
  title: string;
  description: string;
  projectId: string | null;
  tags: string[];
  favorite: boolean;
  entries: NotebookEntry[];
  createdAt: ISODateString;
  updatedAt: ISODateString;
  author: Person;
}

export type PaperReadStatus = "unread" | "reading" | "read";

export interface Paper {
  id: string;
  title: string;
  authors: string[];
  year: number;
  journal: string;
  doi: string;
  abstract: string;
  tags: string[];
  projectId: string | null;
  readStatus: PaperReadStatus;
  favorite: boolean;
  citations: number;
  addedAt: ISODateString;
  notes?: string;
}

export type FileKind =
  | "pdf"
  | "dataset"
  | "image"
  | "document"
  | "code"
  | "spreadsheet"
  | "archive";

export interface ResearchFile {
  id: string;
  name: string;
  kind: FileKind;
  size: number;
  folderId: string | null;
  projectId: string | null;
  uploadedAt: ISODateString;
  uploadedBy: Person;
  starred: boolean;
  description?: string;
}

export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: ISODateString;
  /** Optional project association used by the Phase 2 file tree. */
  projectId?: string | null;
}

export type ActivityCategory =
  | "project"
  | "task"
  | "notebook"
  | "paper"
  | "file"
  | "milestone"
  | "research"
  | "experiment"
  | "hypothesis"
  | "decision"
  | "snapshot";

/** The kind of work a researcher spent time on. */
export type ResearchMode =
  | "reading"
  | "writing"
  | "experiment"
  | "analysis"
  | "review"
  | "admin";

export type ArtifactType =
  | "project"
  | "task"
  | "notebook"
  | "paper"
  | "file"
  | "milestone";

export interface ArtifactRef {
  type: ArtifactType;
  id: string;
  label: string;
}

/** Node kinds rendered by the Phase 2 graph views. */
export type GraphNodeType =
  | "project"
  | "experiment"
  | "run"
  | "hypothesis"
  | "paper"
  | "notebook"
  | "dataset"
  | "decision";

/** Directional relationship kinds between graph nodes. */
export type GraphEdgeType =
  | "depends"
  | "derived_from"
  | "cites"
  | "tests"
  | "links"
  | "branches";

export interface GraphNodeMetadata {
  /** Optional sub-kind, e.g. `conclusion` for a hypothesis node. */
  kind?: string;
  description?: string;
  owner?: string;
  date?: string;
  artifactType?: ArtifactType;
  artifactId?: string;
  href?: string;
  projectId?: string | null;
  tags?: string[];
  metrics?: Array<{ label: string; value: string }>;
  /** Manual layout coordinates persisted with a node. */
  position?: { x: number; y: number };
  /** External citation nodes are not part of the local library. */
  inLibrary?: boolean;
  year?: number;
  journal?: string;
  authors?: string[];
  /** Limited Phase 2/3 hand-off action, resolved by the owning page. */
  action?: "open-experiment" | "open-run-logs" | "open-artifact";
  [key: string]: unknown;
}

export interface GraphNode {
  id: string;
  type: GraphNodeType;
  label: string;
  status?: string;
  parentId?: string;
  metadata?: GraphNodeMetadata;
}

export interface GraphEdge {
  id: string;
  from: string;
  to: string;
  type: GraphEdgeType;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

/** A citation edge between two library papers (mock, not externally verified). */
export interface CitationLink {
  id: string;
  from: string;
  to: string;
}

export interface ResearchLogEntry {
  id: string;
  workspaceId: string;
  actorId: string;
  projectId: string | null;
  mode: ResearchMode;
  title: string;
  notes?: string;
  durationMinutes: number;
  artifact: ArtifactRef | null;
  /** When the work actually happened (ISO timestamp). */
  occurredAt: ISODateString;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export type ResearchFeedSource = "activity" | "research-log";

/**
 * A normalized timeline event used by the research feed. Activity events and
 * research log entries are merged into one shape so the feed can filter across
 * both sources.
 */
export interface ResearchFeedItem {
  id: string;
  source: ResearchFeedSource;
  category: ActivityCategory;
  action: string;
  target: string;
  detail?: string;
  actor: Person;
  projectId: string | null;
  artifact: ArtifactRef | null;
  mode?: ResearchMode;
  durationMinutes?: number;
  createdAt: ISODateString;
}

export interface ActivityEvent {
  id: string;
  category: ActivityCategory;
  action: string;
  target: string;
  detail?: string;
  actor: Person;
  projectId: string | null;
  createdAt: ISODateString;
  /** Workspace boundary for records created after Phase 1. */
  workspaceId?: string;
  /** Research mode when the event came from a research log entry. */
  mode?: ResearchMode;
  /** Linked research artifact, when one was attached. */
  artifact?: ArtifactRef | null;
  /** Back-reference to the research log entry that produced the event. */
  researchLogId?: string;
}

export type NotificationKind =
  | "assignment"
  | "deadline"
  | "mention"
  | "review"
  | "system";

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  description: string;
  createdAt: ISODateString;
  read: boolean;
  href?: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  plan: "Research Lab" | "Academic" | "Team";
  description: string;
  createdAt: ISODateString;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  initials: string;
  role: string;
  institution: string;
  field: string;
  bio: string;
  timezone: string;
  avatarColor: string;
}

export interface NotificationPreferences {
  taskAssignments: boolean;
  deadlineReminders: boolean;
  mentions: boolean;
  weeklyDigest: boolean;
  productUpdates: boolean;
}

export interface AppPreferences {
  theme: "light" | "dark" | "system";
  density: "comfortable" | "compact";
  reduceMotion: boolean;
  notifications: NotificationPreferences;
}

export interface AnalyticsPoint {
  week: string;
  tasks: number;
  notes: number;
  papers: number;
}

/* -------------------------------------------------------------------------- */
/* Phase 3 — Scientific Reasoning Engine                                      */
/* -------------------------------------------------------------------------- */

export type ExperimentStatus = "draft" | "queued" | "running" | "succeeded" | "failed";

export interface ParameterEntry {
  id: string;
  key: string;
  value: string;
}

export interface Experiment {
  id: string;
  workspaceId: string;
  projectId: string;
  hypothesisId: string | null;
  title: string;
  description: string;
  status: ExperimentStatus;
  parameters: ParameterEntry[];
  /** TipTap HTML scoped to this experiment. */
  notes: string;
  /** Linked notebooks and files (including datasets). */
  artifactRefs: ArtifactRef[];
  owner: Person;
  createdBy: string;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export type RunStatus = "queued" | "running" | "succeeded" | "failed";

export interface ExperimentRun {
  id: string;
  workspaceId: string;
  experimentId: string;
  projectId: string;
  runNumber: number;
  label: string;
  status: RunStatus;
  /** Immutable snapshot of the experiment parameters at creation time. */
  parameters: ParameterEntry[];
  logs: string;
  artifactRefs: ArtifactRef[];
  startedAt: ISODateString | null;
  endedAt: ISODateString | null;
  durationSeconds: number | null;
  createdBy: string;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export type HypothesisStatus = "proposed" | "testing" | "supported" | "refuted";

export interface Hypothesis {
  id: string;
  workspaceId: string;
  projectId: string;
  researchQuestion: string;
  statement: string;
  status: HypothesisStatus;
  owner: Person;
  createdBy: string;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export type EvidenceStance = "supports" | "contradicts" | "neutral";

export interface HypothesisEvidence {
  id: string;
  workspaceId: string;
  hypothesisId: string;
  stance: EvidenceStance;
  description: string;
  artifact: ArtifactRef | null;
  createdBy: string;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export type DecisionStatus = "proposed" | "accepted" | "superseded";

export interface DecisionAlternative {
  id: string;
  title: string;
  rationale: string;
}

/** A decision can reference experiment and hypothesis records as well as files. */
export type ResearchArtifactType =
  | ArtifactType
  | "experiment"
  | "hypothesis"
  | "decision";

export interface ResearchArtifactRef {
  type: ResearchArtifactType;
  id: string;
  label: string;
}

export interface ResearchDecision {
  id: string;
  workspaceId: string;
  projectId: string;
  title: string;
  context: string;
  decision: string;
  alternatives: DecisionAlternative[];
  artifacts: ResearchArtifactRef[];
  status: DecisionStatus;
  owner: Person;
  createdBy: string;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export type SnapshotArtifactType =
  | "notebook"
  | "experiment"
  | "dataset"
  | "file"
  | "decision";

/**
 * A frozen copy of the metadata of a research artifact. Manifest entries are
 * written at snapshot creation time and are never re-queried live.
 */
export interface SnapshotManifestEntry {
  id: string;
  artifactId: string;
  artifactType: SnapshotArtifactType;
  title: string;
  projectId: string;
  /** Human-readable revision, e.g. `notebook v3` or `experiment parameter set a1b2`. */
  versionRef: string | null;
  selectedAt: ISODateString;
}

export interface ResearchSnapshot {
  id: string;
  workspaceId: string;
  projectId: string;
  label: string;
  description: string;
  manifest: SnapshotManifestEntry[];
  /** Only populated when a real DOI is supplied by the researcher. */
  doi: string | null;
  createdBy: string;
  createdAt: ISODateString;
}

export type VersionArtifactType = "notebook" | "experiment" | "project" | "document";

export interface VersionSnapshotData {
  notebook?: {
    title: string;
    description: string;
    tags: string[];
    entries: NotebookEntry[];
  };
  experiment?: {
    title: string;
    description: string;
    status: ExperimentStatus;
    parameters: ParameterEntry[];
    notes: string;
    artifactRefs: ArtifactRef[];
  };
  project?: {
    title: string;
    description: string;
    objectives: string[];
    tags: string[];
    status: ProjectStatus;
    progress: number;
  };
  document?: {
    title: string;
    content: string;
  };
}

export interface ArtifactVersion {
  id: string;
  workspaceId: string;
  artifactType: VersionArtifactType;
  artifactId: string;
  versionNumber: number;
  label: string;
  summary: string;
  /** Plain-text rendering used by the diff viewer. */
  content: string;
  /** Structured snapshot used for a lossless restore. */
  data: VersionSnapshotData;
  author: Person;
  createdAt: ISODateString;
}

export interface ResearchDatabase {
  version: number;
  user: UserProfile;
  workspace: Workspace;
  preferences: AppPreferences;
  projects: Project[];
  tasks: Task[];
  milestones: Milestone[];
  notebooks: Notebook[];
  papers: Paper[];
  files: ResearchFile[];
  folders: Folder[];
  activity: ActivityEvent[];
  researchLog: ResearchLogEntry[];
  notifications: AppNotification[];
  analytics: AnalyticsPoint[];
  /** Phase 2 persisted graph records (experiments, runs, hypotheses, links). */
  graphNodes: GraphNode[];
  graphEdges: GraphEdge[];
  /** Mock citation relationships between library papers. */
  citations: CitationLink[];
  /** Phase 3 scientific reasoning collections. */
  experiments: Experiment[];
  experimentRuns: ExperimentRun[];
  hypotheses: Hypothesis[];
  evidence: HypothesisEvidence[];
  decisions: ResearchDecision[];
  snapshots: ResearchSnapshot[];
  versions: ArtifactVersion[];
}

export interface ProjectSummary {
  project: Project;
  taskCount: number;
  completedTaskCount: number;
  notebookCount: number;
  paperCount: number;
  fileCount: number;
  nextMilestone: Milestone | null;
}

export interface DashboardStats {
  activeProjects: number;
  completedProjects: number;
  pendingTasks: number;
  documents: number;
  notebookEntries: number;
  libraryPapers: number;
  overdueTasks: number;
  storageUsed: number;
}
