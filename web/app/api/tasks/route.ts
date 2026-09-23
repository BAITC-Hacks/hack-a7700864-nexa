import { taskService } from "@/services/tasks/task-service";
import { z } from "zod";

export async function GET() {
  try { return Response.json({ tasks: await taskService.listAll() }); }
  catch { return Response.json({ error: "Не удалось загрузить задачи" }, { status: 500 }); }
}

export async function POST(request: Request) {
  try {
    return Response.json(await taskService.create(await request.json()), { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof z.ZodError ? "Проверьте обязательные поля карточки" : "Не удалось создать задачу" }, { status: 400 });
  }
}
