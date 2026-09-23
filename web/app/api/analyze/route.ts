import { aiService } from "@/services/ai/ai-service";
import { analyzeRequestSchema } from "@/lib/validation/schemas";
import { z } from "zod";

export async function POST(request: Request) {
  try {
    const input = analyzeRequestSchema.parse(await request.json());
    const result = input.questions ? await aiService.buildTaskCard(input.description, input.questions, input.answers ?? ["", "", ""]) : await aiService.analyzeDraft(input.description);
    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error instanceof z.ZodError ? "Проверьте описание, вопросы и ответы" : "Не удалось обработать AI-запрос" }, { status: 400 });
  }
}
