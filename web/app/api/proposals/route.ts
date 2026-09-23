import { proposalService } from "@/services/proposals/proposal-service";

export async function POST(request: Request) {
  try {
    return Response.json(await proposalService.create(await request.json()), { status: 201 });
  } catch (error) {
    console.error("proposal_create_failed", error instanceof Error ? error.message : "unknown");
    return Response.json({ error: error instanceof Error ? error.message : "Не удалось отправить предложение" }, { status: 400 });
  }
}
