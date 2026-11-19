import type { Project, ProjectSummary, ResearchDatabase } from "@/types";

export function buildProjectSummary(
  db: Pick<ResearchDatabase, "tasks" | "notebooks" | "papers" | "files" | "milestones">,
  project: Project,
): ProjectSummary {
  const tasks = db.tasks.filter((task) => task.projectId === project.id);
  const today = new Date().toISOString();
  const nextMilestone =
    db.milestones
      .filter(
        (milestone) =>
          milestone.projectId === project.id &&
          milestone.status !== "completed" &&
          milestone.dueDate >= today,
      )
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0] ?? null;

  return {
    project,
    taskCount: tasks.length,
    completedTaskCount: tasks.filter((task) => task.status === "completed").length,
    notebookCount: db.notebooks.filter((n) => n.projectId === project.id).length,
    paperCount: db.papers.filter((p) => p.projectId === project.id).length,
    fileCount: db.files.filter((f) => f.projectId === project.id).length,
    nextMilestone,
  };
}
