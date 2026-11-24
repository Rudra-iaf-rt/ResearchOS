import { z } from "zod";

export const parameterSchema = z.object({
  id: z.string(),
  key: z.string().trim().min(1, "Parameter names cannot be empty."),
  value: z.string().trim().min(1, "Add a value for this parameter."),
});

export const experimentSchema = z
  .object({
    title: z.string().trim().min(3, "Give the experiment a title of at least 3 characters."),
    projectId: z.string().min(1, "Choose the project this experiment belongs to."),
    hypothesisId: z.string(),
    description: z
      .string()
      .trim()
      .min(10, "Describe the experiment so its purpose is clear."),
    parameters: z.array(parameterSchema).max(40, "Use up to 40 parameters."),
  })
  .superRefine((values, context) => {
    const seen = new Map<string, number>();
    values.parameters.forEach((parameter, index) => {
      const key = parameter.key.trim().toLowerCase();
      if (!key) return;
      const first = seen.get(key);
      if (first !== undefined) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["parameters", index, "key"],
          message: `“${parameter.key}” is already defined on row ${first + 1}.`,
        });
      } else {
        seen.set(key, index);
      }
    });
  });

export type ExperimentFormValues = z.infer<typeof experimentSchema>;

export const runSchema = z.object({
  label: z.string().trim().min(2, "Give the run a short label."),
});

export type RunFormValues = z.infer<typeof runSchema>;
