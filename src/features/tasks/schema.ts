import { z } from "zod";

export const taskSchema = z.object({
  title: z.string().trim().min(3, "Give the task a title of at least 3 characters."),
  description: z.string().trim().optional(),
  status: z.enum(["todo", "in-progress", "completed"]),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  projectId: z.string(),
  assigneeId: z.string(),
  dueDate: z.string().optional(),
  tags: z.array(z.string()).max(6, "Use up to 6 tags."),
});

export type TaskFormValues = z.infer<typeof taskSchema>;
