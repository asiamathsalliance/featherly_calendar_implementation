import { Prisma } from "@/generated/prisma";
import { DEMO_WORKER_ID, ensureDemoUsers } from "@/lib/demo-users";
import { upsertJobQuizTemplate } from "@/lib/job-quiz-template";
import { prisma } from "@/lib/prisma";
import { quizPayloadSchema } from "@/lib/quiz-schema";
import { NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  applicationId: z.string().min(1),
});

export async function POST(req: Request) {
  await ensureDemoUsers();

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const application = await prisma.application.findUnique({
    where: { id: parsed.data.applicationId },
    include: { job: true },
  });

  if (!application) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (application.workerId !== DEMO_WORKER_ID) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Always regenerate from the current job listing description,
  // so question quality tracks edits in listing text/requirements.
  const jobTemplate = await upsertJobQuizTemplate(application.job);
  const payload = quizPayloadSchema.parse({
    questions: jobTemplate.questions,
  });

  const quiz = await prisma.quizAttempt.upsert({
    where: { applicationId: application.id },
    create: {
      applicationId: application.id,
      questions: payload.questions,
    },
    update: {
      questions: payload.questions,
      answers: Prisma.DbNull,
    },
  });

  return NextResponse.json({ quiz, questions: payload.questions });
}
