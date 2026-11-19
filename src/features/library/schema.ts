import { z } from "zod";

export const paperSchema = z.object({
  title: z.string().trim().min(5, "Add the paper title."),
  authors: z.string().trim().min(2, "List at least one author."),
  year: z.coerce
    .number({ invalid_type_error: "Enter a publication year." })
    .int()
    .min(1800, "Enter a valid publication year.")
    .max(new Date().getFullYear() + 1, "That year is in the future."),
  journal: z.string().trim().min(2, "Add the journal or venue."),
  doi: z.string().trim().optional(),
  abstract: z.string().trim().max(4000).optional(),
  projectId: z.string(),
  tags: z.array(z.string()).max(8, "Use up to 8 tags."),
  notes: z.string().trim().optional(),
});

export type PaperFormValues = z.infer<typeof paperSchema>;
