import { z } from "zod";

export const notebookSchema = z.object({
  title: z.string().trim().min(3, "Give the notebook a title of at least 3 characters."),
  description: z
    .string()
    .trim()
    .min(10, "Add a short description so collaborators know what lives here."),
  projectId: z.string(),
  tags: z.array(z.string()).max(8, "Use up to 8 tags."),
});

export type NotebookFormValues = z.infer<typeof notebookSchema>;
