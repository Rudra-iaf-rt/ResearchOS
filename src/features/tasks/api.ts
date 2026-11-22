import type { ResearchDatabase, Task, TaskPriority, TaskStatus } from "@/types";
import { uid } from "@/lib/format";
import { logActivity, mutateDb, readDb } from "@/services/mock/client";
import { people } from "@/services/mock/seed";
import { validateTaskReparent } from "@/features/graph/lib/task-tree";

export interface TaskInput {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  projectId: string | null;
  assigneeId?: string | null;
  dueDate?: string | null;
  tags: string[];
  milestoneId?: string | null;
  parentTaskId?: string | null;
}

export interface ReparentTaskInput {
  milestoneId?: string | null;
  parentTaskId?: string | null;
}

function resolveAssignee(id: string | null | undefined) {
  if (!id) return null;
  return people[id] ?? null;
}

function adjustProjectProgress(
  db: ResearchDatabase,
  projectId: string | null,
  delta: number,
) {
  if (!projectId) return;
  const project = db.projects.find((item) => item.id === projectId);
  if (!project) return;
  project.progress = Math.max(0, Math.min(98, project.progress + delta));
  project.updatedAt = new Date().toISOString();
}

export const tasksApi = {
  list: () => readDb((db) => db.tasks),

  create: (input: TaskInput) =>
    mutateDb((db) => {
      const now = new Date().toISOString();
      const task: Task = {
        id: uid("task"),
        title: input.title,
        description: input.description,
        status: input.status,
        priority: input.priority,
        projectId: input.projectId,
        assignee: resolveAssignee(input.assigneeId),
        dueDate: input.dueDate ?? null,
        tags: input.tags,
        createdAt: now,
        updatedAt: now,
        completedAt: input.status === "completed" ? now : null,
        milestoneId: input.milestoneId ?? null,
        parentTaskId: input.parentTaskId ?? null,
      };
      db.tasks.unshift(task);
      if (task.parentTaskId) {
        const error = validateTaskReparent(
          db.tasks,
          task.id,
          task.parentTaskId,
          task.projectId ?? "",
        );
        if (error) throw new Error(error);
        const parent = db.tasks.find((item) => item.id === task.parentTaskId);
        task.milestoneId = task.milestoneId ?? parent?.milestoneId ?? null;
      }
      logActivity(db, {
        category: "task",
        action: "created a task",
        target: task.title,
        projectId: task.projectId,
      });
      return task;
    }),

  update: (id: string, input: Partial<TaskInput>) =>
    mutateDb((db) => {
      const task = db.tasks.find((item) => item.id === id);
      if (!task) throw new Error("Task not found");
      const { assigneeId, ...rest } = input;
      const previousStatus = task.status;
      Object.assign(task, rest);
      if (assigneeId !== undefined) task.assignee = resolveAssignee(assigneeId);
      if (input.status && input.status !== previousStatus) {
        task.completedAt = input.status === "completed" ? new Date().toISOString() : null;
        adjustProjectProgress(db, task.projectId, input.status === "completed" ? 2 : -2);
      }
      task.updatedAt = new Date().toISOString();
      logActivity(db, {
        category: "task",
        action:
          input.status === "completed" && previousStatus !== "completed"
            ? "completed a task"
            : "updated a task",
        target: task.title,
        projectId: task.projectId,
      });
      return task;
    }),

  setStatus: (id: string, status: TaskStatus) =>
    mutateDb((db) => {
      const task = db.tasks.find((item) => item.id === id);
      if (!task) throw new Error("Task not found");
      if (task.status !== status) {
        const progressDelta =
          status === "completed" ? 2 : task.status === "completed" ? -2 : 0;
        task.status = status;
        task.completedAt = status === "completed" ? new Date().toISOString() : null;
        task.updatedAt = new Date().toISOString();
        adjustProjectProgress(db, task.projectId, progressDelta);
        logActivity(db, {
          category: "task",
          action: status === "completed" ? "completed a task" : "moved a task",
          target: task.title,
          detail: status === "completed" ? undefined : `to ${status.replace("-", " ")}`,
          projectId: task.projectId,
        });
      }
      return task;
    }),

  rename: (id: string, title: string) =>
    mutateDb((db) => {
      const task = db.tasks.find((item) => item.id === id);
      if (!task) throw new Error("Task not found");
      const next = title.trim();
      if (!next) throw new Error("Task title cannot be empty");
      task.title = next;
      task.updatedAt = new Date().toISOString();
      return task;
    }),

  /**
   * Move a task under a milestone or another task. Invalid parents (self,
   * descendants, cross-project, or a second subtask level) are rejected
   * before anything is written.
   */
  reparent: (id: string, input: ReparentTaskInput) =>
    mutateDb((db) => {
      const task = db.tasks.find((item) => item.id === id);
      if (!task) throw new Error("Task not found");

      if (input.parentTaskId !== undefined) {
        const error = validateTaskReparent(
          db.tasks,
          task.id,
          input.parentTaskId,
          task.projectId ?? "",
        );
        if (error) throw new Error(error);
        task.parentTaskId = input.parentTaskId;
        if (input.parentTaskId) {
          const parent = db.tasks.find((item) => item.id === input.parentTaskId);
          if (parent?.milestoneId) task.milestoneId = parent.milestoneId;
        }
      }

      if (input.milestoneId !== undefined) {
        if (input.milestoneId) {
          const milestone = db.milestones.find((item) => item.id === input.milestoneId);
          if (!milestone) throw new Error("Milestone not found");
          if (milestone.projectId !== task.projectId) {
            throw new Error("Milestones can only contain tasks from the same project.");
          }
        }
        task.milestoneId = input.milestoneId;
      }

      task.updatedAt = new Date().toISOString();
      logActivity(db, {
        category: "task",
        action: "reorganized a task",
        target: task.title,
        projectId: task.projectId,
      });
      return task;
    }),

  remove: (id: string) =>
    mutateDb((db) => {
      const task = db.tasks.find((item) => item.id === id);
      db.tasks = db.tasks.filter((item) => item.id !== id);
      // Orphaned subtasks are promoted rather than deleted silently.
      db.tasks = db.tasks.map((item) =>
        item.parentTaskId === id ? { ...item, parentTaskId: null } : item,
      );
      if (task) {
        logActivity(db, {
          category: "task",
          action: "deleted a task",
          target: task.title,
          projectId: task.projectId,
        });
      }
      return { id };
    }),
};
