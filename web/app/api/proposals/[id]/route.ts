import { proposalService } from "@/services/proposals/proposal-service";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params; const body = await request.json() as { status?: string };
    if (!id || !["ACCEPTED", "REJECTED"].includes(body.status ?? "")) return Response.json({ error: "Некорректный статус" }, { status: 400 });
    const proposal = await proposalService.setStatus(id, body.status as "ACCEPTED" | "REJECTED");
    return Response.json({ proposal });
  } catch (error) {
    console.error("proposal_update_failed", error instanceof Error ? error.message : "unknown");
    return Response.json({ error: "Не удалось изменить статус" }, { status: 500 });
  }
}
