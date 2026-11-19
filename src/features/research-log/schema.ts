import { z } from "zod";

export const researchLogSchema = z.object({
  mode: z.enum(["reading", "writing", "experiment", "analysis", "review", "admin"]),
  title: z
    .string()
    .trim()
    .min(3, "Describe the work in at least 3 characters.")
    .max(140, "Keep the headline under 140 characters."),
  projectId: z.string(),
  artifactKey: z.string(),
  durationMinutes: z
    .number({ invalid_type_error: "Enter the time you spent in minutes." })
    .int("Use whole minutes.")
    .min(5, "Log at least 5 minutes.")
    .max(1440, "A single entry cannot exceed 24 hours."),
  occurredAt: z
    .string()
    .min(1, "Choose when this work happened.")
    .refine((value) => !Number.isNaN(new Date(value).getTime()), {
      message: "Enter a valid date and time.",
    }),
  notes: z
    .string()
    .trim()
    .max(2000, "Keep notes under 2000 characters.")
    .optional(),
});

export type ResearchLogFormValues = z.infer<typeof researchLogSchema>;
