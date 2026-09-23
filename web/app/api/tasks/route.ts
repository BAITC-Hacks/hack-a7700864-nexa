import { getDb } from "@/db";
import { tasks } from "@/db/schema";
import { calculateScore } from "@/lib/score";
import type { TaskCard } from "@/lib/domain";

const clean = (value: unknown, max = 2000) => typeof value === "string" ? value.trim().replace(/[<>]/g, "").slice(0, max) : "";

export async function POST(request: Request) {
  try {
    const body = await request.json() as TaskCard;
    const card: TaskCard = {
      title: clean(body.title, 120), category: clean(body.category, 60), originalDescription: clean(body.originalDescription),
      context: clean(body.context), need: clean(body.need), users: clean(body.users), dataMaterials: clean(body.dataMaterials),
      constraints: clean(body.constraints), expectedResult: clean(body.expectedResult), successCriteria: clean(body.successCriteria),
      contact: clean(body.contact, 300), interactionFormat: clean(body.interactionFormat, 500),
    };
    if (!card.title || !card.need) return Response.json({ error: "Заполните название и потребность" }, { status: 400 });
    const score = calculateScore(card);
    const now = new Date();
    const row = { ...card, id: crypto.randomUUID(), score: score.total, readinessLevel: score.level, confirmed: true, published: true, createdAt: now, updatedAt: now };
    const [saved] = await getDb().insert(tasks).values(row).returning();
    return Response.json({ task: saved }, { status: 201 });
  } catch (error) {
    console.error("task_create_failed", error instanceof Error ? error.message : "unknown");
    return Response.json({ error: "Не удалось опубликовать задачу" }, { status: 500 });
  }
}
