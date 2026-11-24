import { z } from "zod";

export const alternativeSchema = z.object({
  id: z.string(),
  title: z.string().trim().min(2, "Describe this alternative."),
  rationale: z.string().trim().default(""),
});

export const decisionSchema = z.object({
  title: z.string().trim().min(3, "Give the decision a title of at least 3 characters."),
  projectId: z.string().min(1, "Choose the project this decision belongs to."),
  context: z.string().trim().min(10, "Explain the context for this decision."),
  decision: z.string().trim().min(10, "Record the decision that was made."),
  alternatives: z.array(alternativeSchema).max(20, "Use up to 20 alternatives."),
  artifacts: z.array(z.string()).max(30, "Link up to 30 artifacts."),
  status: z.enum(["proposed", "accepted", "superseded"]),
});

export type DecisionFormValues = z.infer<typeof decisionSchema>;
