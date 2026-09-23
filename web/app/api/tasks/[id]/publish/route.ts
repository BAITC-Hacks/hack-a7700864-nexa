import { taskService } from "@/services/tasks/task-service";
export async function POST(_: Request, context: { params: Promise<{ id: string }> }) {
  try { return Response.json(await taskService.publish((await context.params).id)); }
  catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Не удалось опубликовать задачу" }, { status: 400 }); }
}
