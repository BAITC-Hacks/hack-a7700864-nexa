import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { proposals, tasks, teams } from "@/db/schema";
import { proposalInputSchema } from "@/lib/validation/schemas";

const sanitize = (value: string) => value.replace(/[<>]/g, "");
export class ProposalService {
  listByTask(taskId: string) { return getDb().select().from(proposals).where(eq(proposals.taskId, taskId)).orderBy(desc(proposals.createdAt)); }
  async create(input: unknown) {
    const parsed = proposalInputSchema.parse(input); const data = Object.fromEntries(Object.entries(parsed).map(([key, value]) => [key, sanitize(value)])) as typeof parsed;
    const db = getDb(); const teamId = crypto.randomUUID(); const proposalId = crypto.randomUUID(); const now = new Date();
    const task = (await db.select({ id: tasks.id, published: tasks.published }).from(tasks).where(eq(tasks.id, data.taskId)).limit(1))[0];
    if (!task) throw new Error("Задача не найдена");
    if (!task.published) throw new Error("Предложения доступны только для опубликованных задач");
    const team = { id: teamId, name: data.teamName, interests: "", skills: "", technologies: "", createdAt: now };
    const proposal = { id: proposalId, taskId: data.taskId, teamId, solutionIdea: data.solutionIdea, plan: data.plan, estimatedTime: data.estimatedTime, prototypeUrl: data.prototypeUrl, status: "PENDING", createdAt: now, updatedAt: now };
    await db.batch([db.insert(teams).values(team), db.insert(proposals).values(proposal)]); return { team, proposal };
  }
  async setStatus(id: string, status: "ACCEPTED" | "REJECTED") { return (await getDb().update(proposals).set({ status, updatedAt: new Date() }).where(and(eq(proposals.id, id), eq(proposals.status, "PENDING"))).returning())[0] ?? null; }
}
export const proposalService = new ProposalService();
