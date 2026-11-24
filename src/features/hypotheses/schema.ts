import { z } from "zod";

export const hypothesisSchema = z.object({
  researchQuestion: z
    .string()
    .trim()
    .min(10, "Write the research question (at least 10 characters)."),
  statement: z
    .string()
    .trim()
    .min(10, "State the testable hypothesis (at least 10 characters)."),
  projectId: z.string().min(1, "Choose the project this hypothesis belongs to."),
});

export type HypothesisFormValues = z.infer<typeof hypothesisSchema>;

export const evidenceSchema = z.object({
  stance: z.enum(["supports", "contradicts", "neutral"]),
  artifactKey: z.string(),
  description: z
    .string()
    .trim()
    .min(3, "Add a short note describing what this evidence shows."),
});

export type EvidenceFormValues = z.infer<typeof evidenceSchema>;
