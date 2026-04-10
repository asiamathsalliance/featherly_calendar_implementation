import { DEMO_CLIENT_ID, ensureDemoUsers } from "@/lib/demo-users";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

const decisionSchema = z
  .object({
    status: z.enum(["ACCEPTED", "REJECTED", "INTERVIEW"]),
    interviewAt: z.string().min(1).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.status === "INTERVIEW" && !data.interviewAt?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "interviewAt is required when scheduling an interview",
        path: ["interviewAt"],
      });
    }
  });

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

  if (application.job.providerId !== DEMO_CLIENT_ID) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = decisionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  if (parsed.data.status === "REJECTED") {
    await prisma.application.delete({ where: { id } });
    return NextResponse.json({ deleted: true });
  }

  let interviewAt: Date | null = null;
  if (parsed.data.status === "INTERVIEW") {
    interviewAt = new Date(parsed.data.interviewAt!);
    if (Number.isNaN(interviewAt.getTime())) {
      return NextResponse.json(
        { error: "Invalid interview date" },
        { status: 422 }
      );
    }
  }

  const updated = await prisma.application.update({
    where: { id },
    data:
      parsed.data.status === "INTERVIEW"
        ? {
            status: "INTERVIEW" as const,
            interviewAt,
            interviewProposalStatus: "AWAITING_WORKER",
          }
        : { status: parsed.data.status },
    include: {
      worker: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      quiz: true,
    },
  });

  return NextResponse.json({ application: updated });
}
