import { proposalService } from "@/services/proposals/proposal-service";
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const body = await request.json() as { status?: string }; if (!['ACCEPTED','REJECTED'].includes(body.status ?? '')) return Response.json({ error: "Некорректный статус" }, { status: 400 });
  return Response.json({ proposal: await proposalService.setStatus((await context.params).id, body.status as "ACCEPTED" | "REJECTED") });
}
