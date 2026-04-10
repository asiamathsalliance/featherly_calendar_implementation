import { DEMO_WORKER_ID, ensureDemoUsers } from "@/lib/demo-users";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

const bodySchema = z.object({
  action: z.enum(["accept", "request_change"]),
});

function isAwaitingWorker(
  status: string,
  interviewAt: Date | null,
  proposal: string
) {
  if (status !== "INTERVIEW" || !interviewAt) return false;
  if (proposal === "AWAITING_WORKER") return true;
  // Legacy rows before enum existed
  if (proposal === "NONE") return true;
  return false;
}

export async function PATCH(req: Request, context: Params) {
  await ensureDemoUsers();

  const { id } = await context.params;
  const application = await prisma.application.findUnique({
    where: { id },
    include: { job: true },
  });

  if (!application) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (application.workerId !== DEMO_WORKER_ID) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  if (
    !isAwaitingWorker(
      application.status,
      application.interviewAt,
      application.interviewProposalStatus
    )
  ) {
    return NextResponse.json(
      { error: "No interview proposal awaiting your response" },
      { status: 400 }
    );
  }

  if (parsed.data.action === "accept") {
    const updated = await prisma.application.update({
      where: { id },
      data: { interviewProposalStatus: "WORKER_ACCEPTED" },
      include: { job: true },
    });
    return NextResponse.json({ application: updated });
  }

  const updated = await prisma.application.update({
    where: { id },
    data: {
      interviewProposalStatus: "WORKER_REQUESTED_CHANGE",
      interviewAt: null,
    },
    include: { job: true },
  });

  return NextResponse.json({ application: updated });
}
