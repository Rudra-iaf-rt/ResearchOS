import type {
  Milestone,
  Project,
  ProjectStatus,
  ProjectSummary,
  Task,
} from "@/types";
import { uid } from "@/lib/format";
import { logActivity, mutateDb, readDb } from "@/services/mock/client";
import { recordArtifactVersion } from "@/features/history/lib";
import { buildProjectSummary } from "./lib";

export interface ProjectInput {
  title: string;
  description: string;
  objectives: string[];
  status: ProjectStatus;
  startDate: string;
  targetDate: string;
  tags: string[];
  progress?: number;
}

const accents: Project["accent"][] = ["teal", "indigo", "amber", "sky", "rose"];

export const projectsApi = {
  list: () => readDb((db) => db.projects),

  async summaries(): Promise<ProjectSummary[]> {
    return readDb((db) => db.projects.map((project) => buildProjectSummary(db, project)));
  },

  async get(id: string): Promise<{
    project: Project;
    milestones: Milestone[];
    tasks: Task[];
  }> {
    return readDb((db) => {
      const project = db.projects.find((item) => item.id === id);
      if (!project) throw new Error("Project not found");
      return {
        project,
        milestones: db.milestones.filter((m) => m.projectId === id),
        tasks: db.tasks.filter((t) => t.projectId === id),
      };
    });
  },

  create: (input: ProjectInput) =>
    mutateDb((db) => {
      const now = new Date().toISOString();
      const project: Project = {
        id: uid("proj"),
        title: input.title,
        description: input.description,
        objectives: input.objectives,
        status: input.status,
        progress: input.progress ?? (input.status === "completed" ? 100 : 0),
        tags: input.tags,
        startDate: input.startDate,
        targetDate: input.targetDate,
        createdAt: now,
        updatedAt: now,
        owner: {
          id: db.user.id,
          name: db.user.name,
          initials: db.user.initials,
          role: db.user.role,
          color: db.user.avatarColor,
        },
        members: [
          {
            id: db.user.id,
            name: db.user.name,
            initials: db.user.initials,
            role: db.user.role,
            color: db.user.avatarColor,
          },
        ],
        accent: accents[db.projects.length % accents.length],
      };
      db.projects.unshift(project);
      logActivity(db, {
        category: "project",
        action: "created a project",
        target: project.title,
        projectId: project.id,
      });
      return project;
    }),

  update: (id: string, input: Partial<ProjectInput>) =>
    mutateDb((db) => {
      const project = db.projects.find((item) => item.id === id);
      if (!project) throw new Error("Project not found");
      Object.assign(project, input, { updatedAt: new Date().toISOString() });
      if (project.status === "completed") project.progress = 100;
      recordArtifactVersion(db, "project", project.id, {
        label: "Project details updated",
        summary: "A new project version was recorded after the project details changed.",
      });
      logActivity(db, {
        category: "project",
        action: "updated project details",
        target: project.title,
        projectId: project.id,
      });
      return project;
    }),

  setStatus: (id: string, status: ProjectStatus) =>
    mutateDb((db) => {
      const project = db.projects.find((item) => item.id === id);
      if (!project) throw new Error("Project not found");
      project.status = status;
      project.updatedAt = new Date().toISOString();
      if (status === "completed") project.progress = 100;
      recordArtifactVersion(db, "project", project.id, {
        label: `Status changed to ${status}`,
        summary: `Project status moved to ${status}.`,
      });
      logActivity(db, {
        category: "project",
        action: status === "completed" ? "marked the project complete" : "changed project status",
        target: project.title,
        detail: status,
        projectId: project.id,
      });
      return project;
    }),

  remove: (id: string) =>
    mutateDb((db) => {
      const project = db.projects.find((item) => item.id === id);
      db.projects = db.projects.filter((item) => item.id !== id);
      db.tasks = db.tasks.filter((task) => task.projectId !== id);
      db.milestones = db.milestones.filter((m) => m.projectId !== id);
      db.notebooks = db.notebooks.map((n) =>
        n.projectId === id ? { ...n, projectId: null } : n,
      );
      db.papers = db.papers.map((p) =>
        p.projectId === id ? { ...p, projectId: null } : p,
      );
      db.files = db.files.map((f) =>
        f.projectId === id ? { ...f, projectId: null } : f,
      );
      db.versions = db.versions.filter(
        (version) => !(version.artifactType === "project" && version.artifactId === id),
      );
      if (project) {
        logActivity(db, {
          category: "project",
          action: "deleted a project",
          target: project.title,
        });
      }
      return { id };
    }),
};
