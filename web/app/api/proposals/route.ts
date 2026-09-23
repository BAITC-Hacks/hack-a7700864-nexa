import { proposalService } from "@/services/proposals/proposal-service";
import { z } from "zod";

export async function POST(request: Request) {
  try {
    return Response.json(await proposalService.create(await request.json()), { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof z.ZodError ? "Проверьте поля предложения" : error instanceof Error ? error.message : "Не удалось отправить предложение" }, { status: 400 });
  }
}
