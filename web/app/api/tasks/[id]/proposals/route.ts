import { proposalService } from "@/services/proposals/proposal-service";
import { z } from "zod";
export async function GET(_: Request, context: { params: Promise<{ id: string }> }) { return Response.json({ proposals: await proposalService.listByTask((await context.params).id) }); }
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try { return Response.json(await proposalService.create({ ...(await request.json() as object), taskId: (await context.params).id }), { status: 201 }); }
  catch (error) { return Response.json({ error: error instanceof z.ZodError ? "Проверьте поля предложения" : error instanceof Error ? error.message : "Не удалось отправить предложение" }, { status: 400 }); }
}
