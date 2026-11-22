import type { Milestone, Project, Task } from "@/types";

export type TaskTreeNodeKind = "project" | "milestone" | "task" | "subtask";

export interface TaskTreeNode {
  /** Stable tree id, prefixed by kind. */
  id: string;
  /** Raw record id (project, milestone, or task). */
  recordId: string;
  kind: TaskTreeNodeKind;
  name: string;
  status?: string;
  dueDate?: string | null;
  description?: string;
  assignee?: string;
  priority?: string;
  children: TaskTreeNode[];
}

export const UNASSIGNED_MILESTONE_ID = "__unassigned__";

function taskNode(task: Task, kind: "task" | "subtask"): TaskTreeNode {
  return {
    id: `task:${task.id}`,
    recordId: task.id,
    kind,
    name: task.title,
    status: task.status,
    dueDate: task.dueDate,
    description: task.description,
    assignee: task.assignee?.name,
    priority: task.priority,
    children: [],
  };
}

function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    const dueA = a.dueDate ?? "9999-12-31";
    const dueB = b.dueDate ?? "9999-12-31";
    if (dueA !== dueB) return dueA.localeCompare(dueB);
    return a.title.localeCompare(b.title);
  });
}

/**
 * Build the Project → Milestones → Tasks → Subtasks tree.
 *
 * Malformed relationships are kept safe: tasks pointing at a missing parent
 * or milestone are promoted rather than dropped, and cycles are broken.
 */
export function buildProjectTaskTree(
  project: Project,
  milestones: Milestone[],
  tasks: Task[],
): TaskTreeNode {
  const projectTasks = tasks.filter((task) => task.projectId === project.id);
  const taskById = new Map(projectTasks.map((task) => [task.id, task]));
  const milestoneIds = new Set(milestones.map((milestone) => milestone.id));

  const resolvedParentId = (task: Task): string | null => {
    if (!task.parentTaskId) return null;
    const parent = taskById.get(task.parentTaskId);
    if (!parent || parent.id === task.id) return null;
    // Break cycles by walking up from the proposed parent.
    let cursor: Task | undefined = parent;
    const seen = new Set<string>();
    while (cursor) {
      if (cursor.id === task.id) return null;
      if (seen.has(cursor.id)) return null;
      seen.add(cursor.id);
      cursor = cursor.parentTaskId ? taskById.get(cursor.parentTaskId) : undefined;
    }
    return parent.id;
  };

  const subtasksByParent = new Map<string, Task[]>();
  const topLevel: Task[] = [];
  projectTasks.forEach((task) => {
    const parentId = resolvedParentId(task);
    if (parentId) {
      const bucket = subtasksByParent.get(parentId) ?? [];
      bucket.push(task);
      subtasksByParent.set(parentId, bucket);
    } else {
      topLevel.push(task);
    }
  });

  const withSubtasks = (task: Task, kind: "task" | "subtask"): TaskTreeNode => {
    const node = taskNode(task, kind);
    node.children = sortTasks(subtasksByParent.get(task.id) ?? []).map((subtask) =>
      taskNode(subtask, "subtask"),
    );
    return node;
  };

  const tasksByMilestone = new Map<string, Task[]>();
  const unassigned: Task[] = [];
  sortTasks(topLevel).forEach((task) => {
    if (task.milestoneId && milestoneIds.has(task.milestoneId)) {
      const bucket = tasksByMilestone.get(task.milestoneId) ?? [];
      bucket.push(task);
      tasksByMilestone.set(task.milestoneId, bucket);
    } else {
      unassigned.push(task);
    }
  });

  const milestoneNodes = [...milestones]
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .map<TaskTreeNode>((milestone) => ({
      id: `milestone:${milestone.id}`,
      recordId: milestone.id,
      kind: "milestone",
      name: milestone.title,
      status: milestone.status,
      dueDate: milestone.dueDate,
      description: milestone.description,
      children: (tasksByMilestone.get(milestone.id) ?? [])
        .sort((a, b) => a.title.localeCompare(b.title))
        .map((task) => withSubtasks(task, "task")),
    }));

  if (unassigned.length > 0) {
    milestoneNodes.push({
      id: `milestone:${UNASSIGNED_MILESTONE_ID}`,
      recordId: UNASSIGNED_MILESTONE_ID,
      kind: "milestone",
      name: "Unassigned tasks",
      status: "unassigned",
      dueDate: null,
      description: "Tasks that are not attached to a milestone yet.",
      children: unassigned.map((task) => withSubtasks(task, "task")),
    });
  }

  return {
    id: `project:${project.id}`,
    recordId: project.id,
    kind: "project",
    name: project.title,
    status: project.status,
    dueDate: project.targetDate,
    description: project.description,
    children: milestoneNodes,
  };
}

export function findTreeNode(
  root: TaskTreeNode,
  id: string,
  parent: TaskTreeNode | null = null,
): { node: TaskTreeNode; parent: TaskTreeNode | null } | null {
  if (root.id === id) return { node: root, parent };
  for (const child of root.children) {
    const found = findTreeNode(child, id, root);
    if (found) return found;
  }
  return null;
}

export function flattenTree(root: TaskTreeNode): TaskTreeNode[] {
  return [root, ...root.children.flatMap(flattenTree)];
}

/** True when `candidateId` is inside the subtree rooted at `ancestorId`. */
export function isTaskDescendant(tasks: Task[], candidateId: string, ancestorId: string): boolean {
  const byId = new Map(tasks.map((task) => [task.id, task]));
  let cursor = byId.get(candidateId);
  const seen = new Set<string>();
  while (cursor?.parentTaskId) {
    if (cursor.parentTaskId === ancestorId) return true;
    if (seen.has(cursor.parentTaskId)) return false;
    seen.add(cursor.parentTaskId);
    cursor = byId.get(cursor.parentTaskId);
  }
  return false;
}

/**
 * Validate a task re-parent operation. Returns an error message or null.
 * Only one subtask level is supported, mirroring the project tree.
 */
export function validateTaskReparent(
  tasks: Task[],
  taskId: string,
  parentTaskId: string | null,
  projectId: string,
): string | null {
  const task = tasks.find((item) => item.id === taskId);
  if (!task) return "That task no longer exists.";
  if (task.projectId !== projectId) return "Tasks can only move within their project.";
  if (!parentTaskId) return null;
  if (parentTaskId === taskId) return "A task cannot become its own parent.";
  const parent = tasks.find((item) => item.id === parentTaskId);
  if (!parent) return "The target task no longer exists.";
  if (parent.projectId !== projectId) return "Tasks can only move within their project.";
  if (parent.parentTaskId) return "Subtasks can only be nested one level deep.";
  if (isTaskDescendant(tasks, parent.id, task.id)) {
    return "A task cannot move inside one of its own subtasks.";
  }
  return null;
}
