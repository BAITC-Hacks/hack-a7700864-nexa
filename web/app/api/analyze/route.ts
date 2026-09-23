import { aiService } from "@/services/ai/ai-service";
import { analyzeRequestSchema } from "@/lib/validation/schemas";

export async function POST(request: Request) {
  try {
    const input = analyzeRequestSchema.parse(await request.json());
    const result = input.questions ? await aiService.buildTaskCard(input.description, input.questions, input.answers ?? ["", "", ""]) : await aiService.analyzeDraft(input.description);
    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Некорректный запрос" }, { status: 400 });
  }
}
