import { taskService } from "@/services/tasks/task-service";
export async function POST(_: Request, context: { params: Promise<{ id: string }> }) {
  const task = await taskService.confirm((await context.params).id); return task ? Response.json({ task }) : Response.json({ error: "Задача не найдена" }, { status: 404 });
}
