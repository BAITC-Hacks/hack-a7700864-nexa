import { aiService } from "@/services/ai/ai-service";
import { analyzeRequestSchema } from "@/lib/validation/schemas";
export async function POST(request: Request) {
  try { const input = analyzeRequestSchema.required({ questions: true, answers: true }).parse(await request.json()); return Response.json(await aiService.generateTaskCard(input.description, input.questions, input.answers)); }
  catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Некорректный запрос" }, { status: 400 }); }
}
