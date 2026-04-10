import { z } from "zod";

export const quizQuestionSchema = z.object({
  id: z.string(),
  text: z.string().min(1),
  type: z.enum(["yes_no", "likert", "open_text", "multiple_choice"]),
  scale: z.number().int().min(2).max(10).optional(),
  options: z.array(z.string().min(1)).min(2).max(8).optional(),
  optional: z.boolean().optional(),
});

export const quizPayloadSchema = z.object({
  questions: z.array(quizQuestionSchema).min(1).max(12),
});

export type QuizQuestion = z.infer<typeof quizQuestionSchema>;
export type QuizPayload = z.infer<typeof quizPayloadSchema>;

export const answersSchema = z.record(
  z.string(),
  z.union([z.boolean(), z.number(), z.string()])
);

/** Optional yes-no follow-up text keyed by question id */
export const elaborationsSchema = z.record(z.string(), z.string());
