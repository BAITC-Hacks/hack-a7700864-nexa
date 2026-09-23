import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { proposals } from "@/db/schema";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params; const body = await request.json() as { status?: string };
    if (!id || !["ACCEPTED", "REJECTED"].includes(body.status ?? "")) return Response.json({ error: "Некорректный статус" }, { status: 400 });
    const [proposal] = await getDb().update(proposals).set({ status: body.status! }).where(eq(proposals.id, id)).returning();
    return Response.json({ proposal });
  } catch (error) {
    console.error("proposal_update_failed", error instanceof Error ? error.message : "unknown");
    return Response.json({ error: "Не удалось изменить статус" }, { status: 500 });
  }
}
