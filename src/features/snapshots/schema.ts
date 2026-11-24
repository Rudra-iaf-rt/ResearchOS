import { z } from "zod";

export const snapshotSchema = z.object({
  label: z.string().trim().min(3, "Give the snapshot a label of at least 3 characters."),
  projectId: z.string().min(1, "Choose the project to snapshot."),
  description: z.string().trim().max(500, "Keep the description under 500 characters."),
  itemKeys: z.array(z.string()).min(1, "Select at least one item for the manifest."),
  doi: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || /^10\.\d{4,9}\/\S+$/.test(value),
      "Enter a real DOI such as 10.5281/zenodo.1234567, or leave it blank.",
    ),
});

export type SnapshotFormValues = z.infer<typeof snapshotSchema>;
