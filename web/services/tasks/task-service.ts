import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { tasks } from "@/db/schema";
import type { TaskCard } from "@/lib/domain";
import { taskInputSchema } from "@/lib/validation/schemas";
import { calculateTaskRating } from "@/services/rating/rating-service";

const sanitize = (value: string) => value.replace(/[<>]/g, "");
const normalize = (input: unknown) => { const parsed = taskInputSchema.parse(input); return Object.fromEntries(Object.entries(parsed).map(([key, value]) => [key, sanitize(value)])) as typeof parsed; };

export class TaskService {
  async listAll() { return getDb().select().from(tasks).orderBy(desc(tasks.updatedAt)); }
  async getById(id: string) { return (await getDb().select().from(tasks).where(eq(tasks.id, id)).limit(1))[0] ?? null; }
  async create(input: unknown) {
    const task = normalize(input); const rating = calculateTaskRating(task); const now = new Date();
    const [saved] = await getDb().insert(tasks).values({ ...task, id: crypto.randomUUID(), score: rating.score, readinessLevel: rating.level, confirmed: false, published: false, createdAt: now, updatedAt: now }).returning();
    return { task: saved, rating };
  }
  async update(id: string, input: unknown) {
    const task = normalize(input); const rating = calculateTaskRating(task);
    const [saved] = await getDb().update(tasks).set({ ...task, score: rating.score, readinessLevel: rating.level, confirmed: false, updatedAt: new Date() }).where(eq(tasks.id, id)).returning();
    if (!saved) throw new Error("Задача не найдена");
    return { task: saved, rating };
  }
  async confirm(id: string) {
    const [saved] = await getDb().update(tasks).set({ confirmed: true, updatedAt: new Date() }).where(eq(tasks.id, id)).returning(); return saved ?? null;
  }
  async publish(id: string) {
    const current = await this.getById(id); if (!current) throw new Error("Задача не найдена"); if (!current.confirmed) throw new Error("Сначала подтвердите карточку");
    const rating = calculateTaskRating(current as TaskCard); const [saved] = await getDb().update(tasks).set({ score: rating.score, readinessLevel: rating.level, published: true, updatedAt: new Date() }).where(eq(tasks.id, id)).returning();
    return { task: saved, rating };
  }
}
export const taskService = new TaskService();
