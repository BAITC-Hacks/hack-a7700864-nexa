import { z } from "zod";
import { AIServiceError, aiService } from "@/services/ai/ai-service";

const diagnosticRequestSchema = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("smoke") }),
  z.object({
    mode: z.literal("questions"),
    input: z.string().trim().min(12).max(4000),
  }),
]);

export async function POST(request: Request) {
  try {
    const input = diagnosticRequestSchema.parse(await request.json());
    const result = input.mode === "smoke"
      ? await aiService.diagnosticSmokeTest()
      : await aiService.diagnosticQuestionsTest(input.input);

    return Response.json(result);
  } catch (error) {
    if (error instanceof AIServiceError) {
      return Response.json({
        ok: false,
        envLoaded: error.code !== "MISSING_API_KEY",
        provider: "openai",
        model: error.model,
        realApiUsed: error.requestAttempted,
        fallbackUsed: false,
        error: error.code,
        message: error.safeMessage,
      }, { status: error.httpStatus });
    }

    if (error instanceof z.ZodError) {
      return Response.json({
        ok: false,
        error: "INVALID_REQUEST",
        message: "Diagnostic request is invalid.",
        fallbackUsed: false,
      }, { status: 400 });
    }

    return Response.json({
      ok: false,
      error: "UNKNOWN_ERROR",
      message: "OpenAI diagnostic failed.",
      fallbackUsed: false,
    }, { status: 500 });
  }
}
