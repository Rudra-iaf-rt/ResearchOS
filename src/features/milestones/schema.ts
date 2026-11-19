import { z } from "zod";

export const milestoneSchema = z.object({
  title: z.string().trim().min(3, "Give the milestone a clear title."),
  description: z.string().trim().optional(),
  projectId: z.string().min(1, "Choose the project this milestone belongs to."),
  dueDate: z.string().min(1, "Choose a due date."),
  status: z.enum(["upcoming", "in-progress", "at-risk", "completed"]),
  progress: z.number().min(0).max(100),
});

export type MilestoneFormValues = z.infer<typeof milestoneSchema>;
