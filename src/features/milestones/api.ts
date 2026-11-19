import type { Milestone, MilestoneStatus } from "@/types";
import { uid } from "@/lib/format";
import { logActivity, mutateDb, readDb } from "@/services/mock/client";

export interface MilestoneInput {
  title: string;
  description: string;
  projectId: string;
  dueDate: string;
  status: MilestoneStatus;
  progress: number;
}

export const milestonesApi = {
  list: () => readDb((db) => db.milestones),

  create: (input: MilestoneInput) =>
    mutateDb((db) => {
      const milestone: Milestone = {
        id: uid("ms"),
        ...input,
      };
      db.milestones.unshift(milestone);
      logActivity(db, {
        category: "milestone",
        action: "created a milestone",
        target: milestone.title,
        projectId: milestone.projectId,
      });
      return milestone;
    }),

  update: (id: string, input: Partial<MilestoneInput>) =>
    mutateDb((db) => {
      const milestone = db.milestones.find((item) => item.id === id);
      if (!milestone) throw new Error("Milestone not found");
      Object.assign(milestone, input);
      logActivity(db, {
        category: "milestone",
        action:
          input.status === "completed"
            ? "completed a milestone"
            : "updated a milestone",
        target: milestone.title,
        projectId: milestone.projectId,
      });
      return milestone;
    }),

  remove: (id: string) =>
    mutateDb((db) => {
      const milestone = db.milestones.find((item) => item.id === id);
      db.milestones = db.milestones.filter((item) => item.id !== id);
      if (milestone) {
        logActivity(db, {
          category: "milestone",
          action: "deleted a milestone",
          target: milestone.title,
          projectId: milestone.projectId,
        });
      }
      return { id };
    }),
};
