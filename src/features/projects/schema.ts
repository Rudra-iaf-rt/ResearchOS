import { z } from "zod";

export const projectSchema = z
  .object({
    title: z.string().trim().min(3, "Give the project a title of at least 3 characters."),
    description: z
      .string()
      .trim()
      .min(10, "Describe the research question in at least 10 characters."),
    objectives: z.string().trim().optional(),
    status: z.enum(["active", "planning", "on-hold", "completed"]),
    startDate: z.string().min(1, "Choose a start date."),
    targetDate: z.string().min(1, "Choose a target date."),
    tags: z.array(z.string()).max(8, "Use up to 8 tags."),
    progress: z.number().min(0).max(100),
  })
  .refine((data) => data.targetDate >= data.startDate, {
    message: "The target date must be on or after the start date.",
    path: ["targetDate"],
  });

export type ProjectFormValues = z.infer<typeof projectSchema>;
