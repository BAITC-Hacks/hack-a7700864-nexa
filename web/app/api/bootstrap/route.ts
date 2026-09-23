import { asc, count, desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { proposals, tasks, teams } from "@/db/schema";
import { demoProposals, demoTasks, demoTeams } from "@/lib/seed";

export async function GET() {
  try {
    const db = getDb();
    const [{ total }] = await db.select({ total: count() }).from(tasks);
    if (total === 0) {
      await db.batch([
        ...demoTasks.map((task) => db.insert(tasks).values(task)),
        ...demoTeams.map((team) => db.insert(teams).values(team)),
        ...demoProposals.map((proposal) => db.insert(proposals).values(proposal)),
      ] as unknown as Parameters<typeof db.batch>[0]);
    }
    const [taskRows, teamRows, proposalRows] = await Promise.all([
      db.select().from(tasks).where(eq(tasks.published, true)).orderBy(desc(tasks.score), asc(tasks.title)),
      db.select().from(teams).orderBy(asc(teams.name)),
      db.select().from(proposals).orderBy(desc(proposals.createdAt)),
    ]);
    return Response.json({ tasks: taskRows, teams: teamRows, proposals: proposalRows });
  } catch (error) {
    console.error("bootstrap_failed", error instanceof Error ? error.message : "unknown");
    return Response.json({ error: "Хранилище временно недоступно" }, { status: 503 });
  }
}
