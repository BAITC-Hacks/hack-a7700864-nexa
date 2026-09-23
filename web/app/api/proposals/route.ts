import { getDb } from "@/db";
import { proposals, teams } from "@/db/schema";

const clean = (value: unknown, max = 2000) => typeof value === "string" ? value.trim().replace(/[<>]/g, "").slice(0, max) : "";

export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const teamName = clean(body.teamName, 100); const taskId = clean(body.taskId, 100);
    const solutionIdea = clean(body.solutionIdea); const plan = clean(body.plan); const estimatedTime = clean(body.estimatedTime, 120);
    if (!teamName || !taskId || !solutionIdea || !plan || !estimatedTime) return Response.json({ error: "Заполните обязательные поля" }, { status: 400 });
    const db = getDb(); const teamId = crypto.randomUUID(); const proposalId = crypto.randomUUID(); const now = new Date();
    await db.batch([
      db.insert(teams).values({ id: teamId, name: teamName, interests: "", skills: "", technologies: "" }),
      db.insert(proposals).values({ id: proposalId, taskId, teamId, solutionIdea, plan, estimatedTime, prototypeUrl: clean(body.prototypeUrl, 500), status: "PENDING", createdAt: now }),
    ]);
    return Response.json({ proposal: { id: proposalId, taskId, teamId, solutionIdea, plan, estimatedTime, prototypeUrl: clean(body.prototypeUrl, 500), status: "PENDING", createdAt: now }, team: { id: teamId, name: teamName, interests: "", skills: "", technologies: "" } }, { status: 201 });
  } catch (error) {
    console.error("proposal_create_failed", error instanceof Error ? error.message : "unknown");
    return Response.json({ error: "Не удалось отправить предложение" }, { status: 500 });
  }
}
