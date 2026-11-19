import type { DashboardStats } from "@/types";
import { readDb } from "@/services/mock/client";
import { buildProjectSummary } from "@/features/projects/lib";
import { toLogViews } from "@/features/research-log/lib";

export const dashboardApi = {
  get: () =>
    readDb((db) => {
      const today = new Date().toISOString();
      const pendingTasks = db.tasks.filter((task) => task.status !== "completed");
      const stats: DashboardStats = {
        activeProjects: db.projects.filter((p) => p.status === "active").length,
        completedProjects: db.projects.filter((p) => p.status === "completed").length,
        pendingTasks: pendingTasks.length,
        documents: db.notebooks.length + db.papers.length + db.files.length,
        notebookEntries: db.notebooks.reduce((sum, n) => sum + n.entries.length, 0),
        libraryPapers: db.papers.length,
        overdueTasks: pendingTasks.filter((task) => task.dueDate && task.dueDate < today)
          .length,
        storageUsed: db.files.reduce((sum, file) => sum + file.size, 0),
      };

      return {
        user: db.user,
        workspace: db.workspace,
        preferences: db.preferences,
        analytics: db.analytics,
        stats,
        projects: db.projects.map((project) => buildProjectSummary(db, project)),
        tasks: db.tasks,
        milestones: db.milestones,
        notebooks: db.notebooks,
        papers: db.papers,
        files: db.files,
        activity: db.activity,
        researchLog: toLogViews(db),
        notifications: [...db.notifications].sort((a, b) =>
          b.createdAt.localeCompare(a.createdAt),
        ),
      };
    }),
};
