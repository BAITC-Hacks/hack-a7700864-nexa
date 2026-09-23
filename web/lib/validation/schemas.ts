import { z } from "zod";

export const analyzeRequestSchema = z.object({
  description: z.string().trim().min(12).max(4000),
  questions: z.array(z.object({ id: z.enum(["users", "data", "success", "constraints", "result", "contact"]), question: z.string().trim().min(8).max(500) })).length(3).optional(),
  answers: z.array(z.string().trim().max(2000)).length(3).optional(),
});

export const taskInputSchema = z.object({
  title: z.string().trim().min(1).max(120), category: z.string().trim().min(1).max(60), originalDescription: z.string().trim().max(4000),
  context: z.string().trim().max(2000), need: z.string().trim().min(1).max(2000), users: z.string().trim().max(2000),
  dataMaterials: z.string().trim().max(2000), constraints: z.string().trim().max(2000), expectedResult: z.string().trim().max(2000),
  successCriteria: z.string().trim().max(2000), contact: z.string().trim().max(300), interactionFormat: z.string().trim().max(500),
});

const safePrototypeUrl = z.string().url().max(500).refine((value) => /^https?:\/\//i.test(value), "Разрешены только HTTP(S)-ссылки");
export const proposalInputSchema = z.object({ taskId: z.string().min(1).max(100), teamName: z.string().trim().min(1).max(100), solutionIdea: z.string().trim().min(1).max(2000), plan: z.string().trim().min(1).max(2000), estimatedTime: z.string().trim().min(1).max(120), prototypeUrl: z.union([z.literal(""), safePrototypeUrl]).default("") });
