import { aiService } from "@/services/ai/ai-service";
import { analyzeRequestSchema } from "@/lib/validation/schemas";
import { z } from "zod";
export async function POST(request: Request) {
  try { const input = analyzeRequestSchema.pick({ description: true }).parse(await request.json()); return Response.json(await aiService.analyzeDraft(input.description)); }
  catch (error) { return Response.json({ error: error instanceof z.ZodError ? "Опишите задачу подробнее" : "Не удалось проанализировать задачу" }, { status: 400 }); }
}
