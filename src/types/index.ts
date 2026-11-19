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
}

export type ActivityCategory =
  | "project"
  | "task"
  | "notebook"
  | "paper"
  | "file"
  | "milestone"
  | "research";

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
