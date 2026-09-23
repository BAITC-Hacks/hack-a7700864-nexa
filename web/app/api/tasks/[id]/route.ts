import { taskService } from "@/services/tasks/task-service";
import { z } from "zod";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const task = await taskService.getById((await context.params).id); return task ? Response.json({ task }) : Response.json({ error: "Задача не найдена" }, { status: 404 });
}
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try { return Response.json(await taskService.update((await context.params).id, await request.json())); }
  catch (error) { return Response.json({ error: error instanceof z.ZodError ? "Проверьте обязательные поля карточки" : error instanceof Error ? error.message : "Не удалось обновить задачу" }, { status: 400 }); }
}
